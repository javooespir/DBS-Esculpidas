import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Buscar turnos activos por email o teléfono del cliente. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();

  // Al menos uno de los dos debe estar presente
  if (!email && !phone) {
    return NextResponse.json({ error: "Ingresá tu email o teléfono" }, { status: 400 });
  }
  if (email && !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  // Construir filtro OR
  let query = supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, client_name, services(name)")
    .neq("status", "cancelled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (email && phone) {
    query = query.or(`client_email.eq.${email},client_phone.eq.${phone}`);
  } else if (email) {
    query = query.eq("client_email", email);
  } else {
    query = query.eq("client_phone", phone);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointments: data ?? [] });
}
