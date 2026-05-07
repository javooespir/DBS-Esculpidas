import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await getSessionFromCookies())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  const { data: service } = await supabaseAdmin
    .from("services")
    .select("duration_minutes")
    .eq("id", body.service_id)
    .single();
  if (!service) return NextResponse.json({ error: "Servicio inválido" }, { status: 400 });

  const scheduled_at = new Date(body.scheduled_at);
  if (Number.isNaN(scheduled_at.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("appointments").insert({
    service_id: body.service_id,
    client_name: String(body.client_name).slice(0, 100),
    client_phone: String(body.client_phone).slice(0, 30),
    client_email: String(body.client_email).slice(0, 120).toLowerCase(),
    scheduled_at: scheduled_at.toISOString(),
    duration_minutes: service.duration_minutes,
    status: body.confirmed ? "deposit_paid" : "pending",
    notes: body.notes ? String(body.notes).slice(0, 500) : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
