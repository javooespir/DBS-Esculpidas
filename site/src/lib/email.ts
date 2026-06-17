/**
 * Email vía Gmail SMTP con Nodemailer.
 * Usa app password (no la real de Gmail).
 */
import nodemailer from "nodemailer";
import { BUSINESS, whatsappLink } from "./constants";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  });
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const baseTemplate = (title: string, body: string) => `
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: -apple-system, system-ui, Segoe UI, Roboto, sans-serif; background:#FAFAFA; color:#0F0F0F; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border:1px solid #E8C5D8; border-radius:16px; padding:32px;">
    <h1 style="font-family: Georgia, serif; font-weight:500; font-size:24px; margin:0 0 24px; color:#0F0F0F;">${BUSINESS.name}</h1>
    ${body}
    <hr style="border:none; border-top:1px solid #E8C5D8; margin:32px 0;">
    <p style="font-size:12px; color:#6B6B6B; margin:0;">
      ${BUSINESS.address}<br>
      WhatsApp: +${BUSINESS.phone} · Instagram: @${BUSINESS.instagram}
    </p>
  </div>
</body>
</html>`;

type AppointmentInfo = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  scheduled_at: string;
  service_name: string;
  price: number;
  deposit: number;
};

export async function sendBookingConfirmation(a: AppointmentInfo) {
  const wa = whatsappLink(`Hola! Acabo de reservar el turno para ${a.service_name} el ${fmtDate(a.scheduled_at)}. Mi nombre es ${a.client_name}.`);
  const html = baseTemplate(
    "Tu turno está reservado",
    `
    <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">¡Hola ${a.client_name}!</p>
    <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
      Reservamos tu turno. Para confirmarlo necesitamos que envíes la seña por transferencia.
    </p>
    <table style="width:100%; border-collapse:collapse; margin:0 0 24px;">
      <tr><td style="padding:8px 0; color:#6B6B6B; font-size:13px; text-transform:uppercase; letter-spacing:0.1em;">Servicio</td><td style="padding:8px 0; font-weight:500;">${a.service_name}</td></tr>
      <tr><td style="padding:8px 0; color:#6B6B6B; font-size:13px; text-transform:uppercase; letter-spacing:0.1em;">Fecha y hora</td><td style="padding:8px 0; font-weight:500;">${fmtDate(a.scheduled_at)}</td></tr>
      <tr><td style="padding:8px 0; color:#6B6B6B; font-size:13px; text-transform:uppercase; letter-spacing:0.1em;">Precio total</td><td style="padding:8px 0; font-weight:500;">${fmtMoney(a.price)}</td></tr>
      <tr><td style="padding:8px 0; color:#6B6B6B; font-size:13px; text-transform:uppercase; letter-spacing:0.1em;">Seña requerida</td><td style="padding:8px 0; font-weight:500; color:#A85F7F;">${fmtMoney(a.deposit)}</td></tr>
    </table>
    <p style="font-size:14px; line-height:1.6; margin:0 0 24px; color:#6B6B6B;">
      Política: cancelaciones con 48hs de anticipación tienen devolución de seña. Con 24hs no hay devolución. Las reprogramaciones mantienen la seña.
    </p>
    <a href="${wa}" style="display:inline-block; padding:12px 24px; background:#0F0F0F; color:#fff; text-decoration:none; border-radius:999px; font-size:14px; letter-spacing:0.08em; text-transform:uppercase;">Avisar por WhatsApp</a>
    `
  );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.GMAIL_USER}>`,
    to: a.client_email,
    subject: `Tu turno en ${BUSINESS.name} — ${fmtDate(a.scheduled_at)}`,
    html,
  });
}

export async function notifyAdminNewBooking(a: AppointmentInfo) {
  const html = baseTemplate(
    "Nueva reserva",
    `
    <p style="font-size:16px; margin:0 0 24px;">Nueva reserva pendiente de seña.</p>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:6px 0; color:#6B6B6B; font-size:13px;">Cliente</td><td style="padding:6px 0;">${a.client_name}</td></tr>
      <tr><td style="padding:6px 0; color:#6B6B6B; font-size:13px;">Email</td><td style="padding:6px 0;">${a.client_email}</td></tr>
      <tr><td style="padding:6px 0; color:#6B6B6B; font-size:13px;">Teléfono</td><td style="padding:6px 0;">${a.client_phone}</td></tr>
      <tr><td style="padding:6px 0; color:#6B6B6B; font-size:13px;">Servicio</td><td style="padding:6px 0;">${a.service_name}</td></tr>
      <tr><td style="padding:6px 0; color:#6B6B6B; font-size:13px;">Cuándo</td><td style="padding:6px 0;">${fmtDate(a.scheduled_at)}</td></tr>
    </table>
    `
  );

  await transporter.sendMail({
    from: `"DBS Web" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL ?? process.env.GMAIL_USER!,
    subject: `Nueva reserva: ${a.client_name} — ${fmtDate(a.scheduled_at)}`,
    html,
  });
}

export async function sendCancellationEmail(a: AppointmentInfo, by: "client" | "admin", reason?: string) {
  const wa = whatsappLink(`Hola! Cancelé el turno del ${fmtDate(a.scheduled_at)} (${a.service_name}). Quería avisarte.`);
  const adminMsg = by === "admin"
    ? `<p style="font-size:14px; line-height:1.6; color:#A85F7F; margin:0 0 16px;">El turno fue cancelado desde el estudio${reason ? `: ${reason}` : ""}. Te pedimos disculpas y te invitamos a reservar otro horario.</p>`
    : "";

  const html = baseTemplate(
    "Turno cancelado",
    `
    <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">Hola ${a.client_name},</p>
    <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">Tu turno del ${fmtDate(a.scheduled_at)} (${a.service_name}) fue cancelado.</p>
    ${adminMsg}
    <a href="${wa}" style="display:inline-block; padding:12px 24px; background:#0F0F0F; color:#fff; text-decoration:none; border-radius:999px; font-size:14px; letter-spacing:0.08em; text-transform:uppercase; margin-top:16px;">Escribir por WhatsApp</a>
    `
  );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.GMAIL_USER}>`,
    to: a.client_email,
    subject: `Turno cancelado — ${fmtDate(a.scheduled_at)}`,
    html,
  });

  // Avisar al admin también
  await transporter.sendMail({
    from: `"DBS Web" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL ?? process.env.GMAIL_USER!,
    subject: `Turno cancelado por ${by === "admin" ? "admin" : "cliente"}: ${a.client_name}`,
    html: baseTemplate("Cancelación", `<p>Cancelado por: <strong>${by}</strong></p><p>Cliente: ${a.client_name}</p><p>Cuándo: ${fmtDate(a.scheduled_at)}</p>${reason ? `<p>Motivo: ${reason}</p>` : ""}`),
  });
}
