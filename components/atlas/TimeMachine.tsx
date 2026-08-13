"use client";

import { useId, useState } from "react";
import { spineStages } from "@/content/spine";
import type { SpineStageId } from "@/content/types";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { cn } from "@/lib/cn";

/**
 * The Architecture Time Machine: lets a visitor scrub through a project's
 * REAL delivery stages, in the Reliability Spine's canonical order, using
 * only the stages that project's own `spineStages` array actually contains
 * (3 for Jenkins, 3 for Node.js Auth, 4 for the other two) - never padded
 * to a fixed sequence with placeholder stages. Labels/descriptions come
 * verbatim from content/spine.ts, the same vocabulary RC-01 and the home
 * page's Reliability Spine already use - no second stage-naming system.
 *
 * Entirely server-renderable 2D/DOM, like AtlasDiagram - no 3D/Canvas
 * involved, so there is no WebGL fallback or intent-gating to build here;
 * the only motion-sensitive behavior is the current-stage indicator's CSS
 * transition, which reduced motion disables outright (an instant swap,
 * still the same real content - "static fallback" for this component
 * means no animated slide/highlight, not reduced functionality).
 */
export function TimeMachine({
  spineStageIds,
  projectLabel,
}: {
  spineStageIds: SpineStageId[];
  projectLabel: string;
}) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const headingId = useId();

  const stages = spineStageIds
    .map((id) => spineStages.find((s) => s.id === id))
    .filter((s): s is (typeof spineStages)[number] => s !== undefined);

  if (stages.length === 0) return null;

  const active = stages[activeIndex];

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(stages.length - 1, index)));
  };

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p
        id={headingId}
        className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]"
      >
        Architecture Time Machine
      </p>

      <div
        role="group"
        aria-labelledby={headingId}
        className="mt-4"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(activeIndex + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(activeIndex - 1);
          }
        }}
      >
        <ol className="flex flex-wrap gap-2">
          {stages.map((stage, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${stage.label}, stage ${index + 1} of ${stages.length}`}
                  className={cn(
                    "rounded border px-3 py-1.5 font-mono text-[11px] tracking-[0.04em]",
                    !reducedMotion && "transition-colors",
                    isActive
                      ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                      : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]",
                  )}
                >
                  {stage.label}
                </button>
              </li>
            );
          })}
        </ol>

        <div
          role="status"
          className="mt-4 border border-[var(--color-signal-lime)]/30 bg-[var(--color-signal-lime)]/5 px-4 py-3"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink)]">
            Stage {activeIndex + 1} of {stages.length}: {active.label}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[var(--ink-muted)]">{active.description}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label={`Previous stage in ${projectLabel}'s timeline`}
            className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--ink-muted)]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === stages.length - 1}
            aria-label={`Next stage in ${projectLabel}'s timeline`}
            className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--ink-muted)]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
