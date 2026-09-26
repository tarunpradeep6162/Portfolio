"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * The hero's exit shot, scrubbed to scroll: as the visitor leaves the
 * opening frame, the name drifts up and dims while the Observatory pushes
 * toward the camera and rotates out - a dolly-and-pan feel that hands the
 * page over to "Selected systems" instead of a hard edge. Pure transforms
 * and opacity (compositor-only); reduced motion leaves everything static.
 */
export function HeroScrollScene({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root || reducedMotion) return;
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
      });
      tl.to(q("[data-scene='copy']"), { yPercent: -18, opacity: 0.15 }, 0)
        .to(q("[data-scene='orbit']"), { scale: 1.28, rotate: 14, yPercent: 10, opacity: 0 }, 0)
        .to(q("[data-scene='stats']"), { yPercent: 60, opacity: 0 }, 0);
    },
    { scope: ref, dependencies: [reducedMotion] },
  );

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
