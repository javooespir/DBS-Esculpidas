import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendCancellationEmail } from "@/lib/email";
import { getSessionFromCookies } from "@/lib/auth";
import { BOOKING_RULES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Cancelar turno. Cliente puede cancelar si > 24hs. Admin puede cancelar siempre. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isAdmin = await getSessionFromCookies();

  let body: { reason?: string; client_email?: string; client_phone?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body OK */
  }

  const { data: appt, error } = await supabaseAdmin
    .from("appointments")
    .select("*, services(*)")
    .eq("id", id)
    .single();

  if (error || !appt) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  if (appt.status === "cancelled")
    return NextResponse.json({ error: "Ya estaba cancelado" }, { status: 409 });

  // Si no es admin, validar que el email O teléfono coincida (verificación liviana)
  if (!isAdmin) {
    const emailOk =
      body.client_email &&
      appt.client_email &&
      body.client_email.toLowerCase() === appt.client_email.toLowerCase();
    const phoneOk =
      body.client_phone &&
      appt.client_phone &&
      body.client_phone.replace(/\D/g, "") === appt.client_phone.replace(/\D/g, "");
    if (!emailOk && !phoneOk) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const hoursAhead = (new Date(appt.scheduled_at).getTime() - Date.now()) / 3600000;
    if (hoursAhead < BOOKING_RULES.cancellation.noRefundHoursAhead) {
      return NextResponse.json(
        { error: "No se puede cancelar online con menos de 24hs. Contactanos por WhatsApp." },
        { status: 403 }
      );
    }
  }

  const { error: updErr } = await supabaseAdmin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: isAdmin ? "admin" : "client",
      cancellation_reason: body.reason ?? null,
    })
    .eq("id", id);

  if (updErr) return NextResponse.json({ error: "No se pudo cancelar" }, { status: 500 });

  // Email (no bloqueante)
  sendCancellationEmail(
    {
      id: appt.id,
      client_name: appt.client_name,
      client_email: appt.client_email,
      client_phone: appt.client_phone,
      scheduled_at: appt.scheduled_at,
      service_name: appt.services?.name ?? "Servicio",
      price: appt.services?.price_ars ?? 0,
      deposit: appt.services?.deposit_ars ?? 0,
    },
    isAdmin ? "admin" : "client",
    body.reason
  ).catch((e) => console.error("email error", e));

  return NextResponse.json({ ok: true });
}

/** Update — solo admin. Permite confirmar seña, reprogramar, agregar notas */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await getSessionFromCookies();
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const update: Record<string, unknown> = {};
  if (body.status && ["pending", "deposit_paid", "completed", "no_show"].includes(body.status)) {
    update.status = body.status;
    // Si estamos restaurando desde cancelado, limpiar campos de cancelación
    update.cancelled_at = null;
    update.cancelled_by = null;
    update.cancellation_reason = null;
  }
  if (body.scheduled_at) update.scheduled_at = body.scheduled_at;
  if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).slice(0, 500) : null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("appointments").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
