"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { motion as motionTokens } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Choreographed entrance for a group of [data-reveal] items as they scroll
 * into view (spec §14: "project reveals" as part of the choreographed
 * motion pass). Fires once per element - no scrub, no re-trigger on
 * scroll-back - restrained rather than a scroll-linked showpiece.
 * Reduced-motion jumps straight to the end state, same as HeroCopyReveal.
 */
export function ScrollReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (!scope.current) return;
      const items = scope.current.querySelectorAll("[data-reveal]");
      if (items.length === 0) return;

      if (reducedMotion) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(items, { opacity: 0, y: 24 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: motionTokens.sectionRevealMs / 1000,
        ease: motionTokens.ease.gsapSpine,
        stagger: motionTokens.stagger.section,
        scrollTrigger: {
          trigger: scope.current,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope, dependencies: [reducedMotion] },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
