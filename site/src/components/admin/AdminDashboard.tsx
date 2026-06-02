"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Lock, Tag, LogOut, Download, Plus, Check, X, Trash2, Loader2,
  ChevronLeft, ChevronRight, Clock, MessageCircle, RotateCcw, Filter, Settings,
  Minus, UserSearch, Camera,
} from "lucide-react";
import type { AppointmentWithService, BlockedSlot, ExtraSelection, Service } from "@/lib/types";
import { APPOINTMENT_STATUS_LABEL, BUSINESS_HOURS } from "@/lib/constants";
import { InstagramStoryGenerator } from "@/components/admin/InstagramStoryGenerator";

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

// =====================================================================
// WA TEMPLATES — defaults y helper de sustitución
// =====================================================================
const DEFAULT_TEMPLATE_CHAT = `Hola {nombre}! Te escribo por tu turno en DB Studio Esculpidas 💅

📅 {fecha_hora}
✨ {tratamiento}

¡Te espero! Recordá:

💳 *Seña:* Para confirmar tu turno necesitás enviar la seña por transferencia. Sin seña confirmada el turno queda pendiente.

📋 *Cancelaciones:*
• Con +48hs de anticipación: se devuelve la seña
• Con -48hs: sin devolución de seña
• Con -24hs: no se puede cancelar online
• Reprogramaciones: la seña se mantiene

✅ *Antes de tu turno:*
• Vení con las uñas limpias, sin esmalte ni restos de producto
• Si tenés uñas postizas o acrílico de otro lugar, avisame antes
• Llegá 5 minutos antes para que arranquemos en horario

¡Cualquier consulta escribime! 🤍`;

const DEFAULT_TEMPLATE_CONFIRM = `¡Hola {nombre}! ✅ Recibí tu seña, el turno está confirmado:

📅 {fecha_hora}
💅 {tratamiento}

📋 *Políticas:*
• Cancelaciones con +48hs: devolución de seña
• Cancelaciones con -48hs: sin devolución
• Reprogramaciones: mantenemos la seña

¡Te espero! ✨`;

const fillTemplate = (template: string, appt: AppointmentWithService): string =>
  template
    .replace(/{nombre}/g, appt.client_name)
    .replace(/{tratamiento}/g, appt.services?.name ?? "Servicio")
    .replace(/{fecha_hora}/g, fmtDateTimeShort(appt.scheduled_at));

