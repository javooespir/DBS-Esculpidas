"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollVideo({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Respect prefers-reduced-motion: show first frame only
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.currentTime = 0;
      return;
    }

    let st: ReturnType<typeof ScrollTrigger.create> | undefined;

    const init = () => {
      video.pause();
      st = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
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
    <div ref={containerRef} style={{ height: "300vh" }} className="relative">
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ willChange: "transform" }}
      >
        <video
          ref={videoRef}
          src="/videos/back_animation.mp4"
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
        />
        {children && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
