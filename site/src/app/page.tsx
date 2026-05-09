import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Heart, Shield, MapPin, Clock, MessageCircle } from "lucide-react";
import { Instagram } from "@/components/icons/Instagram";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { HeroAnimated } from "@/components/site/HeroAnimated";
import { ServicesAnimated } from "@/components/site/ServicesAnimated";
import { GalleryAnimated } from "@/components/site/GalleryAnimated";
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


export default async function HomePage() {
  const { services, aboutText } = await getData();
  const galleryImages = Array.from({ length: 11 }, (_, i) => `/images/nail-${i + 2}.jpg`);

  return (
    <>
      <Nav />
      <main>
        {/* HERO CON ANIMACIONES GSAP */}
        <HeroAnimated
          backgroundImage="/images/nail-2.jpg"
          tagline="Estudio de uñas · Ituzaingó"
          title="Resaltando tu belleza"
          titleHighlight="de pies a cabeza."
          description="Un espacio íntimo donde la higiene, los detalles y el tiempo dedicado a vos no se negocian. Reservá tu turno online en menos de un minuto."
          buttonText="Reservar turno"
          buttonLink="/turnos"
          secondaryButtonText="Consultar"
          secondaryButtonLink={whatsappLink()}
          whatsappLink={whatsappLink()}
        />

        {/* SERVICIOS CON ANIMACIONES SCROLL */}
        <ServicesAnimated services={services} />

        {/* SOBRE NOSOTROS */}
        <section id="sobre-nosotros" className="section bg-[var(--color-rose-mist)]">
          <div className="container-page grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image src="/images/nail-1.jpg" alt="Local DBS Esculpidas" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
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

        {/* GALERIA CON ANIMACIONES */}
        <GalleryAnimated images={galleryImages} />

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
