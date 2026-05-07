/**
 * Cálculo de horarios disponibles.
 *
 * Reglas:
 *   - 1 turno por hora (slotMinutes = 60)
 *   - Respeta horarios de atención (BUSINESS_HOURS)
 *   - Respeta bloqueos recurrentes (RECURRING_BLOCKS)
 *   - Respeta bloqueos manuales (blocked_slots tabla)
 *   - Respeta turnos ya tomados (que no estén cancelados)
 *   - Respeta anticipación mínima (24hs)
 *   - El servicio puede tener duración mayor a un slot — bloqueamos los slots subsiguientes necesarios
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

const parseTime = (hhmm: string, base: Date) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

export function getDayOfWeek(date: Date): DayOfWeek {
  return date.getDay() as DayOfWeek;
}

/**
 * Genera todos los slots posibles del día (sin filtrar disponibilidad).
 */
export function generateDaySlots(date: Date): Date[] {
  const dow = getDayOfWeek(date);
  const hours = BUSINESS_HOURS[dow];
  if (!hours) return [];

  const open = parseTime(hours.open, date);
  const close = parseTime(hours.close, date);
  const slots: Date[] = [];
  const cursor = new Date(open);
  while (cursor < close) {
    slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + BOOKING_RULES.slotMinutes);
  }
  return slots;
}

/**
 * Filtra slots: marca como no disponibles los que estén bloqueados u ocupados.
 *
 * @param date Fecha del día consultado
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
  const dow = getDayOfWeek(date);

  // Cierre del día (para validar que el servicio entero quepa)
  const hours = BUSINESS_HOURS[dow];
  if (!hours) return [];
  const close = parseTime(hours.close, date);

  // Anticipación mínima
  const minBookable = new Date(now.getTime() + BOOKING_RULES.minHoursAhead * 60 * 60 * 1000);

  // Bloqueos recurrentes para este día de semana
  const recurringRanges = RECURRING_BLOCKS.filter((b) => b.day === dow).map((b) => ({
    start: parseTime(b.from, date),
    end: parseTime(b.to, date),
  }));

  // Viernes alternados (cada 2 semanas): añade bloqueos extra
  if (isAlternatingBlockedFriday(date)) {
    for (const b of ALTERNATING_FRIDAY_BLOCKS) {
      recurringRanges.push({ start: parseTime(b.from, date), end: parseTime(b.to, date) });
    }
  }

  // Bloqueos manuales
  const manualRanges = blocks.map((b) => ({
    start: new Date(b.start_at),
    end: new Date(b.end_at),
  }));

  // Turnos existentes
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

export function formatSlotLabel(date: Date): string {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
