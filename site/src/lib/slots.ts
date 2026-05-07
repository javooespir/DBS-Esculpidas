/**
 * Cálculo de horarios disponibles.
 *
 * Reglas:
 *   - Slots cada 30 min (BOOKING_RULES.slotMinutes)
 *   - Respeta horarios de atención (BUSINESS_HOURS)
 *   - Respeta bloqueos recurrentes (RECURRING_BLOCKS + viernes alternados)
 *   - Respeta bloqueos manuales (blocked_slots)
 *   - Respeta turnos ya tomados (no cancelados)
 *   - Respeta anticipación mínima (24hs)
 *   - El servicio puede tener duración mayor a un slot — bloqueamos los slots subsiguientes necesarios
 *
 * IMPORTANTE: Todos los cálculos asumen Argentina (UTC-3, sin DST desde 2009).
 * Construimos dates en UTC explícitamente para evitar bugs según donde corra el server (Vercel = UTC).
 */

import {
  BUSINESS_HOURS,
  RECURRING_BLOCKS,
  ALTERNATING_FRIDAY_BLOCKS,
  isAlternatingBlockedFriday,
  BOOKING_RULES,
  type DayOfWeek,
} from "./constants";

export type Slot = { start: Date; available: boolean; reason?: string };

/** Argentina = UTC-3 (sin horario de verano). */
const ART_OFFSET_HOURS = 3;

/**
 * Devuelve un Date que representa "h:m hora Argentina" en el día indicado.
 * Internamente es UTC, pero al hacer toISOString() y luego mostrarlo con
 * timeZone:"America/Argentina/Buenos_Aires" se ve correctamente.
 */
function dateAtART(baseDate: Date, h: number, m: number = 0): Date {
  return new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      h + ART_OFFSET_HOURS,
      m,
      0,
      0
    )
  );
}

const parseTime = (hhmm: string, baseDate: Date) => {
  const [h, m] = hhmm.split(":").map(Number);
  return dateAtART(baseDate, h, m);
};

/** Día de la semana en hora Argentina */
export function getArtDayOfWeek(date: Date): DayOfWeek {
  // Si la fecha viene como "00:00 UTC del día X" (construida desde split YYYY-MM-DD), su día UTC es el correcto.
  return date.getUTCDay() as DayOfWeek;
}

/** Genera todos los slots posibles del día (sin filtrar disponibilidad). */
export function generateDaySlots(date: Date): Date[] {
  const dow = getArtDayOfWeek(date);
  const hours = BUSINESS_HOURS[dow];
  if (!hours) return [];

  const open = parseTime(hours.open, date);
  const close = parseTime(hours.close, date);
  const slots: Date[] = [];
  const cursor = new Date(open);
  while (cursor < close) {
    slots.push(new Date(cursor));
    cursor.setUTCMinutes(cursor.getUTCMinutes() + BOOKING_RULES.slotMinutes);
  }
  return slots;
}

/**
 * Filtra slots: marca como no disponibles los que estén bloqueados u ocupados.
 *
 * @param date Fecha del día consultado (00:00 UTC representando el día en ART)
 * @param serviceDuration duración del servicio en minutos
 * @param appointments turnos NO cancelados (con scheduled_at + duration_minutes)
 * @param blocks bloqueos manuales
 * @param now hora actual (para validar 24hs anticipación)
 */
export function computeAvailableSlots(
  date: Date,
  serviceDuration: number,
  appointments: { scheduled_at: string; duration_minutes: number }[],
  blocks: { start_at: string; end_at: string }[],
  now: Date = new Date()
): Slot[] {
  const all = generateDaySlots(date);
  const dow = getArtDayOfWeek(date);

  const hours = BUSINESS_HOURS[dow];
  if (!hours) return [];
  const close = parseTime(hours.close, date);

  // Anticipación mínima
  const minBookable = new Date(now.getTime() + BOOKING_RULES.minHoursAhead * 60 * 60 * 1000);

  // Bloqueos recurrentes para este día
  const recurringRanges = RECURRING_BLOCKS.filter((b) => b.day === dow).map((b) => ({
    start: parseTime(b.from, date),
    end: parseTime(b.to, date),
  }));

  // Viernes alternados
  if (isAlternatingBlockedFriday(date)) {
    for (const b of ALTERNATING_FRIDAY_BLOCKS) {
      recurringRanges.push({ start: parseTime(b.from, date), end: parseTime(b.to, date) });
    }
  }

  const manualRanges = blocks.map((b) => ({
    start: new Date(b.start_at),
    end: new Date(b.end_at),
  }));

  const taken = appointments.map((a) => {
    const start = new Date(a.scheduled_at);
    const end = new Date(start.getTime() + a.duration_minutes * 60 * 1000);
    return { start, end };
  });

  return all.map((start) => {
    const end = new Date(start.getTime() + serviceDuration * 60 * 1000);

    if (start < minBookable) {
      return { start, available: false, reason: "Muy próximo" };
    }

    if (end > close) {
      return { start, available: false, reason: "No entra antes del cierre" };
    }

    const overlaps = (a: { start: Date; end: Date }) =>
      start < a.end && end > a.start;

    if (recurringRanges.some(overlaps)) {
      return { start, available: false, reason: "Horario no disponible" };
    }
    if (manualRanges.some(overlaps)) {
      return { start, available: false, reason: "Bloqueado" };
    }
    if (taken.some(overlaps)) {
      return { start, available: false, reason: "Reservado" };
    }

    return { start, available: true };
  });
}

const TZ = "America/Argentina/Buenos_Aires";

export function formatSlotLabel(date: Date): string {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

export const ART_TZ = TZ;
