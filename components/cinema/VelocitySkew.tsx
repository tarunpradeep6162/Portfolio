"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Scroll-velocity skew (Phase 7): big headings lean very slightly into
 * fast scrolls and settle back, like type on a moving camera.
 *
 * Performance notes (this used to cost ~500 ms of main thread on load):
 * - it only runs while the page is actually moving - the ticker is removed
 *   as soon as the skew settles, so an idle page does zero work;
 * - velocity comes from Lenis (no scrollY read, so no forced layout);
 * - the variable is written to the handful of `.kinetic-skew` headings,
 *   never to <html>, which would restyle the entire document every frame.
 */
export function VelocitySkew() {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return;
    let targets: HTMLElement[] = [];
    let current = 0;
    let target = 0;
    let running = false;
    let written = "";

    const write = (value: string) => {
      if (value === written) return;
      written = value;
      for (const el of targets) el.style.setProperty("--scroll-skew", value);
    };
    const tick = () => {
      target *= 0.85;
      current += (target - current) * 0.14;
      if (Math.abs(current) < 0.01 && Math.abs(target) < 0.01) {
        current = target = 0;
        write("0deg");
        gsap.ticker.remove(tick);
        running = false;
        return;
      }
      write(`${current.toFixed(2)}deg`);
    };
    const onVelocity = (velocity: number) => {
      target = Math.max(-3, Math.min(3, velocity * 0.12));
      if (running || Math.abs(target) < 0.05) return;
      targets = Array.from(document.querySelectorAll<HTMLElement>(".kinetic-skew"));
      running = true;
      gsap.ticker.add(tick);
    };

    let lastY = window.scrollY;
    const onNativeScroll = () => {
      const y = window.scrollY;
      onVelocity((y - lastY) * 0.5);
      lastY = y;
    };
    const lenis = window.__lenis;
    const onLenis = (l: { velocity: number }) => onVelocity(l.velocity);
    if (lenis) lenis.on("scroll", onLenis);
    else window.addEventListener("scroll", onNativeScroll, { passive: true });

    return () => {
      gsap.ticker.remove(tick);
      if (lenis) lenis.off("scroll", onLenis);
      else window.removeEventListener("scroll", onNativeScroll);
      for (const el of targets) el.style.removeProperty("--scroll-skew");
    };
  }, [reducedMotion]);
  return null;
}
