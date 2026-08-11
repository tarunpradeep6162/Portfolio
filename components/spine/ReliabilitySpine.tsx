import { spineStages } from "@/content/spine";
import { SpineNode } from "./SpineNode";
import type { SpineStageId } from "@/content/types";

/**
 * The Reliability Spine, rendered as an accessible SVG/DOM diagram. Used
 * both as the hero's always-in-DOM baseline (spec §4, §6) and as the
 * mid-page walkthrough - one data source (content/spine.ts), one renderer,
 * no duplication.
 */
export function ReliabilitySpine({
  activeStages,
  className,
}: {
  activeStages?: SpineStageId[];
  className?: string;
}) {
  return (
    <div className={className}>
      {/*
        Single-row, no-wrap layout only kicks in at lg (1024px) - eight nodes
        plus connecting lines genuinely don't fit in less width than that
        (confirmed by an actual horizontal-overflow bug at 768px during
        verification). Below lg it wraps into a natural multi-row grid.
      */}
      <ol className="flex flex-wrap items-start justify-center gap-x-6 gap-y-8 lg:flex-nowrap lg:justify-between">
        {spineStages.map((stage, index) => (
          <li key={stage.id} data-reveal className="flex items-start gap-6 lg:contents">
            <SpineNode stage={stage} active={activeStages?.includes(stage.id)} />
            {index < spineStages.length - 1 && (
              <span
                aria-hidden
                className="mt-5 hidden h-px flex-1 self-start bg-[var(--line)] lg:block"
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
