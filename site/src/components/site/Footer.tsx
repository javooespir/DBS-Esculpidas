import Link from "next/link";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import { Instagram } from "@/components/icons/Instagram";
import { BUSINESS, instagramLink, whatsappLink } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] text-white">
      <div className="container-page section">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-3xl mb-4">{BUSINESS.name}</h3>
            <p className="text-sm text-white/70 leading-relaxed max-w-sm">
              {BUSINESS.tagline}. Estudio de uñas en Ituzaingó.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Visitanos</h4>
            <p className="flex items-start gap-2 text-sm mb-3">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span>{BUSINESS.address}</span>
            </p>
            <p className="flex items-start gap-2 text-sm mb-3">
              <Mail size={16} className="mt-0.5 flex-shrink-0" />
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-[var(--color-rose)] break-all">{BUSINESS.email}</a>
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Seguinos</h4>
            <div className="flex flex-col gap-3">
              <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-[var(--color-rose)]">
                <Instagram size={16} /> @{BUSINESS.instagram}
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-[var(--color-rose)]">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
            <Link href="/turnos" className="btn-primary mt-6" style={{ background: "var(--color-rose)" }}>
              Reservar turno
            </Link>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. Todos los derechos reservados.</p>
          <p>Sitio diseñado y desarrollado a medida.</p>
        </div>
      </div>
    </footer>
  );
}
