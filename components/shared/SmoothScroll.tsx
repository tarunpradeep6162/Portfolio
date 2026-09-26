"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Smooth scrolling that the rest of the motion system can trust:
 * - Lenis is driven by GSAP's ticker, and every Lenis scroll updates
 *   ScrollTrigger - so scrubbed, pinned and scroll-revealed animations stay
 *   frame-locked to the smoothed position instead of lagging behind it.
 * - Reduced-motion visitors get native scrolling (no inertia at all).
 * - In-page anchor links (#work, #spine...) route through Lenis so they
 *   glide with the same easing and respect the sticky header.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    registerGsap();

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href*='#']");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -72 });
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [reducedMotion]);

  return null;
}
