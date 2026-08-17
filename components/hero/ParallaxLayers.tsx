"use client";

import { useEffect, useRef } from "react";
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

      // Mouse-based parallax
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const moveX = (clientX - centerX) * 0.01;
        const moveY = (clientY - centerY) * 0.01;

        if (layer1Ref.current)
          gsap.to(layer1Ref.current, {
            x: moveX * 20,
            y: moveY * 20,
            duration: 0.5,
            overwrite: "auto",
          });
        if (layer2Ref.current)
          gsap.to(layer2Ref.current, {
            x: moveX * 12,
            y: moveY * 12,
            duration: 0.5,
            overwrite: "auto",
          });
        if (layer3Ref.current)
          gsap.to(layer3Ref.current, {
            x: moveX * 6,
            y: moveY * 6,
            duration: 0.5,
            overwrite: "auto",
          });
      };

      window.addEventListener("mousemove", handleMouseMove);

      // Scroll-based parallax
      gsap.from(layer1Ref.current, {
        y: -80,
        opacity: 0,
        duration: 1.2,
        ease: "power2.out",
      });

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
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
