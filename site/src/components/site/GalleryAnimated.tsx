"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { GalleryCarousel } from "./GalleryCarousel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface GalleryAnimatedProps {
  images: string[];
}

export function GalleryAnimated({ images }: GalleryAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const eyebrow = container.querySelector(".gallery-eyebrow");
      const title = container.querySelector(".gallery-title");
      const carousel = container.querySelector(".gallery-carousel-container");

      // Set initial state via JS (not CSS) — garantiza visibilidad si GSAP falla
      gsap.set([eyebrow, title], { opacity: 0, y: 30 });
      gsap.set(carousel, { opacity: 0, y: 20 });

      // Título fade-in al scroll
      gsap.to([eyebrow, title], {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          once: true,
        },
      });

      // Carousel fade-in al scroll
      gsap.to(carousel, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: "top 70%",
          once: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="galeria"
      className="section bg-[var(--color-bg)]"
    >
      <div className="container-page">
        <div className="max-w-2xl mb-16">
          <p className="gallery-eyebrow eyebrow mb-4">Galería</p>
          <h2 className="gallery-title font-display text-4xl md:text-6xl leading-tight font-medium">
            Trabajos reales.
          </h2>
        </div>
        <div className="gallery-carousel-container">
          <GalleryCarousel images={images} />
        </div>
      </div>
    </section>
  );
}
