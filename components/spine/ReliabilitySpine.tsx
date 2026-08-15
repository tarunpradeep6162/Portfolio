"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { SpineNode } from "./SpineNode";
import type { SpineStageId } from "@/content/types";
import { useObservatoryHighlightListener } from "@/lib/companion/observatoryHighlight";
import { useExperienceState } from "@/lib/v6/ExperienceProvider";

/**
 * v5.1: when no explicit `activeStages` prop is given, this list listens
 * for the typed observatoryHighlight event (lib/companion/observatoryHighlight.ts)
 * and marks the single real stage RC-01 is narrating as active - so the
 * Reliability Spine Tour's "pointing" gesture produces a real, per-stage
 * reaction in whichever real spine visualization the visitor's viewport is
 * actually showing (the tour scrolls here, past the Hero's Observatory). An
 * explicit `activeStages` prop always wins, so any future caller that
 * wants deliberate control over which stages are marked active is
 * unaffected.
 *
 * V7: below both of those in priority, this also falls back to the shared
 * System Trace state (`selectedStageId`/`traceScope`) - a *persistent*
 * user selection, unlike the transient 1.8s RC-01 highlight above it. Two
 * genuinely different mechanisms for two genuinely different purposes
 * (momentary narration vs. deliberate selection), not a duplicate source
 * of truth for the same thing - see docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md.
 */
export function ReliabilitySpine({
  activeStages,
  className,
}: {
  activeStages?: SpineStageId[];
  className?: string;
}) {
  const flagships = projects.filter((project) => project.kind === "flagship");
  const [eventHighlight, setEventHighlight] = useState<SpineStageId | "all" | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleHighlight = useCallback((stageId: SpineStageId | "all") => {
    setEventHighlight(stageId);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setEventHighlight(null), 1800);
  }, []);

  useObservatoryHighlightListener(handleHighlight);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const { selectedStageId, traceScope } = useExperienceState();
  const traceActiveStages =
    selectedStageId === null
      ? undefined
      : traceScope === "all"
        ? spineStages.map((s) => s.id)
        : [selectedStageId];

  const effectiveActiveStages =
    activeStages ??
    (eventHighlight === "all"
      ? spineStages.map((s) => s.id)
      : eventHighlight
        ? [eventHighlight]
        : traceActiveStages);

  return (
    <div className={className}>
      <ol className="border-t border-[var(--line)]">
        {spineStages.map((stage, index) => {
          const proofCount = flagships.filter((project) =>
            project.spineStages.includes(stage.id),
          ).length;
          return (
            <li key={stage.id} data-reveal>
              <SpineNode
                stage={stage}
                index={index}
                active={effectiveActiveStages?.includes(stage.id)}
                proofCount={proofCount}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
