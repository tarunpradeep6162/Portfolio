import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import type { SpineStageId } from "@/content/types";

export interface SpineInstrument {
  stageId: SpineStageId;
  label: string;
  description: string;
  /** How many real flagship projects demonstrate this stage - a genuine
   * content-derived count, not a decorative random height. Ranges 0-4
   * across the current four flagship projects; never invented. */
  demonstratedByCount: number;
  /** Position along the deck, 0-indexed, in the spine's own declared
   * order - not alphabetical, not by count, so the deck reads as the real
   * commit -> recover pipeline left to right. */
  index: number;
}

/**
 * Pure data transform: the Reliability Spine's 8 real stages, each
 * annotated with how many flagship projects actually demonstrate it.
 * Kept separate from any rendering code so it's cheap to unit test and so
 * the Instrument Deck scene (and, if built later, any 2D/SVG fallback
 * that wants the same counts) share one source instead of two
 * independent tallies that could drift apart.
 */
export function computeSpineInstruments(): SpineInstrument[] {
  const flagships = projects.filter((project) => project.kind === "flagship");

  return spineStages.map((stage, index) => {
    const demonstratedByCount = flagships.filter((project) =>
      project.spineStages.includes(stage.id),
    ).length;

    return {
      stageId: stage.id,
      label: stage.label,
      description: stage.description,
      demonstratedByCount,
      index,
    };
  });
}
