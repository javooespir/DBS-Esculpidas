"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Lock, Tag, MessageSquare, LogOut, Download, Plus, Check, X, Trash2, Loader2 } from "lucide-react";
import type { AppointmentWithService, BlockedSlot, Service, Testimonial } from "@/lib/types";
import { APPOINTMENT_STATUS_LABEL } from "@/lib/constants";

type Tab = "agenda" | "blocks" | "services" | "testimonials";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function AdminDashboard({
  appointments,
  blocks,
  services,
  testimonials,
}: {
  appointments: AppointmentWithService[];
  blocks: BlockedSlot[];
  services: Service[];
  testimonials: Testimonial[];
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
    { id: "blocks", label: "Bloqueos", icon: Lock },
    { id: "services", label: "Servicios", icon: Tag },
    { id: "testimonials", label: "Testimonios", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)]">
      <header className="bg-white border-b border-[var(--color-line)] sticky top-0 z-40">
        <div className="container-page px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">Panel admin</p>
            <h1 className="font-display text-2xl">DBS Esculpidas</h1>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/admin/ics" className="btn-secondary">
              <Download size={14} /> ICS
            </a>
            <button onClick={logout} className="btn-ghost">
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
                tab === id ? "border-[var(--color-rose-deep)] text-[var(--color-ink)]" : "border-transparent text-[var(--color-muted)]"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-page px-6 py-8">
        {tab === "agenda" && <AgendaTab appointments={appointments} services={services} />}
        {tab === "blocks" && <BlocksTab blocks={blocks} />}
        {tab === "services" && <ServicesTab services={services} />}
        {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} />}
      </main>
    </div>
  );
}

// =====================================================================
// AGENDA TAB
// =====================================================================
function AgendaTab({
  appointments,
  services,
}: {
  appointments: AppointmentWithService[];
  services: Service[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const today = new Date().toDateString();
  const [filter, setFilter] = useState<"today" | "future" | "all">("today");

  const filtered = appointments.filter((a) => {
    if (a.status === "cancelled") return false;
    const d = new Date(a.scheduled_at);
    if (filter === "today") return d.toDateString() === today;
    if (filter === "future") return d > new Date();
    return true;
  });

  const action = async (id: string, body: object, method: "PATCH" | "DELETE" = "PATCH") => {
    await fetch(`/api/turnos/${id}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-1 bg-white rounded-lg border border-[var(--color-line)] p-1">
          {(["today", "future", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded ${filter === f ? "bg-[var(--color-ink)] text-white" : ""}`}
            >
              {f === "today" ? "Hoy" : f === "future" ? "Próximos" : "Todos"}
            </button>
          ))}
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus size={14} /> Nuevo turno
        </button>
      </div>

      {adding && <ManualBookingForm services={services} onClose={() => setAdding(false)} />}

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-[var(--color-muted)]">Sin turnos en esta vista.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li key={a.id} className="card flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-xl">{a.client_name}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {fmtDateTime(a.scheduled_at)} · {a.services?.name ?? "—"}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {a.client_phone} · {a.client_email}
                </p>
                {a.notes && <p className="text-xs italic mt-1">&ldquo;{a.notes}&rdquo;</p>}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  a.status === "deposit_paid"
                    ? "bg-green-100 text-green-800"
                    : a.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {APPOINTMENT_STATUS_LABEL[a.status]}
              </span>
              <div className="flex gap-2">
                {a.status === "pending" && (
                  <button
                    onClick={() => action(a.id, { status: "deposit_paid" })}
                    className="btn-ghost"
                    title="Confirmar seña"
                  >
                    <Check size={16} />
                  </button>
                )}
                {a.status !== "completed" && (
                  <button
                    onClick={() => action(a.id, { status: "completed" })}
                    className="btn-ghost"
                    title="Marcar completado"
                  >
                    <Check size={16} className="text-green-600" />
                  </button>
                )}
                <button
                  onClick={() => {
                    const reason = prompt("Motivo de cancelación (opcional):");
                    if (confirm("¿Cancelar este turno? Se enviará email a la clienta."))
                      action(a.id, { reason: reason ?? undefined }, "DELETE");
                  }}
                  className="btn-ghost"
                  title="Cancelar"
                >
                  <X size={16} className="text-red-600" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ManualBookingForm({ services, onClose }: { services: Service[]; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    service_id: services[0]?.id ?? "",
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
    <form onSubmit={submit} className="card mb-6">
      <h3 className="font-display text-xl mb-4">Nuevo turno manual</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Servicio</label>
          <select required className="input" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Fecha y hora</label>
          <input type="datetime-local" required className="input" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
        </div>
        <div>
          <label className="label">Nombre</label>
          <input required className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Celular</label>
          <input required className="input" value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input required type="email" className="input" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notas</label>
          <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 mb-4 text-sm">
        <input type="checkbox" checked={form.confirmed} onChange={(e) => setForm({ ...form, confirmed: e.target.checked })} />
        Marcar seña como recibida (saltea estado pendiente)
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Crear turno"}
        </button>
      </div>
    </form>
  );
}

// =====================================================================
// BLOQUEOS TAB
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
    if (res.ok) {
      setForm({ start_at: "", end_at: "", reason: "" });
      router.refresh();
    } else alert("Error");
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar bloqueo?")) return;
    await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
    router.refresh();
  };

  // helpers de bloqueo rápido
  const quickBlock = (preset: "morning" | "afternoon" | "fullday") => {
    const today = new Date();
    today.setMinutes(0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);
    if (preset === "morning") {
      start.setHours(9);
      end.setHours(13);
    } else if (preset === "afternoon") {
      start.setHours(13);
      end.setHours(18);
    } else {
      start.setHours(0);
      end.setHours(23, 59);
    }
    const toLocal = (d: Date) => {
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    };
    setForm({ start_at: toLocal(start), end_at: toLocal(end), reason: "" });
  };

  return (
    <>
      <form onSubmit={add} className="card mb-6">
        <h3 className="font-display text-xl mb-4">Nuevo bloqueo</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button type="button" onClick={() => quickBlock("morning")} className="btn-ghost text-xs">Mañana hoy</button>
          <button type="button" onClick={() => quickBlock("afternoon")} className="btn-ghost text-xs">Tarde hoy</button>
          <button type="button" onClick={() => quickBlock("fullday")} className="btn-ghost text-xs">Día completo hoy</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Desde</label>
            <input type="datetime-local" required className="input" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="datetime-local" required className="input" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        <button disabled={loading} className="btn-primary">{loading ? <Loader2 size={14} className="animate-spin" /> : "Bloquear"}</button>
      </form>

      <ul className="space-y-2">
        {blocks.length === 0 ? (
          <p className="text-[var(--color-muted)]">No hay bloqueos activos.</p>
        ) : (
          blocks.map((b) => (
            <li key={b.id} className="card flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium">
                  {fmtDateTime(b.start_at)} → {fmtDateTime(b.end_at)}
                </p>
                {b.reason && <p className="text-sm text-[var(--color-muted)]">{b.reason}</p>}
              </div>
              <button onClick={() => remove(b.id)} className="btn-ghost text-red-600">
                <Trash2 size={14} />
              </button>
            </li>
          ))
        )}
      </ul>
    </>
  );
}

