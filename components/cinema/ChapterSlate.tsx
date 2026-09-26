"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { emitCue } from "@/lib/cinema/cues";

/**
 * Phase 12 - a chapter card between acts of the home page. A widescreen
 * (2.39:1-feeling) band: letterbox bars close in as it scrolls to centre,
 * the chapter number cuts in, the title resolves out of a blur, and the
 * slate cue fires once (a soft impact when sound is on). The band is a
 * window onto the 3D stage, so the dust drifts behind the title.
 */
export function ChapterSlate({ chapter, title, note }: { chapter: string; title: string; note?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root || reducedMotion) return;
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 75%",
          end: "center 45%",
          scrub: 0.8,
        },
      });
      tl.fromTo(q(".slate-bar"), { scaleY: 0 }, { scaleY: 1, ease: "cinema.cut", duration: 0.5 }, 0)
        .fromTo(q(".slate-chapter"), { opacity: 0, x: -24 }, { opacity: 1, x: 0, ease: "cinema.cut", duration: 0.35 }, 0.25)
        .fromTo(
          q(".slate-title"),
          { opacity: 0, filter: "blur(14px)", letterSpacing: "0.2em" },
          { opacity: 1, filter: "blur(0px)", letterSpacing: "-0.04em", ease: "cinema.push", duration: 0.7 },
          0.3,
        )
        .fromTo(q(".slate-rule"), { scaleX: 0 }, { scaleX: 1, ease: "cinema.reveal", duration: 0.6 }, 0.45);
      gsap.to({}, {
        scrollTrigger: {
          trigger: root,
          start: "top 55%",
          once: true,
          onEnter: () => emitCue({ type: "slate", label: title }),
        },
      });
    },
    { scope: ref, dependencies: [reducedMotion] },
  );

  return (
    <section
      ref={ref}
      aria-label={`${chapter}: ${title}`}
      className="cinema-window relative flex min-h-[46vh] items-center overflow-hidden bg-[var(--color-control-black)] py-20"
    >
      <div aria-hidden className="slate-bar absolute inset-x-0 top-0 h-[16%] origin-top bg-black" />
      <div aria-hidden className="slate-bar absolute inset-x-0 bottom-0 h-[16%] origin-bottom bg-black" />
      <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-10 xl:px-12">
        <p className="slate-chapter font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-signal-lime)]">
          {chapter}
        </p>
        <h2 className="slate-title mt-4 font-display text-[clamp(2.4rem,1.4rem+4.6vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--color-cloud-linen)]">
          {title}
        </h2>
        <div className="mt-6 flex items-center gap-4">
          <span aria-hidden className="slate-rule h-px w-24 origin-left bg-[var(--color-signal-lime)]" />
          {note && (
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-telemetry-steel)]">{note}</p>
          )}
        </div>
      </div>
    </section>
  );
}
