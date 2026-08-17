"use client";

import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { cn } from "@/lib/cn";
import type { VisitorPath } from "@/lib/v6/types";

const PATHS: { id: NonNullable<VisitorPath>; label: string; description: string }[] = [
  {
    id: "recruiter",
    label: "Recruiter",
    description: "Fast, outcome-first framing of each system.",
  },
  {
    id: "engineer",
    label: "Engineer",
    description: "Full implementation detail and real trade-offs.",
  },
  {
    id: "explorer",
    label: "Explorer",
    description: "A slower, guided walk through the same systems.",
  },
];

/**
 * Optional, never a wall: every project/Atlas/Time-Machine/Proof-Mode
 * surface already works completely with no path selected (this component
 * only ever narrows framing/pacing, never gates content). Persists to
 * localStorage only, via ExperienceProvider - no analytics, no network
 * request tied to selection. Reduced motion is handled at the point each
 * surface reads `motion`, not here - this component itself has no
 * animation to disable.
 */
export function VisitorPathSelector() {
  const { visitorPath } = useExperienceState();
  const dispatch = useExperienceDispatch();

  return (
    <div role="group" aria-label="Visitor path" className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        Read as
      </span>
      {PATHS.map((path) => {
        const active = visitorPath === path.id;
        return (
          <button
            key={path.id}
            type="button"
            title={path.description}
            aria-pressed={active}
            onClick={() =>
              dispatch({ type: "VISITOR_PATH_SET", path: active ? null : path.id })
            }
            className={cn(
              "rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
              active
                ? "border-[var(--color-gold-primary)] text-[var(--color-gold-primary)]"
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-gold-primary)] hover:text-[var(--color-gold-primary)]",
            )}
          >
            {path.label}
          </button>
        );
      })}
      {visitorPath && (
        <button
          type="button"
          onClick={() => dispatch({ type: "VISITOR_PATH_SET", path: null })}
          className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]"
        >
          Reset
        </button>
      )}
    </div>
  );
}
