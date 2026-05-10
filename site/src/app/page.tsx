import Image from "next/image";
import Link from "next/link";
import { Sparkles, Heart, Shield, ArrowRight } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ScrollVideo } from "@/components/site/ScrollVideo";
import { ServicesAnimated } from "@/components/site/ServicesAnimated";
import { GalleryAnimated } from "@/components/site/GalleryAnimated";
import { BookingCTA } from "@/components/site/BookingCTA";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { whatsappLink } from "@/lib/constants";
import type { Service } from "@/lib/types";

export const revalidate = 60;

async function getData() {
  const [{ data: services }, { data: aboutSetting }] = await Promise.all([
    supabaseAdmin.from("services").select("*").eq("active", true).order("display_order"),
    supabaseAdmin.from("settings").select("value").eq("key", "about_text").maybeSingle(),
  ]);
  return {
    services: (services ?? []) as Service[],
    aboutText:
      (aboutSetting?.value as string | undefined) ??
      "En DBS Esculpidas creemos que cuidarte es un acto de amor propio.",
  };
}

export default async function HomePage() {
  const { services, aboutText } = await getData();
  const galleryImages = Array.from({ length: 11 }, (_, i) => `/images/nail-${i + 2}.jpg`);

  return (
    <>
      <Nav />

      {/* Video fijo detrás de toda la página — scrubea con el scroll completo */}
      <ScrollVideo />

      {/*
        main: position relative + z-index 1 → crea stacking context por encima del video.
        Las secciones transparentes muestran el video; las opacas lo tapan.
      */}
      <main className="relative" style={{ zIndex: 1 }}>

        {/* ── HERO ── Transparente: el video se ve debajo ─────────────── */}
        <section className="relative min-h-screen flex items-end overflow-hidden">
          {/* Gradient: aclara arriba (video visible) → oscurece abajo (texto legible) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/55 to-black/88 pointer-events-none" />
          <div className="container-page relative z-10 px-6 md:px-12 pb-20 pt-32 md:pb-32 text-white">
            <p className="eyebrow text-[var(--color-rose)] mb-6">
              Estudio de uñas · Ituzaingó
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-4xl font-medium mb-8">
              Resaltando tu belleza
              <br />
              <em className="not-italic" style={{ color: "var(--color-rose)" }}>
                de pies a cabeza.
              </em>
            </h1>
            <p className="text-base md:text-lg max-w-xl text-white/80 mb-10 leading-relaxed">
              Un espacio íntimo donde la higiene, los detalles y el tiempo
              dedicado a vos no se negocian. Reservá tu turno online en menos
              de un minuto.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/turnos"
                className="btn-primary"
                style={{ background: "var(--color-rose)" }}
              >
                Reservar turno <ArrowRight size={16} />
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ borderColor: "white", color: "white" }}
              >
                Consultar
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[0.25em] font-sans">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>
        </section>

        {/* ── SERVICIOS ── Fondo sólido: tapa el video al scrollear ────── */}
        <ServicesAnimated services={services} />

        {/* ── SOBRE NOSOTROS ── ─────────────────────────────────────────── */}
        <section id="sobre-nosotros" className="section bg-[var(--color-rose-mist)]">
          <div className="container-page grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image
                src="/images/nail-1.jpg"
                alt="Local DBS Esculpidas"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div>
              <p className="eyebrow mb-4">Sobre nosotros</p>
              <h2 className="font-display text-4xl md:text-5xl leading-tight font-medium mb-8">
                Un ritual de cuidado, no un trámite.
              </h2>
              <p className="text-base md:text-lg text-[var(--color-ink-soft)] leading-relaxed mb-10">
                {aboutText}
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { icon: Shield, title: "Higiene", desc: "Esterilización por turno y materiales descartables." },
                  { icon: Sparkles, title: "Calidad", desc: "Productos premium de marcas profesionales." },
                  { icon: Heart, title: "Trato", desc: "Tu tiempo y tus manos importan." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title}>
                    <Icon size={24} className="mb-3" style={{ color: "var(--color-rose-deep)" }} />
                    <h3 className="font-medium mb-2">{title}</h3>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── GALERÍA ── ────────────────────────────────────────────────── */}
        <GalleryAnimated images={galleryImages} />

        {/* ── CTA CON CALENDARIO ── ─────────────────────────────────────── */}
        <BookingCTA />

        {/* ── MAPA ── ───────────────────────────────────────────────────── */}
        <section className="bg-[var(--color-ink)] py-20 md:py-28">
          <div className="container-page">
            <div className="mb-10">
              <p className="eyebrow text-[var(--color-rose)] mb-4">Dónde encontrarnos</p>
              <h2 className="font-display text-4xl md:text-5xl text-white font-medium leading-tight">
                Brandsen 2326,<br />Ituzaingó.
              </h2>
              <div className="mt-6 w-12 h-px bg-[var(--color-rose)]" />
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: "420px" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3279.2091!2d-58.6901802!3d-34.6410912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcbf2ed84824c5%3A0x4f11f9bd472534e!2sDBS%20Esculpidas!5e0!3m2!1ses!2sar!4v1715000000000!5m2!1ses!2sar"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="DBS Esculpidas — Ubicación en Ituzaingó"
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
