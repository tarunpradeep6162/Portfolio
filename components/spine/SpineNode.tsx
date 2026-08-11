"use client";

import { useId, useState } from "react";
import type { SpineStage } from "@/content/types";
import { cn } from "@/lib/cn";

/**
 * A single spine stage. Reveals its description on focus or click - never
 * hover-only (spec §14 a11y requirement) - so keyboard and touch users get
 * the same information as mouse users.
 *
 * Uses useId() for the description's id rather than a static
 * `spine-desc-${stage.id}` string: ReliabilitySpine renders twice on the
 * home page (hero fallback + mid-page walkthrough), and a static id would
 * duplicate across both instances - invalid HTML, and an ambiguous target
 * for aria-controls / assistive tech.
 */
export function SpineNode({ stage, active }: { stage: SpineStage; active?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        data-spine-node
        aria-expanded={expanded}
        aria-controls={descriptionId}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border font-mono text-xs transition-colors",
          active
            ? "border-[var(--accent)] text-[var(--accent)]"
            : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)]",
        )}
      >
        {stage.label.slice(0, 2)}
      </button>
      <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
        {stage.label}
      </span>
      <p
        id={descriptionId}
        className={cn(
          "max-w-[14ch] text-[11px] leading-snug text-[var(--ink-muted)] transition-[max-height,opacity] duration-200 ease-[var(--ease-spine)]",
          expanded ? "max-h-20 opacity-100" : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        {stage.description}
      </p>
    </div>
  );
}
