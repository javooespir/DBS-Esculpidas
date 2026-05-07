"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 3500;
// Slides visibles según breakpoint (se mantiene sincronizado con CSS)
const VISIBLE = { base: 2, sm: 3, lg: 4 };

function useVisibleSlides() {
  const [visible, setVisible] = useState(VISIBLE.base);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setVisible(VISIBLE.lg);
      else if (window.innerWidth >= 640) setVisible(VISIBLE.sm);
      else setVisible(VISIBLE.base);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return visible;
}

export function GalleryCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  const dragStart = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSlides = useVisibleSlides();
  const total = images.length;

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % total) + total) % total),
    [total]
  );
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetTimer]);

  const nav = (fn: () => void) => { fn(); resetTimer(); };

  // Swipe / drag
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = dragStart.current - e.clientX;
    if (Math.abs(delta) > 40) nav(delta > 0 ? next : prev);
    dragStart.current = null;
  };

  const slideWidth = `${100 / visibleSlides}%`;
  const offset = `calc(-${current} * ${slideWidth})`;

  return (
    <div className="relative select-none">
      {/* Overflow wrapper */}
      <div
        className="overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="flex transition-transform duration-500"
          style={{
            transform: `translateX(${offset})`,
            transitionTimingFunction: "cubic-bezier(0.25,1,0.5,1)",
          }}
        >
          {images.map((src, i) => (
            <div
              key={src}
              className="flex-shrink-0 px-1.5"
              style={{ width: slideWidth }}
            >
              <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
                <Image
                  src={src}
                  alt={`Trabajo de uñas ${i + 1}`}
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón anterior */}
      <button
        onClick={() => nav(prev)}
        aria-label="Anterior"
        className="absolute left-0 top-[calc(50%-20px)] -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-[var(--color-line)] flex items-center justify-center hover:bg-[var(--color-rose-soft)] transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Botón siguiente */}
      <button
        onClick={() => nav(next)}
        aria-label="Siguiente"
        className="absolute right-0 top-[calc(50%-20px)] translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-[var(--color-line)] flex items-center justify-center hover:bg-[var(--color-rose-soft)] transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Imágenes de galería">
        {images.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Imagen ${i + 1}`}
            onClick={() => nav(() => goTo(i))}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-[var(--color-rose-deep)]"
                : "w-2 h-2 bg-[var(--color-line)] hover:bg-[var(--color-rose)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
