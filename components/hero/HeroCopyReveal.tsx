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

      // Timings are measured from page start (performance.now), not from
      // hydration: the CSS cold open starts at first paint, so on a slow
      // device JS may arrive *after* it has already finished. The server
      // renders this copy visible - if we're late, leave it visible rather
      // than hiding it and making the visitor wait again (that left the
      // hero empty for seconds on slow phones).
      const booting = document.documentElement.dataset.boot === "play";
      const now = performance.now();
      const revealAt = booting ? BOOT_REVEAL_MS : 0;
      if (now > revealAt + 1200) return;
      gsap.set(items, { opacity: 0, y: 18 });
      const tween = gsap.to(items, {
        delay: Math.max(0, revealAt - now) / 1000,
        opacity: 1,
        y: 0,
        duration: motionTokens.heroEntranceMs / 1000,
        ease: motionTokens.ease.gsapSpine,
        stagger: motionTokens.stagger.hero,
      });
      // Skipping the cold open reveals the copy immediately.
      const skip = () => tween.delay(0).restart();
      if (booting) window.addEventListener(BOOT_END_EVENT, skip, { once: true });
      return () => window.removeEventListener(BOOT_END_EVENT, skip);
    },
    { scope, dependencies: [reducedMotion] },
  );

  return <div ref={scope}>{children}</div>;
}
