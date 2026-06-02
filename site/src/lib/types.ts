export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_ars: number;
  duration_minutes: number;
  deposit_ars: number;
  active: boolean;
  display_order: number;
  created_at: string;
  is_addon: boolean;
  addon_per_nail: boolean;
};

export type ExtraSelection = {
  service_id: string;
  slug: string;
  name: string;
  quantity: number; // 1 for most extras, 1-9 for per-nail
  unit_price: number;
  unit_duration: number;
  total_price: number;
  total_duration: number;
};

export type Appointment = {
  id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "deposit_paid" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: "client" | "admin" | null;
  created_at: string;
  updated_at: string;
  extras: ExtraSelection[];
};

export type AppointmentWithService = Appointment & { services: Service | null };

export type BlockedSlot = {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  created_at: string;
};

export type Testimonial = {
  id: string;
  client_name: string;
  text: string;
  rating: number;
  visible: boolean;
  display_order: number;
  created_at: string;
};
