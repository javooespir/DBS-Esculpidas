"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Clock, MessageCircle, Calendar } from "lucide-react";
import { Instagram } from "@/components/icons/Instagram";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { BUSINESS, instagramLink, whatsappLink } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DAY_NAMES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString("es-AR", { month: "long" });

  // Día de la semana del 1° del mes (lunes=0)
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Completar hasta múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-lg capitalize">{monthName} {year}</span>
        <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">30 min</span>
      </div>

      {/* Días */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAY_NAMES.map((d) => (
          <span key={d} className="text-[10px] font-semibold text-[var(--color-muted)] py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const isToday = day === today;
          const isPast = day < today;
          const isWeekend = (i + firstDay) % 7 >= 5 || (firstDay + day - 1) % 7 >= 5;

          // Calcular si es fin de semana real
          const dayOfWeek = new Date(year, month, day).getDay();
          const isSunday = dayOfWeek === 0;
          const isSat = dayOfWeek === 6;

          return (
            <button
              key={i}
              disabled={isPast || isSunday}
              className={`
                h-8 w-full rounded-lg text-sm font-medium transition-all duration-200
                ${isToday
                  ? "bg-[var(--color-rose)] text-white shadow-sm"
                  : isPast || isSunday
                    ? "text-[var(--color-muted)] opacity-30 cursor-not-allowed"
                    : "hover:bg-[var(--color-rose-soft)] hover:text-[var(--color-rose-deep)] cursor-pointer"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--color-line)]">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <span className="w-3 h-3 rounded-full bg-[var(--color-rose)] inline-block" /> Hoy
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <span className="w-3 h-3 rounded-lg border border-[var(--color-rose)] inline-block" /> Disponible
        </span>
      </div>
    </div>
  );
}

export function BookingCTA() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const left = container.querySelector(".cta-left");
      const calendar = container.querySelector(".cta-calendar");
      const info = container.querySelector(".cta-info");

      gsap.set([left, calendar, info], { opacity: 0, y: 40 });

      gsap.to(left, {
        opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: container, start: "top 80%", once: true },
      });

      gsap.to(calendar, {
        opacity: 1, y: 0, duration: 0.9, delay: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: container, start: "top 80%", once: true },
      });

      gsap.to(info, {
        opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: "power2.out",
        scrollTrigger: { trigger: container, start: "top 70%", once: true },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="section bg-[var(--color-rose-soft)]">
      <div className="container-page">

        {/* Grid principal */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">

          {/* Texto izquierdo */}
          <div className="cta-left">
            <p className="eyebrow mb-4">Reservas</p>
            <h2 className="font-display text-5xl md:text-6xl leading-tight font-medium mb-6">
              Tu próximo turno<br />te espera.
            </h2>
            <p className="text-base md:text-lg text-[var(--color-ink-soft)] mb-10 leading-relaxed max-w-md">
              Elegí servicio, día y horario. La seña confirma tu reserva. Fácil, rápido, sin llamadas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/turnos" className="btn-primary">
                <Calendar size={16} /> Reservar turno
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <Instagram size={16} /> Instagram
              </a>
            </div>
          </div>

          {/* Calendario derecha */}
          <div className="cta-calendar">
            <MiniCalendar />
          </div>
        </div>

        {/* Info bar */}
        <div className="cta-info grid sm:grid-cols-2 gap-4 pt-8 border-t border-[var(--color-line)] max-w-md">
          <div className="flex items-start gap-3">
            <MapPin size={20} style={{ color: "var(--color-rose-deep)" }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{BUSINESS.address}</p>
              <p className="text-sm text-[var(--color-muted)]">Ituzaingó, Buenos Aires</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={20} style={{ color: "var(--color-rose-deep)" }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Lun a Vie 9 a 18 hs</p>
              <p className="text-sm text-[var(--color-muted)]">Sábados 9 a 14 hs</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
