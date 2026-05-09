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
      // Title animations
      gsap.from(".gallery-eyebrow, .gallery-title", {
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

      // Carousel container animation
      gsap.from(".gallery-carousel-container", {
        opacity: 0,
        scale: 0.95,
        y: 40,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          once: true,
        },
      });

      // Parallax effect on carousel images
      gsap.to(".gallery-carousel-container", {
        y: -30,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: 1,
          markers: false,
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
        <div className="gallery-carousel-container opacity-0">
          <GalleryCarousel images={images} />
        </div>
      </div>
    </section>
  );
}
