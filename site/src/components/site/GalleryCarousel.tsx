"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 3500;
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

  // Máximo índice posible: nunca mostrar slots vacíos al final
  const maxIndex = Math.max(0, total - visibleSlides);

  const goTo = useCallback(
    (idx: number) => {
      // Wrap circular, pero clampeado a maxIndex
      const wrapped = ((idx % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
      setCurrent(wrapped);
    },
    [maxIndex]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Si cambia visibleSlides y el current queda fuera de rango, lo corregimos
  useEffect(() => {
    setCurrent((c) => Math.min(c, maxIndex));
  }, [maxIndex]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resetTimer]);

  const nav = useCallback((fn: () => void) => { fn(); resetTimer(); }, [resetTimer]);

  // Swipe / drag
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = dragStart.current - e.clientX;
    if (Math.abs(delta) > 40) nav(delta > 0 ? next : prev);
    dragStart.current = null;
  }, [nav, next, prev]);

  const slideWidth = `${100 / visibleSlides}%`;
  const offset = `calc(-${current} * ${slideWidth})`;

  // Dots: uno por cada posición válida (maxIndex + 1)
  const dotCount = maxIndex + 1;

  return (
    <div className="relative select-none">
      {/* Track */}
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
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
        disabled={current === 0}
        aria-label="Anterior"
        className="absolute left-0 top-[calc(50%-20px)] -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-[var(--color-line)] flex items-center justify-center hover:bg-[var(--color-rose-soft)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Botón siguiente */}
      <button
        onClick={() => nav(next)}
        disabled={current === maxIndex}
        aria-label="Siguiente"
        className="absolute right-0 top-[calc(50%-20px)] translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-[var(--color-line)] flex items-center justify-center hover:bg-[var(--color-rose-soft)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots — uno por posición, no por imagen */}
      <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Posiciones del carrusel">
        {Array.from({ length: dotCount }).map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Posición ${i + 1}`}
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
