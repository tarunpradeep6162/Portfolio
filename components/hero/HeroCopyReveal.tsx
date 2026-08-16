"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { motion as motionTokens } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * The hero's single strong entrance moment (spec §6): name, positioning
 * line, and CTAs reveal in sequence over 700-1200ms, then the visitor can
 * interact immediately. Reduced-motion jumps straight to the end state -
 * no partial animation, no delay.
 */
export function HeroCopyReveal({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      if (!scope.current) return;
      const items = scope.current.querySelectorAll("[data-reveal]");

      if (reducedMotion) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(items, { opacity: 0, y: 16, filter: "blur(4px)" });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: motionTokens.heroEntranceMs / 1000,
        ease: motionTokens.ease.gsapSpine,
        stagger: motionTokens.stagger.hero,
      });
    },
    { scope, dependencies: [reducedMotion] },
  );

  return <div ref={scope}>{children}</div>;
}
