"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { InstagramIcon } from "./InstagramIcon";

const links = [
  { href: "#servicios", label: "Servicios" },
  { href: "#galeria", label: "Galería" },
  { href: "#turnos", label: "Turnos" },
  { href: "#contacto", label: "Contacto" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(98%_0.008_60/0.95)] backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav
        className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16 md:h-20"
        aria-label="Navegación principal"
      >
        <a href="#inicio" className="flex items-center gap-2 cursor-pointer" onClick={close}>
          <Logo className="w-10 h-10 md:w-12 md:h-12" />
          <span className="font-heading font-semibold text-[oklch(14%_0.015_345)] text-lg hidden sm:block">
            DBS Esculpidas
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-[oklch(42%_0.025_345)] hover:text-[oklch(48%_0.17_345)] transition-colors duration-200 cursor-pointer"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="https://www.instagram.com/dbstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[oklch(48%_0.17_345)] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[oklch(42%_0.17_345)] transition-colors duration-200 cursor-pointer"
            >
              Instagram
            </a>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-[oklch(95%_0.03_345)] transition-colors duration-200 cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? (
            <X className="w-5 h-5 text-[oklch(14%_0.015_345)]" />
          ) : (
            <Menu className="w-5 h-5 text-[oklch(14%_0.015_345)]" />
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-[oklch(98%_0.008_60)] border-t border-[oklch(90%_0.06_345)] px-6 pb-6 pt-4">
          <ul className="flex flex-col gap-4" role="list">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={close}
                  className="block text-base font-medium text-[oklch(42%_0.025_345)] hover:text-[oklch(48%_0.17_345)] transition-colors duration-200 py-1 cursor-pointer"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="https://www.instagram.com/dbstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-[oklch(48%_0.17_345)] text-white text-base font-medium px-5 py-3 rounded-full hover:bg-[oklch(42%_0.17_345)] transition-colors duration-200 cursor-pointer"
              >
                Seguinos en Instagram
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
