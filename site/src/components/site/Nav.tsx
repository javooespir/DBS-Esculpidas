"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BUSINESS, instagramLink, whatsappLink } from "@/lib/constants";

export function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Easter egg: 5 clicks rápidos en el logo → /admin
  const clicksRef = useRef<number[]>([]);
  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    clicksRef.current = [...clicksRef.current.filter((t) => now - t < 2000), now];
    if (clicksRef.current.length >= 5) {
      e.preventDefault();
      clicksRef.current = [];
      router.push("/admin/login");
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#servicios", label: "Servicios" },
    { href: "/#galeria", label: "Galería" },
    { href: "/#sobre-nosotros", label: "Sobre nosotros" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-[var(--color-line)]" : "bg-transparent"
      }`}
    >
      <div className="container-page flex items-center justify-between px-6 md:px-12 h-16 md:h-20">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 group"
          aria-label={BUSINESS.name}
        >
          <span className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden ring-1 ring-[var(--color-line)] transition-transform group-hover:scale-105 ${scrolled ? "" : "shadow-md"}`}>
            <Image src="/images/logo.png" alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span
            className={`font-display text-xl md:text-2xl tracking-tight transition-colors ${scrolled ? "" : "drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)]"}`}
            style={{ color: scrolled ? "var(--color-ink)" : "white" }}
          >
            {BUSINESS.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm tracking-wide hover:text-[var(--color-rose-deep)] transition-colors ${scrolled ? "" : "text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-ghost ${scrolled ? "" : "text-white/90"}`}
            aria-label="Instagram"
          >
            Instagram
          </a>
          <Link href="/turnos" className="btn-primary">Reservar turno</Link>
        </div>

        <button
          type="button"
          className={`lg:hidden p-2 -mr-2 ${scrolled ? "text-[var(--color-ink)]" : "text-white drop-shadow"}`}
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-line)]">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <span className="relative w-9 h-9 rounded-full overflow-hidden">
                <Image src="/images/logo.png" alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="font-display text-xl">{BUSINESS.name}</span>
            </Link>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="p-2 -mr-2">
              <X size={24} />
            </button>
          </div>
          <nav className="flex-1 flex flex-col gap-2 p-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-3xl py-3 border-b border-[var(--color-line)]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Link href="/turnos" onClick={() => setOpen(false)} className="btn-primary w-full">
                Reservar turno
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
                WhatsApp
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