// =====================================================================
// SERVICIOS TAB
// =====================================================================
function ServicesTab({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Partial<Service>>>({});

  const save = async (id: string) => {
    const update = draft[id];
    if (!update) return;
    await fetch(`/api/admin/services?id=${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
    setDraft((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
    router.refresh();
  };

  return (
    <ul className="space-y-3">
      {services.map((s) => {
        const d = draft[s.id] ?? {};
        const dirty = Object.keys(d).length > 0;
        return (
          <li key={s.id} className="card grid sm:grid-cols-[1fr_120px_120px_120px_auto] gap-3 items-end">
            <div>
              <label className="label">Nombre</label>
              <input className="input" defaultValue={s.name} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, name: e.target.value } })} />
            </div>
            <div>
              <label className="label">Precio</label>
              <input type="number" className="input" defaultValue={s.price_ars} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, price_ars: Number(e.target.value) } })} />
            </div>
            <div>
              <label className="label">Duración (min)</label>
              <input type="number" className="input" defaultValue={s.duration_minutes} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, duration_minutes: Number(e.target.value) } })} />
            </div>
            <div>
              <label className="label">Seña</label>
              <input type="number" className="input" defaultValue={s.deposit_ars} onChange={(e) => setDraft({ ...draft, [s.id]: { ...d, deposit_ars: Number(e.target.value) } })} />
            </div>
            <button onClick={() => save(s.id)} disabled={!dirty} className="btn-primary disabled:opacity-30">
              <Check size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// =====================================================================
// TESTIMONIOS TAB
// =====================================================================
function TestimonialsTab({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ client_name: "", text: "", rating: 5 });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ client_name: "", text: "", rating: 5 });
    setAdding(false);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar testimonio?")) return;
    await fetch(`/api/admin/testimonials?id=${id}`, { method: "DELETE" });
    router.refresh();
  };

  const toggle = async (id: string, visible: boolean) => {
    await fetch(`/api/admin/testimonials?id=${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visible }),
    });
    router.refresh();
  };

  return (
    <>
      <div className="mb-6">
        <button onClick={() => setAdding(!adding)} className="btn-primary">
          <Plus size={14} /> Nuevo testimonio
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-6">
          <div className="space-y-3 mb-4">
            <div>
              <label className="label">Nombre</label>
              <input required className="input" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Texto</label>
              <textarea required rows={3} className="input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary">Guardar</button>
        </form>
      )}

      <ul className="space-y-3">
        {testimonials.map((t) => (
          <li key={t.id} className="card">
            <div className="flex items-start justify-between mb-2 gap-3">
              <p className="font-medium">{t.client_name}</p>
              <div className="flex gap-2">
                <button onClick={() => toggle(t.id, !t.visible)} className="btn-ghost text-xs">
                  {t.visible ? "Ocultar" : "Mostrar"}
                </button>
                <button onClick={() => remove(t.id)} className="btn-ghost text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm italic">&ldquo;{t.text}&rdquo;</p>
            {!t.visible && <p className="text-xs text-[var(--color-muted)] mt-2">Oculto en el sitio</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
