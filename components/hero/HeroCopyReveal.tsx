"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { motion as motionTokens } from "@/lib/motion/tokens";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { BOOT_END_EVENT, BOOT_REVEAL_MS } from "@/components/shared/BootSequence";

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

      // On a first visit the cold open owns the opening seconds; the copy
      // reveals as its letterbox parts (or the moment it is skipped).
      const booting = document.documentElement.dataset.boot === "play";
      gsap.set(items, { opacity: 0, y: 18 });
      const tween = gsap.to(items, {
        paused: booting,
        opacity: 1,
        y: 0,
        duration: motionTokens.heroEntranceMs / 1000,
        ease: motionTokens.ease.gsapSpine,
        stagger: motionTokens.stagger.hero,
      });
      if (booting) {
        const play = () => tween.play();
        window.addEventListener(BOOT_END_EVENT, play, { once: true });
        const fallback = window.setTimeout(play, BOOT_REVEAL_MS + 400);
        return () => {
          window.removeEventListener(BOOT_END_EVENT, play);
          window.clearTimeout(fallback);
        };
      }
    },
    { scope, dependencies: [reducedMotion] },
  );

  return <div ref={scope}>{children}</div>;
}
