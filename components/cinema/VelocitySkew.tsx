"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Scroll-velocity skew (Phase 7): big headings lean very slightly into
 * fast scrolls and settle back, like type on a moving camera. Writes one
 * CSS variable (--scroll-skew) per frame; `.kinetic-skew` elements use it.
 */
export function VelocitySkew() {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    const root = document.documentElement;
    let current = 0;
    let lastY = window.scrollY;
    const tick = () => {
      const y = window.scrollY;
      const v = y - lastY;
      lastY = y;
      const target = Math.max(-3, Math.min(3, v * 0.08));
      current += (target - current) * 0.12;
      if (Math.abs(current) < 0.005) current = 0;
      root.style.setProperty("--scroll-skew", `${current.toFixed(3)}deg`);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      root.style.removeProperty("--scroll-skew");
    };
  }, [reducedMotion]);
  return null;
}
