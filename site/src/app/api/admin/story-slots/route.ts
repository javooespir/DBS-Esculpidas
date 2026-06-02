import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";
import { computeAvailableSlots } from "@/lib/slots";
import { BUSINESS_HOURS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getSessionFromCookies())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  if (!dateStr) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  // Día de la semana (0=dom...6=sáb)
  const localDate = new Date(y, m - 1, d);
  const dow = localDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hours = BUSINESS_HOURS[dow];
  if (!hours) {
    return NextResponse.json({ slots: [], closedDay: true });
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { data: appointments } = await supabaseAdmin
    .from("appointments")
    .select("scheduled_at, duration_minutes")
    .gte("scheduled_at", dayStart.toISOString())
    .lte("scheduled_at", dayEnd.toISOString())
    .neq("status", "cancelled");

  const { data: blocks } = await supabaseAdmin
    .from("blocked_slots")
    .select("start_at, end_at")
    .lte("start_at", dayEnd.toISOString())
    .gte("end_at", dayStart.toISOString());

  // Pasamos new Date(0) como "now" para que no aplique la restricción de
  // anticipación mínima (24hs) — el admin puede ver todos los slots del día
  const PAST = new Date(0);

  const slots = computeAvailableSlots(
    date,
    30,
    appointments ?? [],
    blocks ?? [],
    PAST
  );

  const result = slots
    .filter((s) => s.available)
    .map((s) => ({
      start: s.start.toISOString(),
      lastSlot: false,
    }));

  return NextResponse.json({ slots: result, closeTime: hours.close });
}
