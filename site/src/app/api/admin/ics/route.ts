import { NextResponse } from "next/server";
import { createEvents, type EventAttributes } from "ics";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSessionFromCookies } from "@/lib/auth";
import { BUSINESS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSessionFromCookies())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const since = new Date(Date.now() - 86400000).toISOString();
  const { data } = await supabaseAdmin
    .from("appointments")
    .select("*, services(name)")
    .gte("scheduled_at", since)
    .neq("status", "cancelled");

  const events: EventAttributes[] = (data ?? []).map((a) => {
    const start = new Date(a.scheduled_at);
    return {
      title: `${a.services?.name ?? "Turno"} — ${a.client_name}`,
      description: `Cliente: ${a.client_name}\nTel: ${a.client_phone}\nEmail: ${a.client_email}${a.notes ? `\nNotas: ${a.notes}` : ""}`,
      location: BUSINESS.address,
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      duration: { minutes: a.duration_minutes },
      uid: `${a.id}@dbsesculpidas`,
      status: a.status === "deposit_paid" ? "CONFIRMED" : "TENTATIVE",
    };
  });

  const { value, error } = createEvents(events);
  if (error || !value) {
    return NextResponse.json({ error: "No se pudo generar ICS" }, { status: 500 });
  }

  return new NextResponse(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="dbs-esculpidas-${new Date().toISOString().split("T")[0]}.ics"`,
    },
  });
}
