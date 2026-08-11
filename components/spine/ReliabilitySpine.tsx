import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { SpineNode } from "./SpineNode";
import type { SpineStageId } from "@/content/types";

export function ReliabilitySpine({
  activeStages,
  className,
}: {
  activeStages?: SpineStageId[];
  className?: string;
}) {
  const flagships = projects.filter((project) => project.kind === "flagship");

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
                active={activeStages?.includes(stage.id)}
                proofCount={proofCount}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
