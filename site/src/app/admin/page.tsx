import { supabaseAdmin } from "@/lib/supabase/admin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { AppointmentWithService, BlockedSlot, Service, Testimonial } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const now = new Date().toISOString();
  const [{ data: upcoming }, { data: blocks }, { data: services }, { data: testimonials }] = await Promise.all([
    supabaseAdmin
      .from("appointments")
      .select("*, services(*)")
      .gte("scheduled_at", new Date(Date.now() - 86400000).toISOString())
      .order("scheduled_at", { ascending: true }),
    supabaseAdmin
      .from("blocked_slots")
      .select("*")
      .gte("end_at", now)
      .order("start_at", { ascending: true }),
    supabaseAdmin.from("services").select("*").order("display_order"),
    supabaseAdmin.from("testimonials").select("*").order("display_order"),
  ]);

  return (
    <AdminDashboard
      appointments={(upcoming ?? []) as AppointmentWithService[]}
      blocks={(blocks ?? []) as BlockedSlot[]}
      services={(services ?? []) as Service[]}
      testimonials={(testimonials ?? []) as Testimonial[]}
    />
  );
}
