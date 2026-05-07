import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Shield, MapPin, Clock, MessageCircle } from "lucide-react";
import { Instagram } from "@/components/icons/Instagram";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { GalleryCarousel } from "@/components/site/GalleryCarousel";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BUSINESS, instagramLink, whatsappLink } from "@/lib/constants";
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

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export default async function HomePage() {
  const { services, aboutText } = await getData();
  const galleryImages = Array.from({ length: 11 }, (_, i) => `/images/nail-${i + 2}.jpg`);

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="relative min-h-[100dvh] flex items-end overflow-hidden bg-[var(--color-ink)]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/nail-2.jpg"
              alt=""
              fill
              priority
              className="object-cover opacity-60"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          </div>
          <div className="container-page relative z-10 px-6 md:px-12 pb-20 pt-32 md:pb-32 text-white">
            <p className="eyebrow text-[var(--color-rose)] mb-6">Estudio de uñas · Ituzaingó</p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-4xl mb-8 font-medium">
              Resaltando tu belleza<br />
              <em className="not-italic" style={{ color: "var(--color-rose)" }}>de pies a cabeza.</em>
            </h1>
            <p className="text-base md:text-lg max-w-xl text-white/80 mb-10 leading-relaxed">
              Un espacio íntimo donde la higiene, los detalles y el tiempo dedicado a vos no se negocian. Reservá tu turno online en menos de un minuto.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/turnos" className="btn-primary" style={{ background: "var(--color-rose)" }}>
                Reservar turno <ArrowRight size={16} />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ borderColor: "white", color: "white" }}>
                Consultar
              </a>
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="section bg-[var(--color-bg)]">
          <div className="container-page">
            <div className="max-w-2xl mb-16">
              <p className="eyebrow mb-4">Servicios</p>
              <h2 className="font-display text-4xl md:text-6xl leading-tight font-medium">
                Cada técnica, pensada para vos.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s) => (
                <article key={s.id} className="card hover:border-[var(--color-rose)] transition-colors group flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-display text-2xl leading-tight pr-4">{s.name}</h3>
                    <span className="text-xs uppercase tracking-wider text-[var(--color-rose-deep)] whitespace-nowrap">
                      {fmtDuration(s.duration_minutes)}
                    </span>
                  </div>
                  {s.description && <p className="text-sm text-[var(--color-muted)] mb-6 leading-relaxed">{s.description}</p>}
                  <div className="mt-auto">
                    <p className="font-display text-3xl mb-1">{fmtMoney(s.price_ars)}</p>
                    <p className="text-xs text-[var(--color-muted)] mb-5">Seña: {fmtMoney(s.deposit_ars)}</p>
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
              <Sparkles size={16} style={{ color: "var(--color-rose-deep)" }} className="flex-shrink-0" />
              <p className="text-sm font-medium" style={{ color: "var(--color-rose-deep)" }}>
                Mantenimientos disponibles cada 15 a 21 días para todos los servicios
              </p>
            </div>
          </div>
        </section>

        {/* SOBRE NOSOTROS */}
        <section id="sobre-nosotros" className="section bg-[var(--color-rose-mist)]">
          <div className="container-page grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image src="/images/nail-5.jpg" alt="Estudio DBS Esculpidas" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
            </div>
            <div>
              <p className="eyebrow mb-4">Sobre nosotros</p>
              <h2 className="font-display text-4xl md:text-5xl leading-tight font-medium mb-8">
                Un ritual de cuidado, no un trámite.
              </h2>
              <p className="text-base md:text-lg text-[var(--color-ink-soft)] leading-relaxed mb-10">{aboutText}</p>
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

        {/* GALERIA */}
        <section id="galeria" className="section bg-[var(--color-bg)]">
          <div className="container-page">
            <div className="max-w-2xl mb-16">
              <p className="eyebrow mb-4">Galería</p>
              <h2 className="font-display text-4xl md:text-6xl leading-tight font-medium">Trabajos reales.</h2>
            </div>
            <GalleryCarousel images={galleryImages} />
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="section bg-[var(--color-rose-soft)]">
          <div className="container-page text-center max-w-3xl mx-auto">
            <h2 className="font-display text-5xl md:text-7xl leading-tight font-medium mb-8">
              Tu próximo turno te espera.
            </h2>
            <p className="text-base md:text-lg text-[var(--color-ink-soft)] mb-10 max-w-xl mx-auto leading-relaxed">
              Elegí servicio, día y horario. La seña confirma tu reserva.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/turnos" className="btn-primary">Reservar turno <ArrowRight size={16} /></Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <Instagram size={16} /> Instagram
              </a>
            </div>
            <div className="mt-16 grid sm:grid-cols-2 gap-6 text-sm text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <MapPin size={20} style={{ color: "var(--color-rose-deep)" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{BUSINESS.address}</p>
                  <p className="text-[var(--color-muted)]">Ituzaingó, Buenos Aires</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} style={{ color: "var(--color-rose-deep)" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Lun a Vie 9 a 18</p>
                  <p className="text-[var(--color-muted)]">Sábados 9 a 14</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
