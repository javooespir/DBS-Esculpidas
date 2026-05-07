import { supabaseAdmin } from "@/lib/supabase/admin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { AppointmentWithService, BlockedSlot, Service } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const now = new Date().toISOString();
  // Traemos turnos desde 7 días atrás (para historial reciente y papelera)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ data: appointments }, { data: blocks }, { data: services }] = await Promise.all([
    supabaseAdmin
      .from("appointments")
      .select("*, services(*)")
      .gte("scheduled_at", sevenDaysAgo)
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin
      .from("blocked_slots")
      .select("*")
      .gte("end_at", now)
      .order("start_at", { ascending: true }),
    supabaseAdmin.from("services").select("*").order("display_order"),
  ]);

  return (
    <AdminDashboard
      appointments={(appointments ?? []) as AppointmentWithService[]}
      blocks={(blocks ?? []) as BlockedSlot[]}
      services={(services ?? []) as Service[]}
    />
  );
}
