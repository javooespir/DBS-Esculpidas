/**
 * Constantes del negocio.
 * Lo que cambia raramente vive acá. Lo que cambia seguido vive en Supabase.
 */

export const BUSINESS = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "DBS Esculpidas",
  tagline: "Resaltando tu belleza de pies a cabeza",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "5491158132493",
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "DBSesculpidas@gmail.com",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "Brandsen 2326, Ituzaingó",
  instagram: process.env.NEXT_PUBLIC_BUSINESS_INSTAGRAM ?? "dbs.esculpidas",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dbsesculpidas.encende.click",
  timezone: "America/Argentina/Buenos_Aires",
} as const;

export const whatsappLink = (text?: string) => {
  const base = `https://wa.me/${BUSINESS.phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};

export const instagramLink = `https://instagram.com/${BUSINESS.instagram}`;

/**
 * Horarios de atención y bloqueos fijos.
 * Domingo no se atiende.
 * Lun-Vie 09-18, Sáb 09-14.
 * Bloqueos:
 *   Lunes y Miércoles 11-13
 *   Martes y Jueves: hasta las 18 (cierran antes — definimos cierre 18 igual; no es bloqueo extra)
 *   Viernes (cada 15 días): 11-13 y desde 17 (cierran antes)
 *
 * Para los viernes alternados, marcamos el flag y el admin puede bloquear manualmente cada quincena.
 * Acá implementamos los bloqueos recurrentes seguros; los excepcionales se cargan desde el admin.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Domingo

export const BUSINESS_HOURS: Record<DayOfWeek, { open: string; close: string } | null> = {
  0: null, // Domingo cerrado
  1: { open: "09:00", close: "18:00" }, // Lunes
  2: { open: "09:00", close: "18:00" }, // Martes
  3: { open: "09:00", close: "18:00" }, // Miércoles
  4: { open: "09:00", close: "18:00" }, // Jueves
  5: { open: "09:00", close: "18:00" }, // Viernes (admin bloquea quincenalmente)
  6: { open: "09:00", close: "14:00" }, // Sábado
};

/**
 * Bloqueos recurrentes fijos por día de semana.
 * El cliente dijo:
 *   Lunes y Miércoles 11:00-13:00
 *   Viernes cada 15 días 11:00-13:00 (los viernes especiales el admin agrega bloqueo manual)
 */
export const RECURRING_BLOCKS: { day: DayOfWeek; from: string; to: string }[] = [
  { day: 1, from: "11:00", to: "13:00" }, // Lunes
  { day: 3, from: "11:00", to: "13:00" }, // Miércoles
];

export const BOOKING_RULES = {
  /** Anticipación mínima para reservar (horas) */
  minHoursAhead: 24,
  /** Máximo de días en el futuro que se puede reservar */
  maxDaysAhead: 30,
  /** Slot atómico (1 turno por hora porque trabaja una sola persona) */
  slotMinutes: 60,
  /** Política de cancelación */
  cancellation: {
    fullRefundHoursAhead: 48, // 48hs antes: devolución de seña
    noRefundHoursAhead: 24, // 24-48hs: sin devolución
    // < 24hs: no se permite cancelar online (el admin sí puede)
  },
  defaultDeposit: 10000,
} as const;

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente de seña",
  deposit_paid: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
  no_show: "No asistió",
};
