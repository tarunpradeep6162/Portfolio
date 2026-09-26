"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Module scope: survives route changes, resets on a full page load - so
// the very first render (owned by the boot sequence / hero reveal) never
// plays a route transition on top.
let hasNavigated = false;
let lastPath: string | null = null;

/**
 * Wraps each page (via app/template.tsx, which remounts per navigation):
 * after a client-side route change the new page rises in under a lime scan
 * line, and the smooth scroller is snapped to the top so it can't glide
 * from the previous page's position.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animate] = useState(() => {
    const isNavigation = lastPath !== null && lastPath !== pathname;
    if (isNavigation) hasNavigated = true;
    return isNavigation && hasNavigated;
  });

  useEffect(() => {
    lastPath = pathname;
    if (animate && !window.location.hash) window.__lenis?.scrollTo(0, { immediate: true });
  }, [animate, pathname]);

  return (
    <>
      {animate && <div className="route-scan" aria-hidden />}
      <div className={animate ? "route-enter" : undefined}>{children}</div>
    </>
  );
}