type Tab = "agenda" | "turnos" | "blocks" | "services" | "trash" | "config" | "story";

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
  const [waTemplateChat, setWaTemplateChat] = useState(DEFAULT_TEMPLATE_CHAT);
  const [waTemplateConfirm, setWaTemplateConfirm] = useState(DEFAULT_TEMPLATE_CONFIRM);

  // Cargar templates guardados desde settings (si existen)
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.wa_template_chat === "string") setWaTemplateChat(data.wa_template_chat);
        if (typeof data.wa_template_confirm === "string") setWaTemplateConfirm(data.wa_template_confirm);
      })
      .catch(() => { /* usa defaults */ });
  }, []);

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
    { id: "story", label: "Story IG", icon: Camera },
    { id: "config", label: "Config", icon: Settings },
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
        {tab === "turnos" && <TurnosTab appointments={appointments} services={services} waTemplateChat={waTemplateChat} waTemplateConfirm={waTemplateConfirm} />}
        {tab === "blocks" && <BlocksTab blocks={blocks} />}
        {tab === "services" && <ServicesTab services={services} />}
        {tab === "trash" && <TrashTab appointments={appointments} />}
        {tab === "story" && <InstagramStoryGenerator />}
        {tab === "config" && <ConfigTab waTemplateChat={waTemplateChat} setWaTemplateChat={setWaTemplateChat} waTemplateConfirm={waTemplateConfirm} setWaTemplateConfirm={setWaTemplateConfirm} />}
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
                        {Array.isArray(appt.extras) && appt.extras.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {(appt.extras as ExtraSelection[]).map((e) => (
                              <span key={e.service_id} className="text-[10px] bg-[var(--color-rose)]/15 text-[var(--color-rose)] px-1.5 py-0.5 rounded-full">
                                {e.name}{e.quantity > 1 ? ` ×${e.quantity}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
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

function TurnosTab({ appointments, services, waTemplateChat, waTemplateConfirm }: {
  appointments: AppointmentWithService[];
  services: Service[];
  waTemplateChat: string;
  waTemplateConfirm: string;
}) {
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
    // Abrir ventana ANTES del await — evita que el browser bloquee el popup en mobile
    const waWindow = window.open("", "_blank");
    if (!await action(appt, { status: "deposit_paid" })) {
      waWindow?.close();
      return;
    }
    const url = whatsappLinkForPhone(appt.client_phone, fillTemplate(waTemplateConfirm, appt));
    if (waWindow) waWindow.location.href = url;
    else window.open(url, "_blank");
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

      {adding && (
        <ManualBookingForm
          services={services.filter((s) => !s.is_addon)}
          addons={services.filter((s) => s.is_addon)}
          appointments={appointments}
          onClose={() => setAdding(false)}
        />
      )}

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
                {Array.isArray(a.extras) && a.extras.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(a.extras as ExtraSelection[]).map((e) => (
                      <span key={e.service_id} className="text-[10px] bg-[var(--color-rose)]/15 text-[var(--color-rose)] px-1.5 py-0.5 rounded-full">
                        {e.name}{e.quantity > 1 ? ` ×${e.quantity}` : ""}
                      </span>
                    ))}
                  </div>
                )}
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
                  href={whatsappLinkForPhone(a.client_phone, fillTemplate(waTemplateChat, a))}
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
function ManualBookingForm({
  services,
  addons,
  appointments,
  onClose,
}: {
  services: Service[];
  addons: Service[];
  appointments: AppointmentWithService[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [forceConflict, setForceConflict] = useState(false);
  const [forceMissing, setForceMissing] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<ExtraSelection[]>([]);

  // Client autocomplete
  const [clientLookupQuery, setClientLookupQuery] = useState("");
  const [clientResults, setClientResults] = useState<{ client_name: string; client_phone: string; client_email: string }[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearching, setClientSearching] = useState(false);

  const activeServices = services.filter((s) => s.active);

  const todayValue = dateToInputValue(new Date());
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [selectedTime, setSelectedTime] = useState("");

  const [form, setForm] = useState({
    service_id: activeServices[0]?.id ?? "",
    client_name: "",
    client_phone: "",
    client_email: "",
    notes: "",
    confirmed: true,
  });

  // ── Slots del día ──────────────────────────────────────────────────────────
  const slots = useMemo(() => {
    if (!selectedDate) return [];
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dow = dateObj.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const hours = BUSINESS_HOURS[dow];
    if (!hours) return [];
    const [oh, om] = hours.open.split(":").map(Number);
    const [ch, cm] = hours.close.split(":").map(Number);
    const result: string[] = [];
    const cur = new Date(dateObj);
    cur.setHours(oh, om, 0, 0);
    const end = new Date(dateObj);
    end.setHours(ch, cm, 0, 0);
    while (cur < end) {
      result.push(
        cur.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
      cur.setMinutes(cur.getMinutes() + 30);
    }
    return result;
  }, [selectedDate]);

  // ── Turnos activos del día ─────────────────────────────────────────────────
  const dayAppts = useMemo(() => {
    if (!selectedDate) return [];
    const [y, m, d] = selectedDate.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    return appointments.filter(
      (a) => a.status !== "cancelled" && sameArtDay(a.scheduled_at, target)
    );
  }, [appointments, selectedDate]);

  /**
   * occupiedMap: "HH:mm" → appointment que ocupa ese slot.
   * Un turno de 90 min arrancando a las 10:00 ocupa 10:00, 10:30 y 11:00.
   * Chequeamos si el slot cae dentro de [start, start + duration).
   */
  const occupiedMap = useMemo(() => {
    const map: Record<string, AppointmentWithService> = {};
    for (const slot of slots) {
      const [sh, sm] = slot.split(":").map(Number);
      for (const a of dayAppts) {
        const aStart = new Date(a.scheduled_at).getTime();
        const aEnd = aStart + (a.duration_minutes ?? 30) * 60_000;
        const [y, mo, dd] = selectedDate.split("-").map(Number);
        const slotMs = new Date(y, mo - 1, dd, sh, sm).getTime();
        if (slotMs >= aStart && slotMs < aEnd) {
          map[slot] = a;
          break;
        }
      }
    }
    return map;
  }, [slots, dayAppts, selectedDate]);

  // ── Extras helpers ────────────────────────────────────────────────────────
  const extrasTotalDuration = selectedExtras.reduce((s, e) => s + e.total_duration, 0);

  const getAddonExtra = (id: string) => selectedExtras.find((e) => e.service_id === id);

  const toggleAddon = (addon: Service) => {
    const exists = getAddonExtra(addon.id);
    if (exists) {
      setSelectedExtras(selectedExtras.filter((e) => e.service_id !== addon.id));
    } else {
      setSelectedExtras([
        ...selectedExtras,
        {
          service_id: addon.id,
          slug: addon.slug,
          name: addon.name,
          quantity: 1,
          unit_price: addon.price_ars,
          unit_duration: addon.duration_minutes,
          total_price: addon.price_ars,
          total_duration: addon.duration_minutes,
        },
      ]);
    }
  };

  const setAddonQty = (addon: Service, qty: number) => {
    if (qty <= 0) {
      setSelectedExtras(selectedExtras.filter((e) => e.service_id !== addon.id));
      return;
    }
    const exists = getAddonExtra(addon.id);
    if (exists) {
      setSelectedExtras(
        selectedExtras.map((e) =>
          e.service_id === addon.id
            ? { ...e, quantity: qty, total_price: addon.price_ars * qty, total_duration: addon.duration_minutes * qty }
            : e
        )
      );
    } else {
      setSelectedExtras([
        ...selectedExtras,
        {
          service_id: addon.id,
          slug: addon.slug,
          name: addon.name,
          quantity: qty,
          unit_price: addon.price_ars,
          unit_duration: addon.duration_minutes,
          total_price: addon.price_ars * qty,
          total_duration: addon.duration_minutes * qty,
        },
      ]);
    }
  };

  // ── Client autocomplete debounce ─────────────────────────────────────────
  useEffect(() => {
    const q = clientLookupQuery.trim();
    if (q.length < 3) {
      setClientResults([]);
      setShowClientDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setClientSearching(true);
      try {
        const res = await fetch(`/api/admin/client-lookup?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setClientResults(data.clients ?? []);
        setShowClientDropdown(true);
      } catch {
        // silently fail
      } finally {
        setClientSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [clientLookupQuery]);

  // ── Conflicto en el slot elegido ──────────────────────────────────────────
  // FIX: usar `?? null` para evitar que `undefined !== null` sea `true`
  const conflictAppt = selectedTime ? (occupiedMap[selectedTime] ?? null) : null;

  // ── ISO datetime del turno ────────────────────────────────────────────────
  const scheduledAt = useMemo(() => {
    if (!selectedDate || !selectedTime) return "";
    const [h, min] = selectedTime.split(":").map(Number);
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d, h, min).toISOString();
  }, [selectedDate, selectedTime]);

  // ── Datos faltantes (advertencia suave, no bloqueo) ───────────────────────
  const missingFields = [
    !form.client_name && "nombre",
    !form.client_phone && "celular",
    !form.client_email && "email",
  ].filter(Boolean) as string[];
  const hasMissing = missingFields.length > 0;

  // ── Reset al cambiar fecha ────────────────────────────────────────────────
  const handleDateChange = (v: string) => {
    setSelectedDate(v);
    setSelectedTime("");
    setForceConflict(false);
    setForceMissing(false);
  };

  const handleTimeChange = (v: string) => {
    setSelectedTime(v);
    setForceConflict(false);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;
    if (conflictAppt && !forceConflict) return;
    if (hasMissing && !forceMissing) return;

    setLoading(true);
    const res = await fetch("/api/admin/manual-booking", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, scheduled_at: scheduledAt, extras: selectedExtras }),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      alert("Error al crear el turno");
    }
  };

  const isDayClosed = !!selectedDate && slots.length === 0;

  // El botón solo se deshabilita si falta el horario, o hay conflicto/datos sin confirmar
  const canSubmit =
    !!scheduledAt &&
    !isDayClosed &&
    (!conflictAppt || forceConflict) &&
    (!hasMissing || forceMissing);

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-[#141414] border border-white/10 rounded-xl p-5 mb-6"
    >
      <h3 className="font-display text-xl mb-4">Nuevo turno manual</h3>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Servicio */}
        <div>
          <label className="label !text-white/60">Servicio</label>
          <select
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
          >
            {activeServices.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="label !text-white/60">Fecha</label>
          <input
            type="date"
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Extras / Addons */}
      {addons.length > 0 && (
        <div className="mb-4">
          <p className="label !text-white/60 mb-2">Extras opcionales</p>
          <div className="space-y-2">
            {addons.filter((a) => a.active).map((addon) => {
              const extra = getAddonExtra(addon.id);
              const isSelected = !!extra;

              if (addon.addon_per_nail) {
                const qty = extra?.quantity ?? 0;
                return (
                  <div key={addon.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${isSelected ? "border-[var(--color-rose)]/60 bg-[var(--color-rose)]/5" : "border-white/10 bg-[#0A0A0A]"}`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white">{addon.name}</span>
                      <span className="text-xs text-white/40 ml-2">{fmtMoney(addon.price_ars)}/uña · {addon.duration_minutes}min/uña</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => setAddonQty(addon, Math.max(0, qty - 1))} disabled={qty === 0}
                        className="w-6 h-6 rounded border border-white/15 flex items-center justify-center hover:border-[var(--color-rose)] disabled:opacity-30">
                        <Minus size={10} />
                      </button>
                      <span className="w-5 text-center text-sm">{qty}</span>
                      <button type="button" onClick={() => setAddonQty(addon, Math.min(9, qty + 1))} disabled={qty >= 9}
                        className="w-6 h-6 rounded border border-white/15 flex items-center justify-center hover:border-[var(--color-rose)] disabled:opacity-30">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <label key={addon.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${isSelected ? "border-[var(--color-rose)]/60 bg-[var(--color-rose)]/5" : "border-white/10 bg-[#0A0A0A]"}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleAddon(addon)} className="accent-[var(--color-rose)]" />
                  <span className="text-sm text-white flex-1">{addon.name}</span>
                  <span className="text-xs text-white/40">{fmtMoney(addon.price_ars)} · {addon.duration_minutes}min</span>
                </label>
              );
            })}
          </div>
          {extrasTotalDuration > 0 && (
            <p className="text-xs text-[var(--color-rose)] mt-2">
              +{extrasTotalDuration} min de extras incluidos en el turno
            </p>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-4">

        {/* Horario dropdown */}
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Horario</label>
          {isDayClosed ? (
            <p className="text-sm text-yellow-400 mt-1">
              Este día está cerrado — no hay horarios disponibles.
            </p>
          ) : (
            <select
              className={`input !bg-[#0A0A0A] !border-white/15 !text-white ${
                conflictAppt ? "!border-orange-500/60" : selectedTime ? "!border-green-500/40" : ""
              }`}
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
            >
              <option value="">— Elegí un horario —</option>
              {slots.map((slot) => {
                const occ = occupiedMap[slot];
                return (
                  <option key={slot} value={slot}>
                    {occ
                      ? `⚠ ${slot}  —  OCUPADO: ${occ.client_name} (${occ.services?.name ?? "turno"})`
                      : `${slot}`}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Banner: conflicto de horario */}
        {conflictAppt && (
          <div className="sm:col-span-2 bg-orange-500/10 border border-orange-500/40 rounded-xl p-4">
            <p className="text-orange-300 font-semibold text-sm mb-1">
              ⚠️ Este horario ya tiene un turno
            </p>
            <p className="text-orange-200/80 text-xs mb-3">
              <strong>{conflictAppt.client_name}</strong> tiene{" "}
              <strong>{conflictAppt.services?.name ?? "un servicio"}</strong> a las{" "}
              <strong>{selectedTime}</strong>
              {(conflictAppt.duration_minutes ?? 0) > 30 && (
                <> (dura {conflictAppt.duration_minutes} min, ocupa varios slots)</>
              )}
              . Si forzás este turno, el error es del admin.
            </p>
            <label className="flex items-center gap-2 text-sm text-orange-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceConflict}
                onChange={(e) => setForceConflict(e.target.checked)}
                className="accent-orange-500"
              />
              Entiendo el conflicto y quiero forzar el turno igual
            </label>
          </div>
        )}

        {/* Datos del cliente */}
        <div className="relative">
          <label className="label !text-white/60">Nombre</label>
          <div className="flex gap-1">
            <input
              placeholder="Nombre de la clienta"
              className="input !bg-[#0A0A0A] !border-white/15 !text-white flex-1"
              value={form.client_name}
              onChange={(e) => {
                setForm({ ...form, client_name: e.target.value });
                setClientLookupQuery(e.target.value);
              }}
              onFocus={() => clientResults.length > 0 && setShowClientDropdown(true)}
              autoComplete="off"
            />
            {clientSearching && <Loader2 size={14} className="animate-spin self-center text-white/40" />}
            {!clientSearching && form.client_name.length >= 3 && (
              <button type="button" onClick={() => setShowClientDropdown((v) => !v)} title="Buscar clienta anterior"
                className="px-2 rounded-lg border border-white/15 hover:border-[var(--color-rose)] text-white/50 hover:text-[var(--color-rose)]">
                <UserSearch size={14} />
              </button>
            )}
          </div>
          {showClientDropdown && clientResults.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-[#1a1a1a] border border-white/15 rounded-xl shadow-xl overflow-hidden">
              {clientResults.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, client_name: c.client_name, client_phone: c.client_phone, client_email: c.client_email });
                    setShowClientDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-rose)]/10 border-b border-white/5 last:border-b-0"
                >
                  <p className="text-sm text-white font-medium">{c.client_name}</p>
                  <p className="text-xs text-white/50">{c.client_phone}{c.client_email ? ` · ${c.client_email}` : ""}</p>
                </button>
              ))}
            </div>
          )}
          {showClientDropdown && clientResults.length === 0 && form.client_name.length >= 3 && !clientSearching && (
            <div className="absolute z-20 top-full mt-1 w-full bg-[#1a1a1a] border border-white/15 rounded-xl px-4 py-3 shadow-xl">
              <p className="text-xs text-white/50">Sin resultados · <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded-full text-[10px]">Clienta nueva</span></p>
            </div>
          )}
        </div>
        <div>
          <label className="label !text-white/60">Celular</label>
          <input
            placeholder="Ej: 1156789012"
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
            value={form.client_phone}
            onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Email</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
            value={form.client_email}
            onChange={(e) => setForm({ ...form, client_email: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label !text-white/60">Notas</label>
          <input
            placeholder="Opcional"
            className="input !bg-[#0A0A0A] !border-white/15 !text-white"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Banner: datos faltantes */}
        {hasMissing && (
          <div className="sm:col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-300 font-semibold text-sm mb-1">
              Faltan datos: {missingFields.join(", ")}
            </p>
            <p className="text-yellow-200/70 text-xs mb-3">
              Podés guardar igual, pero el turno quedará incompleto y no podrás enviar WhatsApp
              correctamente.
            </p>
            <label className="flex items-center gap-2 text-sm text-yellow-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceMissing}
                onChange={(e) => setForceMissing(e.target.checked)}
                className="accent-yellow-500"
              />
              Guardar de todas formas con datos incompletos
            </label>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 mb-4 text-sm">
        <input
          type="checkbox"
          checked={form.confirmed}
          onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
        />
        Marcar seña como recibida
      </label>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary !border-white/30 !text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn-primary !bg-[var(--color-rose)] !text-black disabled:opacity-40 disabled:cursor-not-allowed"
          title={!scheduledAt ? "Elegí una fecha y horario primero" : undefined}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Crear turno"}
        </button>
        {!scheduledAt && (
          <p className="text-xs text-white/40 self-center">Elegí fecha y horario para continuar</p>
        )}
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
// CONFIG TAB — edición de templates de mensajes WA
// =====================================================================
function ConfigTab({
  waTemplateChat,
  setWaTemplateChat,
  waTemplateConfirm,
  setWaTemplateConfirm,
}: {
  waTemplateChat: string;
  setWaTemplateChat: (v: string) => void;
  waTemplateConfirm: string;
  setWaTemplateConfirm: (v: string) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const saveTemplate = async (key: string, value: string) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSaved(key);
        setTimeout(() => setSaved(null), 2500);
      }
    } finally {
      setSaving(null);
    }
  };

  const TemplateBlock = ({
    title,
    description,
    settingKey,
    value,
    onChange,
    rows = 12,
  }: {
    title: string;
    description: string;
    settingKey: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
  }) => (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-6">
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-xs text-white/40 mb-4">{description}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white/80 font-mono resize-y focus:outline-none focus:border-[var(--color-rose)] leading-relaxed"
      />
      <button
        onClick={() => saveTemplate(settingKey, value)}
        disabled={!!saving}
        className="mt-3 btn-primary !bg-[var(--color-rose)] !text-black flex items-center gap-2"
      >
        {saving === settingKey
          ? <Loader2 size={14} className="animate-spin" />
          : saved === settingKey
          ? <Check size={14} />
          : null}
        {saved === settingKey ? "¡Guardado!" : "Guardar mensaje"}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-2xl mb-2">Mensajes automáticos de WhatsApp</h2>
        <p className="text-sm text-white/50 mb-2">
          Personalizá los mensajes que se envían a los clientes. Usá estos placeholders:
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {["{nombre}", "{tratamiento}", "{fecha_hora}"].map((p) => (
            <code key={p} className="bg-white/10 text-[var(--color-rose)] text-xs px-2 py-1 rounded font-mono">{p}</code>
          ))}
        </div>
      </div>

      <TemplateBlock
        title="💬 Mensaje de chat (ícono WA en cada turno)"
        description="Se pre-escribe en WhatsApp al tocar el ícono de chat. Incluye recordatorios e instrucciones previas al turno."
        settingKey="wa_template_chat"
        value={waTemplateChat}
        onChange={setWaTemplateChat}
        rows={14}
      />

      <TemplateBlock
        title="✅ Mensaje de confirmación de seña"
        description="Se envía automáticamente al marcar 'Confirmar seña'. Confirma el turno al cliente."
        settingKey="wa_template_confirm"
        value={waTemplateConfirm}
        onChange={setWaTemplateConfirm}
        rows={10}
      />
    </div>
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
