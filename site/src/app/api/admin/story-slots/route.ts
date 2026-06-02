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

  const [closeH, closeM] = hours.close.split(":").map(Number);
  // Tiempo de cierre en minutos desde medianoche
  const closeMinutes = closeH * 60 + closeM;

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

  // Calculamos slots con duración mínima de 30 min para ver todos los posibles
  const slots30 = computeAvailableSlots(
    date,
    30,
    appointments ?? [],
    blocks ?? []
  );

  // Calculamos con 60 min para saber cuáles admiten tratamientos más largos
  const slots60 = computeAvailableSlots(
    date,
    60,
    appointments ?? [],
    blocks ?? []
  );
  const available60Set = new Set(
    slots60.filter((s) => s.available).map((s) => s.start.toISOString())
  );

  const result = slots30
    .filter((s) => s.available)
    .map((s) => {
      const slotH = s.start.getHours();
      const slotMin = s.start.getMinutes();
      const slotMinutes = slotH * 60 + slotMin;

      // Es "último slot" si solo cabe un tratamiento de 30 min (no 60 min)
      const isLastSlot = !available60Set.has(s.start.toISOString())
        || (closeMinutes - slotMinutes) <= 30;

      return {
        start: s.start.toISOString(),
        lastSlot: isLastSlot,
      };
    });

  return NextResponse.json({ slots: result, closeTime: hours.close });
}
