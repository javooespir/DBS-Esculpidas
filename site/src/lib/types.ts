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
