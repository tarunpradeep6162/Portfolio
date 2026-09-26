"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Pauses infinite CSS animations inside any `[data-anim-scope]` element
 * while it is off screen. Several of the site's ambient animations
 * (Observatory trace/pulses, cover-art flows, orbit rings) animate SVG
 * properties that repaint on the main thread every frame - worth nothing
 * when nobody can see them. Re-scans on every route change.
 */
export function OffscreenAnimationPauser() {
  const pathname = usePathname();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.offscreen = entry.isIntersecting ? "false" : "true";
        }
      },
      { rootMargin: "120px 0px" },
    );
    const scan = () => document.querySelectorAll("[data-anim-scope]").forEach((el) => observer.observe(el));
    scan();
    // Scopes rendered after hydration (lazy sections) are picked up too.
    const late = window.setTimeout(scan, 1500);
    return () => {
      window.clearTimeout(late);
      observer.disconnect();
    };
  }, [pathname]);
  return null;
}
