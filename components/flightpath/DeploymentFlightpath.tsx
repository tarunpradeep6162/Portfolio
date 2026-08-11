"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { spineStages } from "@/content/spine";

/**
 * The Deployment Flightpath - the site's one signature scroll-responsive
 * moment (spec: "give the experience continuity... begin in the hero
 * topology, pass through selected work and resolve near the final contact
 * call to action"). Two lightweight treatments sharing one scroll-progress
 * source, no persistent WebGL canvas:
 *
 * - Desktop (lg+): a fixed rail in the left viewport gutter - guaranteed
 *   clear of the text column since Container carries a fixed 32px `lg:px-8`
 *   regardless of how much gutter max-w-7xl leaves beyond it. A dot travels
 *   the rail and the current Reliability Spine stage name (Commit..Recover)
 *   updates below it, so "recover" lands right as the contact section (the
 *   page's resolution) comes into view.
 * - Mobile/tablet (<lg): a slim reading-progress bar fixed under the
 *   header, the same progress value, no labels (avoids clutter at narrow
 *   width) - a well-understood pattern that never overlaps content because
 *   it lives in the header's own dead space.
 *
 * Ambient and decorative throughout (aria-hidden, pointer-events-none):
 * ties an already-in-flow visual to native scroll position via a plain
 * scroll/resize listener that recomputes progress fresh on every event
 * (deliberately not GSAP ScrollTrigger's cached start/end geometry - that
 * geometry is calculated once at trigger-creation time and next/font's
 * font-display:swap can reflow total page height after fonts finish
 * downloading, which left a first implementation permanently stuck at
 * progress 0). gsap.set still does the actual DOM writes (transform/opacity
 * caching). No pin, no forced scroll - not scroll-hijacking. Reduced motion
 * renders a static mid-progress state with no scroll listener at all.
 */
export function DeploymentFlightpath() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    if (reducedMotion) return;
    if (!dotRef.current || !labelRef.current || !barRef.current) return;

    function update() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? gsap.utils.clamp(0, 1, window.scrollY / scrollable) : 0;
      gsap.set(dotRef.current, { top: `${progress * 100}%` });
      gsap.set(barRef.current, { scaleX: progress });
      const stageIndex = Math.min(spineStages.length - 1, Math.floor(progress * spineStages.length));
      const label = spineStages[stageIndex].label;
      if (labelRef.current!.textContent !== label) labelRef.current!.textContent = label;
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, { dependencies: [reducedMotion] });

  const staticProgress = reducedMotion ? 0.5 : 0;
  const staticStageIndex = Math.min(
    spineStages.length - 1,
    Math.floor(staticProgress * spineStages.length),
  );

  return (
    <div aria-hidden className="pointer-events-none">
      {/* Desktop rail */}
      <div className="fixed left-2 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        <div className="relative h-[42vh] w-px bg-[var(--line)]">
          {spineStages.map((stage, i) => (
            <span
              key={stage.id}
              className="absolute left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ink-muted)]"
              style={{ top: `${(i / (spineStages.length - 1)) * 100}%` }}
            />
          ))}
          <div
            ref={dotRef}
            className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"
            style={{ top: `${staticProgress * 100}%` }}
          />
        </div>
        <span
          ref={labelRef}
          className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ink-muted)]"
        >
          {spineStages[staticStageIndex].label}
        </span>
      </div>

      {/* Mobile/tablet reading-progress bar */}
      <div className="fixed inset-x-0 top-16 z-30 h-px bg-[var(--line)] lg:hidden">
        <div
          ref={barRef}
          className="h-full origin-left bg-[var(--accent)]"
          style={{ transform: `scaleX(${staticProgress})` }}
        />
      </div>
    </div>
  );
}
