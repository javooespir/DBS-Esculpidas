import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const serviceId = searchParams.get("service");
  const extraDuration = Number(searchParams.get("extra_duration") ?? 0) || 0;

  if (!dateStr || !serviceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Parse date as UTC (representando 00:00 del día en ART)
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  // Service para obtener duración
  const { data: service, error: svcErr } = await supabaseAdmin
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();

  if (svcErr || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  // Rango del día
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Turnos no cancelados
  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, duration_minutes")
    .gte("scheduled_at", dayStart.toISOString())
    .lte("scheduled_at", dayEnd.toISOString())
    .neq("status", "cancelled");

  // Bloqueos manuales que tocan el día
  const { data: blocks } = await supabaseAdmin
    .from("blocked_slots")
    .select("start_at, end_at")
    .lte("start_at", dayEnd.toISOString())
    .gte("end_at", dayStart.toISOString());

  const slots = computeAvailableSlots(
    date,
    service.duration_minutes + extraDuration,
    appointments ?? [],
    blocks ?? []
  );

  return NextResponse.json({
    slots: slots.map((s) => ({
      start: s.start.toISOString(),
      available: s.available,
      reason: s.reason,
    })),
  });
}
