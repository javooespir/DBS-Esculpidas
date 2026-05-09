"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import type { Service } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ServicesAnimatedProps {
  services: Service[];
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export function ServicesAnimated({ services }: ServicesAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      // Title animations
      gsap.from(".services-title, .services-eyebrow", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      });

      // Set initial state via JS — antes del batch para que empiecen invisibles
      const cards = container.querySelectorAll(".service-card");
      gsap.set(cards, { opacity: 0, y: 30 });

      // Service cards batch animation (scroll-triggered)
      ScrollTrigger.batch(".service-card", {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto",
          }),
        start: "top 80%",
        once: true,
      });

      // Hover animations for cards
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { y: -8, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { y: 0, duration: 0.3, ease: "power2.out", overwrite: "auto" });
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="servicios"
      className="section bg-[var(--color-bg)]"
    >
      <div className="container-page">
        <div className="max-w-2xl mb-16">
          <p className="services-eyebrow eyebrow mb-4">Servicios</p>
          <h2 className="services-title font-display text-4xl md:text-6xl leading-tight font-medium">
            Cada técnica, pensada para vos.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <article
              key={s.id}
              className="service-card card hover:border-[var(--color-rose)] transition-colors group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display text-2xl leading-tight pr-4">
                  {s.name}
                </h3>
                <span className="text-xs uppercase tracking-wider text-[var(--color-rose-deep)] whitespace-nowrap">
                  {fmtDuration(s.duration_minutes)}
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-[var(--color-muted)] mb-6 leading-relaxed">
                  {s.description}
                </p>
              )}
              <div className="mt-auto">
                <p className="font-display text-3xl mb-1">{fmtMoney(s.price_ars)}</p>
                <p className="text-xs text-[var(--color-muted)] mb-5">
                  Seña: {fmtMoney(s.deposit_ars)}
                </p>
                <Link
                  href={`/turnos?service=${s.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium border-b border-[var(--color-ink)] pb-1 hover:text-[var(--color-rose-deep)] hover:border-[var(--color-rose-deep)] transition-colors"
                >
                  Reservar <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 inline-flex items-center gap-3 border border-[var(--color-rose)] bg-[var(--color-rose-soft)] rounded-full px-5 py-3">
          <Sparkles
            size={16}
            style={{ color: "var(--color-rose-deep)" }}
            className="flex-shrink-0"
          />
          <p className="text-sm font-medium" style={{ color: "var(--color-rose-deep)" }}>
            Mantenimientos disponibles cada 15 a 21 días para todos los servicios
          </p>
        </div>
      </div>
    </section>
  );
}
