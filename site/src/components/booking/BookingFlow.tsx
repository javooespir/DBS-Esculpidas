"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2, Search, X } from "lucide-react";
import type { Service } from "@/lib/types";
import { BOOKING_RULES, whatsappLink } from "@/lib/constants";

const TZ = "America/Argentina/Buenos_Aires";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtDuration = (m: number) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });

type Step = "service" | "date" | "time" | "details" | "done";
type Mode = "new" | "lookup";

type LookupAppointment = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  client_name: string;
  services: { name: string } | null;
};

export function BookingFlow({
  services,
  preselectedSlug,
}: {
  services: Service[];
  preselectedSlug?: string;
}) {
  const [mode, setMode] = useState<Mode>("new");

  return (
    <div>
      <div className="flex gap-1 bg-white rounded-full border border-[var(--color-line)] p-1 mb-8 max-w-md">
        <button
          onClick={() => setMode("new")}
          className={`flex-1 px-4 py-2 text-sm rounded-full transition-colors ${
            mode === "new" ? "bg-[var(--color-rose)] text-white" : "text-[var(--color-muted)]"
          }`}
        >
          Nueva reserva
        </button>
        <button
          onClick={() => setMode("lookup")}
          className={`flex-1 px-4 py-2 text-sm rounded-full transition-colors ${
            mode === "lookup" ? "bg-[var(--color-rose)] text-white" : "text-[var(--color-muted)]"
          }`}
        >
          Ya tengo turno
        </button>
      </div>

      {mode === "new" ? (
        <NewBooking services={services} preselectedSlug={preselectedSlug} />
      ) : (
        <LookupBooking />
      )}
    </div>
  );
}

