"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HeroAnimatedProps {
  backgroundImage: string;
  tagline: string;
  title: string;
  titleHighlight: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  whatsappLink: string;
}

export function HeroAnimated({
  backgroundImage,
  tagline,
  title,
  titleHighlight,
  description,
  buttonText,
  buttonLink,
  secondaryButtonText,
  secondaryButtonLink,
  whatsappLink,
}: HeroAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Hero content fade-in animation
      gsap.from(".hero-tagline", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
      });

      gsap.from(".hero-title", {
        opacity: 0,
        y: 40,
        duration: 1,
        delay: 0.2,
        ease: "power2.out",
      });

      gsap.from(".hero-description", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.4,
        ease: "power2.out",
      });

      gsap.from(".hero-buttons", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out",
      });

      // Parallax effect on scroll
      gsap.to(".hero-bg-image", {
        opacity: 0.4,
        scale: 1.05,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          markers: false,
        },
      });

      // Hover animations for buttons
      gsap.utils.toArray<HTMLElement>(".btn-primary, .btn-secondary").forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        });

        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex items-end overflow-hidden bg-[var(--color-ink)]"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          className="hero-bg-image object-cover opacity-60"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
      </div>

      <div className="container-page relative z-10 px-6 md:px-12 pb-20 pt-32 md:pb-32 text-white">
        <p className="hero-tagline eyebrow text-[var(--color-rose)] mb-6">
          {tagline}
        </p>
        <h1 className="hero-title font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] max-w-4xl mb-8 font-medium">
          {title}
          <br />
          <em className="not-italic" style={{ color: "var(--color-rose)" }}>
            {titleHighlight}
          </em>
        </h1>
        <p className="hero-description text-base md:text-lg max-w-xl text-white/80 mb-10 leading-relaxed">
          {description}
        </p>
        <div className="hero-buttons flex flex-wrap gap-3">
          <Link href={buttonLink} className="btn-primary" style={{ background: "var(--color-rose)" }}>
            {buttonText} <ArrowRight size={16} />
          </Link>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ borderColor: "white", color: "white" }}
          >
            {secondaryButtonText}
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-buttons absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[10px] uppercase tracking-[0.25em] font-sans">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
