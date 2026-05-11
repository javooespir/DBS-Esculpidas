"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Lock, Tag, LogOut, Download, Plus, Check, X, Trash2, Loader2,
  ChevronLeft, ChevronRight, Clock, MessageCircle, RotateCcw, Filter,
} from "lucide-react";
import type { AppointmentWithService, BlockedSlot, Service } from "@/lib/types";
import { APPOINTMENT_STATUS_LABEL, BUSINESS_HOURS } from "@/lib/constants";

const TZ = "America/Argentina/Buenos_Aires";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ,
  });

const fmtDateLong = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

const fmtDateShort = (d: Date) =>
  d.toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: TZ });

const fmtDateTimeShort = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: TZ,
  });

/** Mismo día en ART (YYYY-MM-DD) */
const sameArtDay = (iso: string, target: Date) => {
  const a = new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
  const b = target.toLocaleDateString("sv-SE", { timeZone: TZ });
  return a === b;
};

const startOfWeekART = (d: Date) => {
  // semana de lunes a domingo. Devuelve el lunes 00:00 ART de esa semana.
  const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const dow = (local.getDay() + 6) % 7; // 0=lun, 6=dom
  const monday = new Date(local);
  monday.setDate(local.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const dateToInputValue = (d: Date) => {
  // YYYY-MM-DD en hora ART
  return d.toLocaleDateString("sv-SE", { timeZone: TZ });
};

const tomorrowART = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t;
};

type Tab = "agenda" | "turnos" | "blocks" | "services" | "trash";

export function AdminDashboard({
  appointments,
  blocks,
  services,
}: {
  appointments: AppointmentWithService[];
  blocks: BlockedSlot[];
  services: Service[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("agenda");

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "turnos", label: "Turnos", icon: Clock },
    { id: "blocks", label: "Bloqueos", icon: Lock },
    { id: "services", label: "Servicios", icon: Tag },
    { id: "trash", label: "Papelera", icon: Trash2 },
  ];

  const trashCount = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0A] text-white">
      <header className="bg-[#141414] border-b border-white/10 sticky top-0 z-40">
        <div className="container-page px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Panel admin</p>
            <h1 className="font-display text-2xl">DBS Esculpidas</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/ics" className="btn-secondary !border-white/30 !text-white hover:!bg-white hover:!text-black">
              <Download size={14} /> ICS
            </a>
            <button onClick={logout} className="btn-ghost !text-white/70 hover:!text-white">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
        <nav className="container-page px-6 flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? "border-[var(--color-rose)] text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              <Icon size={14} /> {label}
              {id === "trash" && trashCount > 0 && (
                <span className="ml-1 bg-[var(--color-rose)] text-black text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {trashCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-page px-6 py-8">
        {tab === "agenda" && <AgendaTimelineTab appointments={appointments} />}
        {tab === "turnos" && <TurnosTab appointments={appointments} services={services} />}
        {tab === "blocks" && <BlocksTab blocks={blocks} />}
        {tab === "services" && <ServicesTab services={services} />}
        {tab === "trash" && <TrashTab appointments={appointments} />}
      </main>
    </div>
  );
}

// =====================================================================
// AGENDA TIMELINE — vista por día estilo planner
// =====================================================================
function AgendaTimelineTab({ appointments }: { appointments: AppointmentWithService[] }) {
  const [day, setDay] = useState(new Date());

  const shift = (delta: number) => {
    const d = new Date(day);
    d.setDate(d.getDate() + delta);
    setDay(d);
  };

  const dow = (day.getDay() + 6) % 7; // 0=lun
  const dowSun = day.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hours = BUSINESS_HOURS[dowSun];

  // Generar slots de 30 min entre apertura y cierre
  const slots: Date[] = [];
  if (hours) {
    const [oh, om] = hours.open.split(":").map(Number);
    const [ch, cm] = hours.close.split(":").map(Number);
    const start = new Date(day);
    start.setHours(oh, om, 0, 0);
    const end = new Date(day);
    end.setHours(ch, cm, 0, 0);
    const cur = new Date(start);
    while (cur < end) {
      slots.push(new Date(cur));
      cur.setMinutes(cur.getMinutes() + 30);
    }
  }

  const dayAppts = appointments
    .filter((a) => a.status !== "cancelled" && sameArtDay(a.scheduled_at, day))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Mapeo: hora HH:mm → appointment que arranca ahí
  const apptByTime: Record<string, AppointmentWithService> = {};
  for (const a of dayAppts) {
    apptByTime[fmtTime(a.scheduled_at)] = a;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:border-[var(--color-rose)] text-sm flex items-center gap-1">
            <ChevronLeft size={14} /> Anterior
          </button>
          <h2 className="font-display text-2xl px-3 capitalize">{fmtDateLong(day)}</h2>
          <button onClick={() => shift(1)} className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:border-[var(--color-rose)] text-sm flex items-center gap-1">
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
        <button onClick={() => setDay(new Date())} className="px-4 py-2 rounded-full bg-[var(--color-rose)] text-black font-medium text-sm">
          Hoy
        </button>
      </div>

      {!hours ? (
        <p className="text-white/60 text-center py-12">Cerrado este día (domingo).</p>
      ) : (
        <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
          {slots.map((slot, i) => {
            const label = slot.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
            const appt = apptByTime[label];
            return (
              <div
                key={i}
                className={`flex items-stretch border-b border-white/5 last:border-b-0 ${appt ? "bg-[var(--color-rose-soft)]/5" : ""}`}
              >
                <div className="w-20 px-4 py-3 text-xs text-white/40 border-r border-white/5">{label}</div>
                <div className="flex-1 px-4 py-3">
                  {appt ? (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium text-white">{appt.client_name}</p>
                        <p className="text-xs text-white/60">
                          {appt.services?.name} · {appt.client_phone} · {appt.duration_minutes} min
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        appt.status === "deposit_paid"
                          ? "bg-green-500/20 text-green-300"
                          : appt.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {APPOINTMENT_STATUS_LABEL[appt.status]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// =====================================================================
// TURNOS — listado con filtros
// =====================================================================
type TurnosFilter = "today" | "tomorrow" | "week" | "all" | "date";

function TurnosTab({ appointments, services }: { appointments: AppointmentWithService[]; services: Service[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<TurnosFilter>("today");
  const [customDate, setCustomDate] = useState(dateToInputValue(new Date()));

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status === "cancelled") return false;
      const at = new Date(a.scheduled_at);
      const today = new Date();
      const tomorrow = tomorrowART();

      if (filter === "today") return sameArtDay(a.scheduled_at, today);
      if (filter === "tomorrow") return sameArtDay(a.scheduled_at, tomorrow);
      if (filter === "week") {
        const monday = startOfWeekART(today);
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        return at >= monday && at < nextMonday;
      }
      if (filter === "date") {
        const [y, m, d] = customDate.split("-").map(Number);
        const target = new Date(y, m - 1, d);
        return sameArtDay(a.scheduled_at, target);
      }
      return true;
    });
  }, [appointments, filter, customDate]);

  const action = async (
    appt: AppointmentWithService,
    body: object,
    method: "PATCH" | "DELETE" = "PATCH"
  ) => {
    const res = await fetch(`/api/turnos/${appt.id}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      alert("Error en la operación");
      return false;
    }
    router.refresh();
    return true;
  };

  const handleConfirmDeposit = async (appt: AppointmentWithService) => {
    if (!await action(appt, { status: "deposit_paid" })) return;
    // Abrir WhatsApp con mensaje de confirmación + políticas
    const msg = `¡Hola ${appt.client_name}! Te confirmo que recibí la seña, tu turno está reservado:

📅 ${fmtDateTimeShort(appt.scheduled_at)}
💅 ${appt.services?.name ?? "Servicio"}

📋 *Políticas:*
• Cancelaciones con +48hs: devolución de seña
• Cancelaciones con -48hs: sin devolución
• Reprogramaciones: mantenemos la seña

¡Te espero! ✨`;
    window.open(whatsappLinkForPhone(appt.client_phone, msg), "_blank");
  };

  const handleCancel = async (appt: AppointmentWithService) => {
    const reason = prompt("Motivo de cancelación (opcional):");
    if (!confirm("¿Cancelar este turno? Después se abre WhatsApp para avisarle.")) return;
    if (!await action(appt, { reason: reason ?? undefined }, "DELETE")) return;
    const msg = `Hola ${appt.client_name}, lamento avisarte que tengo que cancelar tu turno del ${fmtDateTimeShort(appt.scheduled_at)} (${appt.services?.name ?? ""}).${reason ? ` Motivo: ${reason}.` : ""} Te pido disculpas. ¿Reagendamos?`;
    window.open(whatsappLinkForPhone(appt.client_phone, msg), "_blank");
  };

  const handleComplete = (appt: AppointmentWithService) => action(appt, { status: "completed" });

  const filters: { id: TurnosFilter; label: string }[] = [
    { id: "today", label: "Hoy" },
    { id: "tomorrow", label: "Mañana" },
    { id: "week", label: "Esta semana" },
    { id: "date", label: "Por fecha" },
    { id: "all", label: "Todos" },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-white/40" />
          <div className="flex gap-1 bg-[#141414] rounded-lg border border-white/10 p-1">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  filter === f.id ? "bg-[var(--color-rose)] text-black font-medium" : "text-white/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filter === "date" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3 py-1.5 bg-[#141414] border border-white/10 rounded text-sm text-white"
            />
          )}
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary !bg-[var(--color-rose)] !text-black hover:!bg-[var(--color-rose-deep)]">
          <Plus size={14} /> Nuevo turno
        </button>
      </div>

      {adding && <ManualBookingForm services={services} onClose={() => setAdding(false)} />}

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-white/50">Sin turnos en esta vista.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li key={a.id} className="bg-[#141414] border border-white/10 rounded-xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-xl">{a.client_name}</p>
                <p className="text-sm text-white/60">
                  {fmtDateTimeShort(a.scheduled_at)} · {a.services?.name ?? "—"}
                </p>
                <p className="text-xs text-white/40">
                  {a.client_phone} · {a.client_email}
                </p>
                {a.notes && <p className="text-xs italic mt-1 text-white/60">&ldquo;{a.notes}&rdquo;</p>}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${
                a.status === "deposit_paid"
                  ? "bg-green-500/20 text-green-300"
                  : a.status === "pending"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-white/10 text-white/60"
              }`}>
                {APPOINTMENT_STATUS_LABEL[a.status]}
              </span>
              <div className="flex gap-2">
                {a.status === "pending" && (
                  <button onClick={() => handleConfirmDeposit(a)} className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-xs flex items-center gap-1 hover:bg-green-500/20" title="Confirmar seña + abrir WhatsApp">
                    <Check size={12} /> Confirmar seña
                  </button>
                )}
                {a.status !== "completed" && (
                  <button onClick={() => handleComplete(a)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs flex items-center gap-1 hover:bg-white/10" title="Marcar completado">
                    <Check size={12} />
                  </button>
                )}
                <a
                  href={whatsappLinkForPhone(
                    a.client_phone,
                    `Hola ${a.client_name}! Te escribo por tu turno en DBS Esculpidas 💅\n\n📅 ${fmtDateTimeShort(a.scheduled_at)}\n✨ ${a.services?.name ?? "Servicio"}\n\n¿En qué te puedo ayudar?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs flex items-center gap-1 hover:bg-white/10"
                  title="Enviar WhatsApp con datos del turno"
                >
                  <MessageCircle size={12} />
                </a>
                <button onClick={() => handleCancel(a)} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-1 hover:bg-red-500/20" title="Cancelar">
                  <X size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// =====================================================================
// PAPELERA — turnos cancelados, opción de restaurar
// =====================================================================
function TrashTab({ appointments }: { appointments: AppointmentWithService[] }) {
  const router = useRouter();
  const cancelled = appointments
    .filter((a) => a.status === "cancelled")
    .sort((a, b) => new Date(b.cancelled_at ?? b.created_at).getTime() - new Date(a.cancelled_at ?? a.created_at).getTime());

  const restore = async (appt: AppointmentWithService) => {
    if (!confirm(`¿Restaurar el turno de ${appt.client_name}? Vuelve al estado "pendiente de seña".`)) return;
    const res = await fetch(`/api/turnos/${appt.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    if (res.ok) router.refresh();
    else alert("Error al restaurar");
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl mb-2">Turnos cancelados</h2>
        <p className="text-sm text-white/50">Si cancelaste un turno por error, podés restaurarlo desde acá.</p>
      </div>
      {cancelled.length === 0 ? (
        <p className="text-center py-12 text-white/50">No hay turnos cancelados en los últimos 7 días.</p>
      ) : (
        <ul className="space-y-3">
          {cancelled.map((a) => (
            <li key={a.id} className="bg-[#141414] border border-white/10 rounded-xl p-5 flex flex-wrap items-center gap-4 opacity-80">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-xl">{a.client_name}</p>
                <p className="text-sm text-white/60">
                  Era para: {fmtDateTimeShort(a.scheduled_at)} · {a.services?.name ?? "—"}
                </p>
                <p className="text-xs text-white/40">
                  Cancelado por {a.cancelled_by ?? "?"} · {a.cancelled_at ? fmtDateTimeShort(a.cancelled_at) : ""}
                  {a.cancellation_reason && ` · "${a.cancellation_reason}"`}
                </p>
              </div>
              <button
                onClick={() => restore(a)}
                className="px-3 py-2 rounded-lg bg-[var(--color-rose)]/10 border border-[var(--color-rose)]/40 text-[var(--color-rose)] text-xs flex items-center gap-1 hover:bg-[var(--color-rose)]/20"
              >
                <RotateCcw size={12} /> Restaurar
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// =====================================================================
// MANUAL BOOKING FORM
// =====================================================================
function ManualBookingForm({ services, onClose }: { services: Service[]; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const activeServices = services.filter((s) => s.active);
  const [form, setForm] = useState({
    service_id: activeServices[0]?.id ?? "",
    scheduled_at: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    notes: "",
    confirmed: true,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/manual-booking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      alert("Error al crear el turno");
    }
  };

  return (
    <form onSubmit={submit} className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6">
      <h3 className="font-display text-xl mb-4">Nuevo turno manual</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label !text-white/60">Servicio</label>
          <select required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            {activeServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label !text-white/60">Fecha y hora</label>
          <input type="datetime-local" required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
        </div>
        <div>
          <label className="label !text-white/60">Nombre</label>
          <input required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
        </div>
        <div>
          <label className="label !text-white/60">Celular</label>
          <input required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Email</label>
          <input required type="email" className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Notas</label>
          <input className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 mb-4 text-sm">
        <input type="checkbox" checked={form.confirmed} onChange={(e) => setForm({ ...form, confirmed: e.target.checked })} />
        Marcar seña como recibida
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary !border-white/30 !text-white">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary !bg-[var(--color-rose)] !text-black">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Crear turno"}
        </button>
      </div>
    </form>
  );
}

// =====================================================================
// BLOQUEOS
// =====================================================================
function BlocksTab({ blocks }: { blocks: BlockedSlot[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ start_at: "", end_at: "", reason: "" });
  const [loading, setLoading] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { setForm({ start_at: "", end_at: "", reason: "" }); router.refresh(); }
    else alert("Error");
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar bloqueo?")) return;
    await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
    router.refresh();
  };

  const quickBlock = (preset: "morning" | "afternoon" | "fullday") => {
    const today = new Date();
    today.setMinutes(0, 0, 0);
    const start = new Date(today);
    const end = new Date(today);
    if (preset === "morning") { start.setHours(9); end.setHours(13); }
    else if (preset === "afternoon") { start.setHours(13); end.setHours(18); }
    else { start.setHours(0); end.setHours(23, 59); }
    const toLocal = (d: Date) => {
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    };
    setForm({ start_at: toLocal(start), end_at: toLocal(end), reason: "" });
  };

  return (
    <>
      <form onSubmit={add} className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6">
        <h3 className="font-display text-xl mb-4">Nuevo bloqueo</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button type="button" onClick={() => quickBlock("morning")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-[var(--color-rose)]">Mañana hoy</button>
          <button type="button" onClick={() => quickBlock("afternoon")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-[var(--color-rose)]">Tarde hoy</button>
          <button type="button" onClick={() => quickBlock("fullday")} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-[var(--color-rose)]">Día completo hoy</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label !text-white/60">Desde</label>
            <input type="datetime-local" required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
          </div>
          <div>
            <label className="label !text-white/60">Hasta</label>
            <input type="datetime-local" required className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div>
            <label className="label !text-white/60">Motivo</label>
            <input className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        <button disabled={loading} className="btn-primary !bg-[var(--color-rose)] !text-black">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Bloquear"}
        </button>
      </form>

      <ul className="space-y-2">
        {blocks.length === 0 ? (
          <p className="text-white/50">No hay bloqueos activos.</p>
        ) : blocks.map((b) => (
          <li key={b.id} className="bg-[#141414] border border-white/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium">
                {fmtDateTimeShort(b.start_at)} → {fmtDateTimeShort(b.end_at)}
              </p>
              {b.reason && <p className="text-sm text-white/50">{b.reason}</p>}
            </div>
            <button onClick={() => remove(b.id)} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// =====================================================================
// SERVICIOS — CRUD completo
// =====================================================================
function ServicesTab({ services }: { services: Service[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Record<string, Partial<Service>>>({});

  const save = async (id: string) => {
    const update = draft[id];
    if (!update) return;
    const res = await fetch(`/api/admin/services?id=${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
    if (res.ok) {
      setDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      router.refresh();
    } else alert("Error al guardar");
  };

  const toggleActive = async (s: Service) => {
    const res = await fetch(`/api/admin/services?id=${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    if (res.ok) router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="font-display text-2xl">Servicios y precios</h2>
        <button onClick={() => setAdding(!adding)} className="btn-primary !bg-[var(--color-rose)] !text-black">
          <Plus size={14} /> Nuevo servicio
        </button>
      </div>

      {adding && <NewServiceForm onClose={() => setAdding(false)} />}

      <ul className="space-y-3">
        {services.map((s) => {
          const d = draft[s.id] ?? {};
          const dirty = Object.keys(d).length > 0;
          return (
            <li key={s.id} className={`bg-[#141414] border border-white/10 rounded-xl p-4 ${!s.active ? "opacity-60" : ""}`}>
              <div className="grid sm:grid-cols-[1fr_120px_120px_120px_auto] gap-3 items-end">
                <div>
                  <label className="label !text-white/60">Nombre</label>
                  <input className="input !bg-[#0A0A0A] !border-white/15 !text-white" defaultValue={s.name} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, name: e.target.value } })} />
                </div>
                <div>
                  <label className="label !text-white/60">Precio</label>
                  <input type="number" className="input !bg-[#0A0A0A] !border-white/15 !text-white" defaultValue={s.price_ars} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, price_ars: Number(e.target.value) } })} />
                </div>
                <div>
                  <label className="label !text-white/60">Duración (min)</label>
                  <input type="number" className="input !bg-[#0A0A0A] !border-white/15 !text-white" defaultValue={s.duration_minutes} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, duration_minutes: Number(e.target.value) } })} />
                </div>
                <div>
                  <label className="label !text-white/60">Seña</label>
                  <input type="number" className="input !bg-[#0A0A0A] !border-white/15 !text-white" defaultValue={s.deposit_ars} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, deposit_ars: Number(e.target.value) } })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => save(s.id)} disabled={!dirty} className="px-3 py-2 rounded-lg bg-[var(--color-rose)] text-black disabled:opacity-30 disabled:cursor-not-allowed" title="Guardar">
                    <Check size={14} />
                  </button>
                  <button onClick={() => toggleActive(s)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs" title={s.active ? "Desactivar" : "Activar"}>
                    {s.active ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-white/40 mt-4">
        Los servicios desactivados no se muestran en la landing ni se pueden reservar, pero se conservan los turnos históricos que los usaron.
      </p>
    </>
  );
}

function NewServiceForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price_ars: 20000, duration_minutes: 60, deposit_ars: 10000 });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { onClose(); router.refresh(); }
    else alert("Error");
  };

  return (
    <form onSubmit={submit} className="bg-[#141414] border border-[var(--color-rose)]/40 rounded-xl p-5 mb-6">
      <h3 className="font-display text-xl mb-4">Nuevo servicio</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Nombre</label>
          <input required className="input !bg-[#0A0A0A] !border-white/15 !text-white" placeholder="Ej: Diseño elaborado" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Descripción (opcional)</label>
          <input className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label !text-white/60">Precio (ARS)</label>
          <input type="number" required min={0} className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.price_ars} onChange={(e) => setForm({ ...form, price_ars: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label !text-white/60">Duración (min)</label>
          <input type="number" required min={15} step={15} className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label !text-white/60">Seña (ARS)</label>
          <input type="number" required min={0} className="input !bg-[#0A0A0A] !border-white/15 !text-white" value={form.deposit_ars} onChange={(e) => setForm({ ...form, deposit_ars: Number(e.target.value) })} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary !border-white/30 !text-white">Cancelar</button>
        <button disabled={loading} className="btn-primary !bg-[var(--color-rose)] !text-black">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Crear servicio"}
        </button>
      </div>
    </form>
  );
}

// =====================================================================
// HELPERS
// =====================================================================

/** Construye link de WhatsApp para un teléfono específico (limpia caracteres no numéricos). */
function whatsappLinkForPhone(phone: string, text?: string): string {
  const clean = phone.replace(/\D/g, "");
  // si no incluye código de país, asumir Argentina (54)
  const intl = clean.startsWith("54") ? clean : `54${clean.replace(/^0/, "").replace(/^15/, "9")}`;
  const base = `https://wa.me/${intl}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
