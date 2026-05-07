"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import type { Service } from "@/lib/types";
import { BOOKING_RULES, whatsappLink } from "@/lib/constants";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtDuration = (m: number) =>
  m < 60 ? `${m} min` : m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60} min`;

type Step = "service" | "date" | "time" | "details" | "done";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

export function BookingFlow({
  services,
  preselectedSlug,
}: {
  services: Service[];
  preselectedSlug?: string;
}) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<Service | null>(
    preselectedSlug ? services.find((s) => s.slug === preselectedSlug) ?? null : null
  );
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [slots, setSlots] = useState<{ start: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);

  // saltar al paso siguiente si vienen con servicio preseleccionado
  useEffect(() => {
    if (preselectedSlug && service && step === "service") setStep("date");
  }, [preselectedSlug, service, step]);

  // calendario: próximos 30 días excepto domingos
  const dates = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= BOOKING_RULES.maxDaysAhead; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === 0) continue; // sin domingos
      arr.push(d);
    }
    return arr;
  }, []);

  // cargar slots cuando cambia date o service
  useEffect(() => {
    if (!service || !date) return;
    setLoadingSlots(true);
    const dateStr = date.toISOString().split("T")[0];
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

  // ===== UI =====

  if (step === "done" && confirmation && service && time) {
    const wa = whatsappLink(
      `Hola! Acabo de reservar el turno para ${service.name} el ${fmtDate(time)} a las ${time.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}. Mi nombre es ${form.name}. Quería avisarte que envío la seña.`
    );
    return (
      <div className="card max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-rose-soft)] flex items-center justify-center mb-6">
          <Check size={32} style={{ color: "var(--color-rose-deep)" }} />
        </div>
        <h2 className="font-display text-3xl mb-4">¡Turno reservado!</h2>
        <p className="text-[var(--color-muted)] mb-2">
          {service.name} · {fmtDate(time)} a las{" "}
          {time.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Te enviamos un mail con los detalles. Para confirmar, mandanos la seña de{" "}
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
          const labels: Record<"service" | "date" | "time" | "details", string> = { service: "Servicio", date: "Fecha", time: "Hora", details: "Datos" };
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
                    ? "bg-[var(--color-ink)] text-white"
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

      {/* PASO 1: Servicio */}
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

      {/* PASO 2: Fecha */}
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {dates.map((d) => {
              const selected = date && d.toDateString() === date.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    setDate(d);
                    setTime(null);
                    setStep("time");
                  }}
                  className={`p-3 rounded-lg border text-center transition-all min-h-[64px] ${
                    selected
                      ? "border-[var(--color-rose-deep)] bg-[var(--color-rose-soft)]"
                      : "border-[var(--color-line)] hover:border-[var(--color-rose)]"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    {d.toLocaleDateString("es-AR", { weekday: "short" })}
                  </div>
                  <div className="text-xl font-display">{d.getDate()}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">
                    {d.toLocaleDateString("es-AR", { month: "short" })}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* PASO 3: Hora */}
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
                const label = t.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
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

      {/* PASO 4: Datos */}
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
              {fmtDate(time)} a las{" "}
              {time.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} ·{" "}
              {fmtMoney(service.price_ars)} (seña {fmtMoney(service.deposit_ars)})
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
                <label htmlFor="email" className="label">Email</label>
                <input id="email" required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
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
