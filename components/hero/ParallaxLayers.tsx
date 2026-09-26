"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";

export function ParallaxLayers() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      // Mouse-based parallax. quickTo reuses one tween per axis (the old
      // handler created three new tweens on *every* mousemove, site-wide),
      // and the listener only runs while the hero is on screen.
      const layers = [
        [layer1Ref.current, 20],
        [layer2Ref.current, 12],
        [layer3Ref.current, 6],
      ] as const;
      const setters = layers
        .filter(([el]) => el)
        .map(([el, depth]) => ({
          depth,
          x: gsap.quickTo(el, "x", { duration: 0.5, ease: "cinema.settle" }),
          y: gsap.quickTo(el, "y", { duration: 0.5, ease: "cinema.settle" }),
        }));
      let inView = true;
      const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
      observer.observe(containerRef.current);
      const handleMouseMove = (e: MouseEvent) => {
        if (!inView) return;
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        for (const s of setters) {
          s.x(moveX * s.depth);
          s.y(moveY * s.depth);
        }
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // Scroll-based parallax
      gsap.from(layer1Ref.current, {
        y: -80,
        opacity: 0,
        duration: 1.2,
        ease: "cinema.push",
      });

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        observer.disconnect();
      };
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        ref={layer1Ref}
        className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(216,255,79,0.08),transparent_70%)]"
      />
      <div
        ref={layer2Ref}
        className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(116,140,255,0.06),transparent_70%)] blur-3xl"
      />
      <div
        ref={layer3Ref}
        className="absolute -left-40 bottom-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(216,255,79,0.04),transparent_70%)] blur-3xl"
      />
    </div>
  );
}