// =====================================================================
// LOOKUP — buscar turnos existentes y cancelar
// =====================================================================
function LookupBooking() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<LookupAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Detectar si lo que ingresó parece email o teléfono
  const looksLikeEmail = query.includes("@");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;
    setLoading(true);
    setError(null);
    try {
      const payload = looksLikeEmail ? { email: val } : { phone: val };
      const res = await fetch("/api/turnos/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setResults(data.appointments ?? []);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm("¿Seguro que querés cancelar este turno? Recordá: con menos de 48hs no hay devolución de seña, con menos de 24hs no se puede cancelar online.")) return;
    setCancellingId(id);
    try {
      // Para verificar identidad: enviamos email o teléfono según lo que ingresó
      const val = query.trim();
      const body = looksLikeEmail ? { client_email: val } : { client_phone: val };
      const res = await fetch(`/api/turnos/${id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo cancelar");
      setResults((r) => r.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-xl">
      <form onSubmit={search} className="card mb-6">
        <label htmlFor="lookup-query" className="label">Email o teléfono con el que reservaste</label>
        <div className="flex gap-2">
          <input
            id="lookup-query"
            type="text"
            required
            className="input flex-1"
            placeholder="tu@email.com o 1155xxxxxx"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
            autoComplete="off"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
        {error && <p className="text-sm text-[var(--color-danger)] mt-2">{error}</p>}
      </form>

      {searched && results.length === 0 && (
        <p className="text-[var(--color-muted)] text-center py-8">No encontramos turnos activos con ese dato.</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((a) => (
            <li key={a.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="font-display text-2xl">{a.services?.name ?? "Servicio"}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {fmtDate(new Date(a.scheduled_at))} a las {fmtTime(new Date(a.scheduled_at))}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  a.status === "deposit_paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {a.status === "deposit_paid" ? "Confirmado" : "Pendiente seña"}
                </span>
              </div>
              <button
                onClick={() => cancel(a.id)}
                disabled={cancellingId === a.id}
                className="text-sm text-[var(--color-danger)] hover:underline inline-flex items-center gap-1"
              >
                {cancellingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Cancelar este turno
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =====================================================================
// NEW BOOKING — flujo de reserva
// =====================================================================
function NewBooking({
  services,
  preselectedSlug,
}: {
  services: Service[];
  preselectedSlug?: string;
}) {
  const initialService = preselectedSlug
    ? services.find((s) => s.slug === preselectedSlug) ?? null
    : null;

  // Si vino con servicio preseleccionado: arrancar en "date". Si no: en "service".
  // Solo se evalúa al montar, así no nos envía adelante cuando el usuario hace "back".
  const [step, setStep] = useState<Step>(initialService ? "date" : "service");
  const [service, setService] = useState<Service | null>(initialService);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [slots, setSlots] = useState<{ start: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);

  // calendario: próximos 30 días, sin domingos (cerrado)
  const dates = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= BOOKING_RULES.maxDaysAhead; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  // cargar slots cuando cambia date o service
  useEffect(() => {
    if (!service || !date) return;
    setLoadingSlots(true);
    // dateStr en formato local YYYY-MM-DD (no toISOString que convierte a UTC)
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    fetch(`/api/available-slots?date=${dateStr}&service=${service.id}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("No pudimos cargar los horarios. Intentá de nuevo."))
      .finally(() => setLoadingSlots(false));
  }, [service, date]);

  const submit = async () => {
    if (!service || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_id: service.id,
          scheduled_at: time.toISOString(),
          client_name: form.name.trim(),
          client_phone: form.phone.trim(),
          client_email: form.email.trim(),
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al reservar");
      setConfirmation({ id: data.id });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done" && confirmation && service && time) {
    const wa = whatsappLink(
      `Hola! Acabo de reservar el turno para ${service.name} el ${fmtDate(time)} a las ${fmtTime(time)}. Mi nombre es ${form.name}. Quería avisarte que envío la seña.`
    );
    return (
      <div className="card max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-rose-soft)] flex items-center justify-center mb-6">
          <Check size={32} style={{ color: "var(--color-rose-deep)" }} />
        </div>
        <h2 className="font-display text-3xl mb-4">¡Turno reservado!</h2>
        <p className="text-[var(--color-muted)] mb-2">
          {service.name} · {fmtDate(time)} a las {fmtTime(time)}
        </p>
        {form.email && (
          <p className="text-sm text-[var(--color-muted)] mb-2">
            Te enviamos un mail con los detalles.
          </p>
        )}
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Para confirmar, mandanos la seña de{" "}
          <strong>{fmtMoney(service.deposit_ars)}</strong> por transferencia.
        </p>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary">
          Avisar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-10 text-xs text-[var(--color-muted)] flex-wrap">
        {(["service", "date", "time", "details"] as const).map((s, i) => {
          const labels: Record<"service" | "date" | "time" | "details", string> = {
            service: "Servicio",
            date: "Fecha",
            time: "Hora",
            details: "Datos",
          };
          const idx = ["service", "date", "time", "details"].indexOf(step);
          const active = i === idx;
          const done = i < idx;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                  done
                    ? "bg-[var(--color-rose-deep)] text-white"
                    : active
                    ? "bg-[var(--color-rose)] text-white"
                    : "bg-[var(--color-line)] text-[var(--color-muted)]"
                }`}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              <span className={active ? "text-[var(--color-ink)] font-medium" : ""}>{labels[s]}</span>
              {i < 3 && <span className="text-[var(--color-line)]">/</span>}
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-6 p-4 border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)] rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === "service" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setService(s);
                setStep("date");
              }}
              className={`card text-left transition-all ${
                service?.id === s.id ? "border-[var(--color-rose-deep)]" : "hover:border-[var(--color-rose)]"
              }`}
            >
              <h3 className="font-display text-2xl mb-2">{s.name}</h3>
              {s.description && <p className="text-sm text-[var(--color-muted)] mb-4">{s.description}</p>}
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl">{fmtMoney(s.price_ars)}</span>
                <span className="text-xs uppercase tracking-wider text-[var(--color-rose-deep)]">
                  {fmtDuration(s.duration_minutes)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === "date" && service && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setStep("service")} className="btn-ghost">
              <ArrowLeft size={14} /> Cambiar servicio
            </button>
            <span className="text-sm text-[var(--color-muted)]">
              {service.name} · {fmtMoney(service.price_ars)}
            </span>
          </div>
          <CalendarGrid dates={dates} selected={date} onSelect={(d) => { setDate(d); setTime(null); setStep("time"); }} />
        </>
      )}

      {step === "time" && service && date && (
        <>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <button type="button" onClick={() => setStep("date")} className="btn-ghost">
              <ArrowLeft size={14} /> Cambiar fecha
            </button>
            <span className="text-sm text-[var(--color-muted)]">{fmtDate(date)}</span>
          </div>
          {loadingSlots ? (
            <div className="py-12 text-center text-[var(--color-muted)] flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Cargando horarios...
            </div>
          ) : slots.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted)]">No hay horarios disponibles este día.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot) => {
                const t = new Date(slot.start);
                const label = fmtTime(t);
                return (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => {
                      setTime(t);
                      setStep("details");
                    }}
                    className={`p-3 rounded-lg border text-center transition-all min-h-[48px] ${
                      !slot.available
                        ? "border-[var(--color-line)] text-[var(--color-line)] line-through cursor-not-allowed"
                        : "border-[var(--color-line)] hover:border-[var(--color-rose-deep)] hover:bg-[var(--color-rose-soft)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {step === "details" && service && time && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="max-w-xl"
        >
          <div className="mb-6 p-5 bg-[var(--color-rose-mist)] border border-[var(--color-line)] rounded-lg">
            <p className="text-sm text-[var(--color-muted)] mb-1">Estás reservando:</p>
            <p className="font-display text-2xl">{service.name}</p>
            <p className="text-sm">
              {fmtDate(time)} a las {fmtTime(time)} · {fmtMoney(service.price_ars)} (seña {fmtMoney(service.deposit_ars)})
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label htmlFor="name" className="label">Nombre completo</label>
              <input id="name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="label">Celular</label>
                <input id="phone" required type="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  Email <span className="text-[var(--color-muted)] font-normal text-xs">(opcional)</span>
                </label>
                <input id="email" type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" placeholder="tu@email.com" />
                <p className="text-xs text-[var(--color-muted)] mt-1">Recomendado — te enviamos la confirmación del turno 📩</p>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="label">Notas (opcional)</label>
              <textarea id="notes" rows={3} className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep("time")} className="btn-ghost">
              <ArrowLeft size={14} /> Atrás
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Confirmar <ArrowRight size={16} /></>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// =====================================================================
// CalendarGrid — grilla Lun–Dom con celdas vacías para mantener orden
// =====================================================================
const WEEKDAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

function CalendarGrid({ dates, selected, onSelect }: {
  dates: Date[];
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  // Posición Lun=0..Dom=6 desde getDay (que devuelve Dom=0..Sáb=6)
  const dowIndex = (d: Date) => (d.getDay() + 6) % 7;

  // Padding inicial para que la primera fecha caiga en su columna correcta
  const padBefore = dates.length > 0 ? dowIndex(dates[0]) : 0;

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {Array.from({ length: padBefore }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {dates.map((d) => {
          const isSunday = d.getDay() === 0;
          const isSelected = selected && d.toDateString() === selected.toDateString();
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={isSunday}
              onClick={() => !isSunday && onSelect(d)}
              className={`h-[52px] sm:h-auto sm:py-3 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                isSunday
                  ? "border-transparent text-[var(--color-line)] cursor-not-allowed"
                  : isSelected
                  ? "border-[var(--color-rose-deep)] bg-[var(--color-rose)] text-white shadow-[0_4px_12px_rgba(168,95,127,0.25)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-rose-deep)] hover:bg-[var(--color-rose-soft)]"
              }`}
            >
              <span className="text-sm sm:text-xl md:text-2xl font-display leading-none">{d.getDate()}</span>
              <span className="text-[9px] md:text-[10px] uppercase mt-0.5 opacity-70">
                {d.toLocaleDateString("es-AR", { month: "short" })}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
