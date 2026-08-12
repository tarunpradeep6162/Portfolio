"use client";

import { useEffect, useRef, useState } from "react";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { SpineNode } from "./SpineNode";
import type { SpineStageId } from "@/content/types";

/**
 * v5.1: when no explicit `activeStages` prop is given, this list listens
 * for the same "rc01:observatory-highlight" event as InfrastructureObservatory
 * and briefly marks every stage active - so RC-01's Reliability Spine Tour
 * "pointing" gesture produces a real, visible reaction in whichever real
 * spine visualization the visitor's viewport is actually showing (the tour
 * scrolls here, past the Hero's Observatory). An explicit `activeStages`
 * prop always wins, so any future caller that wants deliberate control
 * over which stages are marked active is unaffected.
 */
export function ReliabilitySpine({
  activeStages,
  className,
}: {
  activeStages?: SpineStageId[];
  className?: string;
}) {
  const flagships = projects.filter((project) => project.kind === "flagship");
  const [eventHighlighted, setEventHighlighted] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function handleHighlight() {
      setEventHighlighted(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setEventHighlighted(false), 1800);
    }
    window.addEventListener("rc01:observatory-highlight", handleHighlight);
    return () => {
      window.removeEventListener("rc01:observatory-highlight", handleHighlight);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const effectiveActiveStages =
    activeStages ?? (eventHighlighted ? spineStages.map((s) => s.id) : undefined);

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
