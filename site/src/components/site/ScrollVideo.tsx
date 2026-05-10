"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollVideo — fondo de video fijo que avanza frame a frame con el scroll.
 * Cubre toda la página detrás del contenido (z-index: 0).
 * Las secciones con fondo sólido lo tapan naturalmente al scrollear.
 */
export function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respeta prefers-reduced-motion: solo muestra el primer frame
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.currentTime = 0;
      return;
    }

    let st: ReturnType<typeof ScrollTrigger.create> | undefined;

    const init = () => {
      video.pause();
      // Trigger en todo el documento — el video avanza con el scroll completo de la página
      st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          if (video.duration) {
            video.currentTime = self.progress * video.duration;
          }
        },
      });
    };

    if (video.readyState >= 1) {
      init();
    } else {
      video.addEventListener("loadedmetadata", init, { once: true });
    }

    return () => st?.kill();
  }, []);

  return (
    <video
      ref={videoRef}
      src="/videos/back_animation.mp4"
      className="fixed inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 0, willChange: "transform" }}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
