"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { SpineNode } from "./SpineNode";
import type { SpineStageId } from "@/content/types";
import { useObservatoryHighlightListener } from "@/lib/companion/observatoryHighlight";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ALERT_STAGE, runStateFor, useReleaseRun } from "./useReleaseRun";

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
 */
export function ReliabilitySpine({
  activeStages,
  className,
}: {
  activeStages?: SpineStageId[];
  className?: string;
}) {
  const flagships = projects.filter((project) => project.kind === "flagship");
  const listRef = useRef<HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();
  const runStage = useReleaseRun(listRef, !reducedMotion);
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

  const effectiveActiveStages =
    activeStages ??
    (eventHighlight === "all"
      ? spineStages.map((s) => s.id)
      : eventHighlight
        ? [eventHighlight]
        : undefined);

  return (
    <div className={className}>
      {!reducedMotion && <ReleaseReadout stage={runStage} />}
      <ol ref={listRef} data-stage-anchor="spine" className="border-t border-[var(--line)]">
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
                runState={reducedMotion ? undefined : runStateFor(index, runStage)}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * Sticky "release monitor" over the spine: which stage the simulated
 * release is in, and its health. Clearly labelled a simulation - it is a
 * storytelling device for the protocol, not a claim about real metrics.
 */
function ReleaseReadout({ stage }: { stage: number }) {
  const total = spineStages.length;
  const current = stage >= 0 && stage < total ? spineStages[stage] : null;
  const status =
    stage < 0 ? "Standing by" : stage >= total ? "Recovered · all stages green" : stage === ALERT_STAGE ? "Alert · error budget burning" : "Healthy";
  const tone = stage === ALERT_STAGE ? "text-[var(--color-signal-coral)]" : stage >= total ? "text-[var(--accent)]" : "text-[var(--ink-muted)]";
  return (
    <div
      aria-hidden
      className="sticky top-[4.5rem] z-10 -mx-1 mb-2 flex items-center justify-between gap-4 border border-[var(--line)] bg-[var(--color-control-black)]/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] backdrop-blur"
    >
      <span className="text-[var(--ink-muted)]">
        Simulated release <span className="text-[var(--ink)]">v4.2</span>
      </span>
      <span className="tabular-nums text-[var(--ink)]">
        {current ? `${String(stage + 1).padStart(2, "0")}/${String(total).padStart(2, "0")} ${current.label}` : stage >= total ? "08/08 Complete" : "00/08"}
      </span>
      <span className={`flex items-center gap-2 ${tone}`}>
        <span
          className={`h-1.5 w-1.5 rounded-full ${stage === ALERT_STAGE ? "animate-ping bg-[var(--color-signal-coral)]" : stage >= 0 ? "bg-[var(--accent)]" : "bg-[var(--ink-muted)]"}`}
        />
        {status}
      </span>
    </div>
  );
}
