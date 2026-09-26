"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { emitCue } from "@/lib/cinema/cues";
import { hasFlipFor, rememberFlip } from "@/lib/cinema/flip";

// Module scope: survives route changes, resets on a full page load - so
// the very first render (owned by the cold open / hero reveal) never
// plays a route transition on top.
let hasNavigated = false;
let lastPath: string | null = null;
let flipListener = false;

/**
 * Wraps each page (via app/template.tsx, which remounts per navigation).
 *
 * v9 (Phase 16): a client-side route change is a *cut*: a black panel
 * with a lime leading edge wipes diagonally off the new page, the 3D stage
 * whips its camera (cue: "transition"), and the whoosh plays when sound is
 * on. Clicking a project card also records the card's cover rectangle so
 * the case study can morph its cover out of it (lib/cinema/flip).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animate] = useState(() => {
    const isNavigation = lastPath !== null && lastPath !== pathname;
    if (isNavigation) hasNavigated = true;
    return isNavigation && hasNavigated;
  });
  // A card-to-cover morph is its own transition; the wipe would hide it.
  const [morphing] = useState(() => animate && hasFlipFor(pathname));

  useEffect(() => {
    lastPath = pathname;
    if (animate) {
      emitCue({ type: "transition" });
      if (!window.location.hash) window.__lenis?.scrollTo(0, { immediate: true });
    }
  }, [animate, pathname]);

  useEffect(() => {
    if (flipListener) return;
    flipListener = true;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const card = (event.target as Element | null)?.closest?.("a.project-card");
      if (!(card instanceof HTMLAnchorElement)) return;
      const cover = card.querySelector("[data-flip-cover]");
      if (!cover) return;
      const r = cover.getBoundingClientRect();
      rememberFlip({ href: card.href, rect: { left: r.left, top: r.top, width: r.width, height: r.height }, at: Date.now() });
    };
    document.addEventListener("click", onClick, true);
  }, []);

  return (
    <>
      {animate && !morphing && (
        <div className="route-wipe" aria-hidden>
          <div className="route-wipe-panel" />
          <div className="route-wipe-edge" />
        </div>
      )}
      <div className={animate && !morphing ? "route-enter" : undefined}>{children}</div>
    </>
  );
}
