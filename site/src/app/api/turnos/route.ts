import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeAvailableSlots } from "@/lib/slots";
import { sendBookingConfirmation, notifyAdminNewBooking } from "@/lib/email";

export const dynamic = "force-dynamic";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhone = (s: string) => /^[+\d\s\-()]{8,20}$/.test(s);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const service_id = String(body.service_id ?? "");
  const scheduled_at = String(body.scheduled_at ?? "");
  const client_name = String(body.client_name ?? "").trim();
  const client_phone = String(body.client_phone ?? "").trim();
  const client_email = String(body.client_email ?? "").trim().toLowerCase();
  const notes = body.notes ? String(body.notes).slice(0, 500) : null;

  // Validaciones
  if (!service_id || !scheduled_at) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  if (client_name.length < 2 || client_name.length > 100)
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  if (!isPhone(client_phone)) return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  if (!isEmail(client_email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const start = new Date(scheduled_at);
  if (Number.isNaN(start.getTime())) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });

  // Service
  const { data: service, error: svcErr } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("id", service_id)
    .eq("active", true)
    .single();
  if (svcErr || !service) return NextResponse.json({ error: "Servicio inválido" }, { status: 400 });

  // Re-validar disponibilidad server-side (defensa anti-race)
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(start);
  dayEnd.setHours(23, 59, 59, 999);

  const [{ data: existing }, { data: blocks }] = await Promise.all([
    supabaseAdmin
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .neq("status", "cancelled"),
    supabaseAdmin
      .from("blocked_slots")
      .select("start_at, end_at")
      .lte("start_at", dayEnd.toISOString())
      .gte("end_at", dayStart.toISOString()),
  ]);

  const slots = computeAvailableSlots(start, service.duration_minutes, existing ?? [], blocks ?? []);
  const matching = slots.find((s) => s.start.getTime() === start.getTime());
  if (!matching || !matching.available) {
    return NextResponse.json({ error: "Ese horario ya no está disponible" }, { status: 409 });
  }

  const { data: created, error: insertErr } = await supabaseAdmin
    .from("appointments")
    .insert({
      service_id,
      client_name,
      client_phone,
      client_email,
      scheduled_at: start.toISOString(),
      duration_minutes: service.duration_minutes,
      status: "pending",
      notes,
    })
    .select()
    .single();

  if (insertErr || !created) {
    console.error(insertErr);
    return NextResponse.json({ error: "No se pudo guardar el turno" }, { status: 500 });
  }

  // Emails (no fallar la reserva si email falla)
  const info = {
    id: created.id,
    client_name,
    client_email,
    client_phone,
    scheduled_at: created.scheduled_at,
    service_name: service.name,
    price: service.price_ars,
    deposit: service.deposit_ars,
  };
  Promise.all([sendBookingConfirmation(info), notifyAdminNewBooking(info)]).catch((e) =>
    console.error("Email error:", e)
  );

  return NextResponse.json({ id: created.id, ok: true });
}
