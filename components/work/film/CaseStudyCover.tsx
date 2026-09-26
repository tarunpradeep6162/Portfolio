"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { takeFlip } from "@/lib/cinema/flip";

/**
 * The case study's opening cover shot (Phases 11 + 16).
 * - Arriving from a project card, the cover grows out of the card's exact
 *   rectangle into place (shared-element morph).
 * - Otherwise it opens with a slow push-in out of a blur.
 * - Then, scrubbed to scroll, the camera keeps pushing in and tilts away
 *   as the visitor reads on - a dolly past the "title shot".
 */
export function CaseStudyCover({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      const art = inner.current;
      if (!el || !art || reducedMotion) return;
      const flip = takeFlip(pathname);
      const last = el.getBoundingClientRect();
      if (flip && last.width > 0) {
        const dx = flip.rect.left - last.left;
        const dy = flip.rect.top - last.top;
        const sx = flip.rect.width / last.width;
        const sy = flip.rect.height / last.height;
        gsap.fromTo(
          el,
          { x: dx, y: dy, scaleX: sx, scaleY: sy, transformOrigin: "0 0", zIndex: 30 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.9, ease: "cinema.cut", clearProps: "transform,zIndex" },
        );
      } else {
        gsap.fromTo(
          art,
          { scale: 1.18, filter: "blur(12px)", opacity: 0 },
          { scale: 1, filter: "blur(0px)", opacity: 1, duration: 1.6, ease: "cinema.push", clearProps: "filter" },
        );
      }
      gsap.to(art, {
        scale: 1.1,
        rotateX: 6,
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 20%", end: "bottom top", scrub: 0.6 },
      });
    },
    { scope: ref, dependencies: [reducedMotion, pathname] },
  );

  return (
    <div ref={ref} className="relative overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.35)] [perspective:1200px]">
      <div ref={inner} className="origin-center will-change-transform">
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(3,5,7,0.55))]" />
    </div>
  );
}
