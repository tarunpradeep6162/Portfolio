"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import type { SpineStage } from "@/content/types";
import { cn } from "@/lib/cn";

export function SpineNode({
  stage,
  index,
  active,
  proofCount,
}: {
  stage: SpineStage;
  index: number;
  active?: boolean;
  proofCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();

  return (
    <div className="group border-b border-[var(--line)]">
      <button
        type="button"
        data-spine-node
        aria-expanded={expanded}
        aria-controls={descriptionId}
        onFocus={() => setExpanded(true)}
        onBlur={() => setExpanded(false)}
        onClick={() => setExpanded((value) => !value)}
        className="grid w-full grid-cols-[3rem_1fr_auto] items-center gap-3 py-5 text-left sm:grid-cols-[4.5rem_1fr_auto] sm:py-6"
      >
        <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--ink-muted)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>
          <span
            className={cn(
              "block font-display text-xl font-semibold tracking-[-0.03em] transition-colors sm:text-2xl",
              active
                ? "text-[var(--accent)]"
                : "text-[var(--ink)] group-hover:text-[var(--accent)]",
            )}
          >
            {stage.label}
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {proofCount} {proofCount === 1 ? "case study" : "case studies"}{" "}
            mapped
          </span>
        </span>
        <span className="flex h-10 w-10 items-center justify-center border border-[var(--line)] text-[var(--ink-muted)] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
          <Plus
            aria-hidden
            size={15}
            className={cn("transition-transform", expanded && "rotate-45")}
          />
        </span>
      </button>
      <p
        id={descriptionId}
        className={cn(
          "ml-12 max-w-[58ch] overflow-hidden pr-12 text-sm leading-6 text-[var(--ink-muted)] transition-[max-height,opacity,padding] duration-300 ease-[var(--ease-spine)] sm:ml-[4.5rem]",
          expanded ? "max-h-28 pb-6 opacity-100" : "max-h-0 pb-0 opacity-0",
        )}
      >
        {stage.description}
      </p>
    </div>
  );
}
