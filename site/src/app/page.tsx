"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  Star,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { InstagramIcon } from "@/components/InstagramIcon";

const services = [
  {
    name: "Uñas Esculpidas",
    desc: "Acrílico o gel, largas o cortas. Las construimos desde cero con la forma que mejor te queda.",
    detail: "Duración 3–4 semanas",
  },
  {
    name: "Nail Art",
    desc: "Diseños a mano alzada, encapsulados, degradados y cromados. Cada set es único.",
    detail: "Diseño personalizado",
  },
  {
    name: "Manicura Profesional",
    desc: "Esmaltado en gel o semipermanente con curado UV. Colores de temporada siempre disponibles.",
    detail: "Dura hasta 3 semanas",
  },
  {
    name: "Relleno y Mantenimiento",
    desc: "Para que tus uñas siempre luzcan recién hechas. Recomendamos cada 3 semanas.",
    detail: "Para clientas frecuentes",
  },
];

const galleryItems = [
  {
    label: "Hot pink & glitter",
    bg: "linear-gradient(135deg, oklch(65% 0.25 345) 0%, oklch(20% 0.05 345) 60%, oklch(10% 0.02 345) 100%)",
    span: "col-span-1 row-span-2 md:col-span-2 md:row-span-2",
  },
  {
    label: "Azul cobalto",
    bg: "linear-gradient(135deg, oklch(55% 0.22 250) 0%, oklch(38% 0.18 250) 100%)",
    span: "col-span-1 row-span-1",
  },
  {
    label: "Arte eléctrico",
    bg: "linear-gradient(135deg, oklch(15% 0.04 260) 0%, oklch(40% 0.20 250) 60%, oklch(15% 0.03 260) 100%)",
    span: "col-span-1 row-span-1",
  },
  {
    label: "French negro",
    bg: "linear-gradient(135deg, oklch(90% 0.04 345) 0%, oklch(78% 0.06 345) 50%, oklch(18% 0.03 345) 100%)",
    span: "col-span-2 row-span-1 md:col-span-2 md:row-span-1",
  },
];

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  const EASE = [0.25, 1, 0.5, 1] as const;

  const anim = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.6, ease: EASE, delay },
        };

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          id="inicio"
          className="relative min-h-dvh flex flex-col justify-center overflow-hidden pt-20"
          style={{ backgroundColor: "oklch(98% 0.008 60)" }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "-8rem",
              right: "-8rem",
              width: "500px",
              height: "500px",
              borderRadius: "9999px",
              background: "oklch(68% 0.14 345 / 0.12)",
              filter: "blur(80px)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: "-6rem",
              left: "-6rem",
              width: "400px",
              height: "400px",
              borderRadius: "9999px",
              background: "oklch(90% 0.06 345 / 0.25)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span
                className="inline-block text-sm font-medium px-4 py-1.5 rounded-full mb-6"
                style={{ color: "oklch(48% 0.17 345)", backgroundColor: "oklch(95% 0.03 345)" }}
              >
                Ituzaingó, Buenos Aires
              </span>
              <h1
                className="font-heading font-bold leading-tight mb-6"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                  color: "oklch(14% 0.015 345)",
                  lineHeight: 1.1,
                }}
              >
                Uñas que
                <br />
                <em
                  className="not-italic"
                  style={{ color: "oklch(48% 0.17 345)" }}
                >
                  hablan
                </em>
                <br />
                por vos.
              </h1>
              <p
                className="text-lg leading-relaxed max-w-md mb-10"
                style={{ color: "oklch(42% 0.025 345)" }}
              >
                Esculpidas, nail art y diseños personalizados en Ituzaingó.
                Cada set sale de acá pensado para durar y para que te encante.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.instagram.com/dbstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium px-7 py-3.5 rounded-full cursor-pointer transition-all duration-200 active:scale-[0.97]"
                  style={{
                    backgroundColor: "oklch(48% 0.17 345)",
                    color: "white",
                    boxShadow: "0 8px 24px oklch(48% 0.17 345 / 0.3)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(42% 0.17 345)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "oklch(48% 0.17 345)")}
                >
                  <InstagramIcon className="w-4 h-4" />
                  Ver trabajos en Instagram
                </a>
                <a
                  href="#turnos"
                  className="inline-flex items-center gap-2 font-medium px-7 py-3.5 rounded-full cursor-pointer transition-all duration-200 active:scale-[0.97]"
                  style={{
                    border: "1.5px solid oklch(68% 0.14 345)",
                    color: "oklch(48% 0.17 345)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(95% 0.03 345)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Pedir turno
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center gap-3 mt-10">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      style={{ fill: "oklch(78% 0.12 75)", color: "oklch(78% 0.12 75)" }}
                    />
                  ))}
                </div>
                <span className="text-sm" style={{ color: "oklch(42% 0.025 345)" }}>
                  5.0 en Google Maps · Ituzaingó
                </span>
              </div>
            </motion.div>

            {/* Hero visual mosaic */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
              className="relative hidden md:grid grid-cols-2 grid-rows-2 gap-3"
              style={{ height: "400px" }}
              aria-hidden="true"
            >
              {galleryItems.slice(0, 4).map((item, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden flex items-end p-3 ${
                    i === 0 ? "row-span-2" : ""
                  }`}
                  style={{ background: item.bg }}
                >
                  {/*
                    REEMPLAZAR: <Image src="/images/nail-{i+1}.jpg" alt="..." fill className="object-cover" />
                    Copiar fotos en: public/images/nail-1.jpg, nail-2.jpg, nail-3.jpg, nail-4.jpg
                  */}
                  <span className="text-xs text-white/50 font-medium">{item.label}</span>
                </div>
              ))}
              <div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "oklch(98% 0.008 60)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
              >
                <Logo className="w-12 h-12" />
              </div>
            </motion.div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{ opacity: 0.35 }}
            aria-hidden="true"
          >
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: "oklch(42% 0.025 345)" }}
            >
              Scroll
            </span>
            <div
              className="w-px h-8"
              style={{ backgroundColor: "oklch(68% 0.14 345)" }}
            />
          </div>
        </section>

        {/* ── GALLERY ──────────────────────────────────────────── */}
        <section
          id="galeria"
          className="py-20 md:py-32"
          style={{ backgroundColor: "oklch(95% 0.015 60)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...anim()} className="mb-12">
              <span
                className="text-sm font-medium tracking-widest uppercase"
                style={{ color: "oklch(48% 0.17 345)" }}
              >
                Trabajos recientes
              </span>
              <h2
                className="font-heading font-semibold mt-2"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "oklch(14% 0.015 345)",
                }}
              >
                Cada set,
                <br />
                una obra.
              </h2>
            </motion.div>

            <div
              className="grid gap-3 md:gap-4"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: "220px 220px" }}
            >
              {galleryItems.map((item, i) => (
                <motion.div
                  key={i}
                  {...anim(i * 0.08)}
                  className="rounded-2xl overflow-hidden group cursor-pointer"
                  style={{
                    background: item.bg,
                    gridColumn: i === 0 ? "1 / 3" : i === 3 ? "3 / 5" : "auto",
                    gridRow: i === 0 ? "1 / 3" : "auto",
                  }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full h-full flex items-end p-4">
                    {/*
                      REEMPLAZAR con:
                      import Image from "next/image";
                      <Image src={`/images/nail-${i+1}.jpg`} alt={item.label} fill className="object-cover" />
                    */}
                    <span className="text-xs text-white/0 group-hover:text-white/60 font-medium transition-all duration-200">
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div {...anim(0.3)} className="text-center mt-10">
              <a
                href="https://www.instagram.com/dbstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium cursor-pointer transition-all duration-200"
                style={{ color: "oklch(48% 0.17 345)" }}
              >
                <InstagramIcon className="w-4 h-4" />
                Ver todos los diseños en Instagram
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* ── SERVICES ─────────────────────────────────────────── */}
        <section
          id="servicios"
          className="py-20 md:py-32"
          style={{ backgroundColor: "oklch(98% 0.008 60)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...anim()} className="mb-16 md:flex md:items-end md:justify-between">
              <div>
                <span
                  className="text-sm font-medium tracking-widest uppercase"
                  style={{ color: "oklch(48% 0.17 345)" }}
                >
                  Servicios
                </span>
                <h2
                  className="font-heading font-semibold mt-2"
                  style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(14% 0.015 345)" }}
                >
                  Lo que hacemos
                </h2>
              </div>
              <p
                className="max-w-xs mt-4 md:mt-0 text-sm"
                style={{ color: "oklch(42% 0.025 345)" }}
              >
                Trabajamos solo con materiales de primera. Sin atajos.
              </p>
            </motion.div>

            <div
              className="grid md:grid-cols-2 rounded-2xl overflow-hidden"
              style={{
                gap: "1px",
                backgroundColor: "oklch(90% 0.06 345)",
              }}
            >
              {services.map((s, i) => (
                <motion.div
                  key={s.name}
                  {...anim(i * 0.07)}
                  className="p-8 transition-colors duration-300"
                  style={{ backgroundColor: "oklch(98% 0.008 60)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(95% 0.03 345)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "oklch(98% 0.008 60)")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className="font-heading text-xl font-semibold mb-3"
                        style={{ color: "oklch(14% 0.015 345)" }}
                      >
                        {s.name}
                      </h3>
                      <p className="leading-relaxed text-sm" style={{ color: "oklch(42% 0.025 345)" }}>
                        {s.desc}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-2xl font-heading font-light"
                      style={{ color: "oklch(68% 0.14 345)" }}
                    >
                      0{i + 1}
                    </span>
                  </div>
                  <div
                    className="mt-6 pt-6"
                    style={{ borderTop: "1px solid oklch(90% 0.06 345)" }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "oklch(48% 0.17 345)" }}
                    >
                      {s.detail}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ──────────────────────────────────────── */}
        <section
          className="py-20 md:py-32"
          style={{ backgroundColor: "oklch(48% 0.17 345)" }}
        >
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div {...anim()}>
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5"
                    style={{ fill: "oklch(78% 0.12 75)", color: "oklch(78% 0.12 75)" }}
                  />
                ))}
              </div>
              <blockquote
                className="font-heading font-normal italic mb-8"
                style={{
                  fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                  color: "white",
                  lineHeight: 1.5,
                }}
              >
                &ldquo;Me encantó el resultado. Las uñas quedaron perfectas y duraron un montón.
                Súper recomendada.&rdquo;
              </blockquote>
              <cite
                className="not-italic text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                Karen Ferreyra · Google Maps · ⭐ 5.0
              </cite>
            </motion.div>
          </div>
        </section>

        {/* ── BOOKING (OPCIONAL) ───────────────────────────────── */}
        <section
          id="turnos"
          className="py-20 md:py-32"
          style={{ backgroundColor: "oklch(95% 0.015 60)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...anim()} className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-sm font-medium tracking-widest uppercase"
                  style={{ color: "oklch(48% 0.17 345)" }}
                >
                  Agenda de turnos
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "oklch(78% 0.12 75 / 0.2)",
                    color: "oklch(45% 0.10 75)",
                    border: "1px solid oklch(78% 0.12 75 / 0.4)",
                  }}
                >
                  Próximamente
                </span>
              </div>
              <h2
                className="font-heading font-semibold"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "oklch(14% 0.015 345)",
                }}
              >
                Reservá tu turno
                <br />
                cuando quieras.
              </h2>
              <p
                className="mt-4 max-w-lg leading-relaxed"
                style={{ color: "oklch(42% 0.025 345)" }}
              >
                Estamos armando el sistema de turnos online. Por ahora, escribinos directo y
                te damos un horario en minutos.
              </p>
            </motion.div>

            <motion.div
              {...anim(0.15)}
              className="relative rounded-3xl p-8 max-w-md"
              style={{
                backgroundColor: "white",
                boxShadow: "0 20px 60px oklch(68% 0.14 345 / 0.15)",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute -top-3 -right-3 text-white text-xs font-semibold px-4 py-1.5 rounded-full"
                style={{ backgroundColor: "oklch(48% 0.17 345)" }}
              >
                Vista previa
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5" style={{ color: "oklch(48% 0.17 345)" }} />
                <span
                  className="font-heading text-lg font-semibold"
                  style={{ color: "oklch(14% 0.015 345)" }}
                >
                  Elegí tu horario
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-5">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium py-1"
                    style={{ color: "oklch(65% 0.015 345)" }}
                  >
                    {d}
                  </div>
                ))}
                {[...Array(28)].map((_, i) => {
                  const day = i + 1;
                  const selected = day === 14;
                  const available = [3, 5, 8, 10, 14, 17, 19, 22, 24].includes(day);
                  return (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="text-center text-xs py-1.5 rounded-lg font-medium"
                      style={{
                        backgroundColor: selected ? "oklch(48% 0.17 345)" : "transparent",
                        color: selected
                          ? "white"
                          : available
                          ? "oklch(14% 0.015 345)"
                          : "oklch(80% 0.015 345)",
                        cursor: available ? "default" : "not-allowed",
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 mb-6">
                {["10:00", "12:00", "15:00"].map((h, i) => (
                  <div
                    key={h}
                    aria-hidden="true"
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm"
                    style={{
                      border:
                        i === 1
                          ? "1.5px solid oklch(48% 0.17 345)"
                          : "1.5px solid oklch(90% 0.06 345)",
                      backgroundColor: i === 1 ? "oklch(95% 0.03 345)" : "transparent",
                      color: i === 1 ? "oklch(48% 0.17 345)" : "oklch(42% 0.025 345)",
                      fontWeight: i === 1 ? 500 : 400,
                    }}
                  >
                    <span>{h} hs</span>
                    <span className="text-xs" style={{ opacity: 0.65 }}>
                      {i === 1 ? "Seleccionado" : "Disponible"}
                    </span>
                  </div>
                ))}
              </div>

              <div
                aria-hidden="true"
                className="w-full text-white text-center py-3 rounded-full font-medium text-sm"
                style={{ backgroundColor: "oklch(48% 0.17 345)", opacity: 0.55 }}
              >
                Confirmar turno (próximamente)
              </div>
            </motion.div>

            <motion.p
              {...anim(0.25)}
              className="mt-8 text-sm italic"
              style={{ color: "oklch(65% 0.015 345)" }}
            >
              * El sistema de reservas online es un servicio adicional. Por ahora coordinamos
              por Instagram o WhatsApp.
            </motion.p>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────── */}
        <section
          id="contacto"
          className="py-20 md:py-32"
          style={{ backgroundColor: "oklch(98% 0.008 60)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div {...anim()} className="mb-14">
              <span
                className="text-sm font-medium tracking-widest uppercase"
                style={{ color: "oklch(48% 0.17 345)" }}
              >
                Contacto
              </span>
              <h2
                className="font-heading font-semibold mt-2"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "oklch(14% 0.015 345)" }}
              >
                Hablemos.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
              <motion.div {...anim(0.1)} className="flex flex-col gap-4">
                {/* Primary — Instagram */}
                <a
                  href="https://www.instagram.com/dbstudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-7 py-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] group"
                  style={{
                    backgroundColor: "oklch(48% 0.17 345)",
                    color: "white",
                    boxShadow: "0 8px 32px oklch(48% 0.17 345 / 0.3)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "oklch(42% 0.17 345)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "oklch(48% 0.17 345)")}
                >
                  <InstagramIcon className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-semibold text-base">Seguinos en Instagram</div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                      Ver trabajos y mandarnos un mensaje
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-70 group-hover:translate-x-1 transition-transform duration-200" />
                </a>

                {/* Optional — WhatsApp */}
                <div>
                  <div
                    className="flex items-center gap-4 px-7 py-4 rounded-2xl"
                    style={{
                      backgroundColor: "oklch(95% 0.015 60)",
                      color: "oklch(42% 0.025 345)",
                      border: "1.5px solid oklch(90% 0.06 345)",
                      opacity: 0.65,
                    }}
                  >
                    <MessageCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-semibold text-base">WhatsApp</div>
                      <div className="text-sm">011 5813-2493</div>
                    </div>
                    <span
                      className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "oklch(78% 0.12 75 / 0.2)",
                        color: "oklch(45% 0.10 75)",
                        border: "1px solid oklch(78% 0.12 75 / 0.4)",
                      }}
                    >
                      Próximamente
                    </span>
                  </div>
                  <p className="text-xs mt-1 px-1" style={{ color: "oklch(65% 0.015 345)" }}>
                    * Canal de contacto directo disponible próximamente.
                  </p>
                </div>

                {/* Optional — Email */}
                <div>
                  <div
                    className="flex items-center gap-4 px-7 py-4 rounded-2xl"
                    style={{
                      backgroundColor: "oklch(95% 0.015 60)",
                      color: "oklch(42% 0.025 345)",
                      border: "1.5px solid oklch(90% 0.06 345)",
                      opacity: 0.65,
                    }}
                  >
                    <Mail className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-semibold text-base">Email</div>
                      <div className="text-sm">Consultas por mail</div>
                    </div>
                    <span
                      className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "oklch(78% 0.12 75 / 0.2)",
                        color: "oklch(45% 0.10 75)",
                        border: "1px solid oklch(78% 0.12 75 / 0.4)",
                      }}
                    >
                      Próximamente
                    </span>
                  </div>
                  <p className="text-xs mt-1 px-1" style={{ color: "oklch(65% 0.015 345)" }}>
                    * Contacto por email disponible próximamente.
                  </p>
                </div>
              </motion.div>

              {/* Info block */}
              <motion.div {...anim(0.2)} className="space-y-8">
                <div>
                  <h3
                    className="font-heading text-xl font-semibold mb-4"
                    style={{ color: "oklch(14% 0.015 345)" }}
                  >
                    Encontranos
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "oklch(48% 0.17 345)" }}
                      />
                      <div>
                        <p className="font-medium text-sm" style={{ color: "oklch(14% 0.015 345)" }}>
                          Dirección
                        </p>
                        <p className="text-sm" style={{ color: "oklch(42% 0.025 345)" }}>
                          Cnel. Brandsen 2327
                        </p>
                        <p className="text-sm" style={{ color: "oklch(42% 0.025 345)" }}>
                          B1714 Ituzaingó, Buenos Aires
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "oklch(48% 0.17 345)" }}
                      />
                      <div>
                        <p className="font-medium text-sm" style={{ color: "oklch(14% 0.015 345)" }}>
                          Teléfono
                        </p>
                        <p className="text-sm" style={{ color: "oklch(42% 0.025 345)" }}>
                          011 5813-2493
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <InstagramIcon
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "oklch(48% 0.17 345)" }}
                      />
                      <div>
                        <p className="font-medium text-sm" style={{ color: "oklch(14% 0.015 345)" }}>
                          Instagram
                        </p>
                        <a
                          href="https://www.instagram.com/dbstudio"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm cursor-pointer hover:underline"
                          style={{ color: "oklch(48% 0.17 345)" }}
                        >
                          @dbstudio
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "oklch(95% 0.03 345)" }}
                >
                  <p
                    className="font-heading text-base font-semibold mb-2"
                    style={{ color: "oklch(14% 0.015 345)" }}
                  >
                    ¿Cómo pido turno ahora?
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(42% 0.025 345)" }}>
                    Mandanos un DM en Instagram con el servicio que querés y tu disponibilidad.
                    Te respondemos rápido y coordinamos el horario.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer
        className="py-12"
        style={{ backgroundColor: "oklch(14% 0.015 345)", color: "white" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <div>
                <p className="font-heading font-semibold text-base">DBS Esculpidas</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Nail Studio · Ituzaingó, Buenos Aires
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {["#servicios", "#galeria", "#turnos", "#contacto"].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="cursor-pointer transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  {["Servicios", "Galería", "Turnos", "Contacto"][i]}
                </a>
              ))}
            </div>

            <a
              href="https://www.instagram.com/dbstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer transition-colors duration-200"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            >
              <InstagramIcon className="w-4 h-4" />
              Instagram
            </a>
          </div>

          <div
            className="mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <p>© 2025 DBS Esculpidas. Todos los derechos reservados.</p>
            <p>
              Built with{" "}
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Claude Web Builder</span> by{" "}
              <a
                href="https://tododeia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.45)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                Tododeia
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
