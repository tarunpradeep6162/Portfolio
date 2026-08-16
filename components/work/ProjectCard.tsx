"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/types";
import { ProjectCoverArt, getCoverArtVariant } from "./ProjectCoverArt";
import { cn } from "@/lib/cn";
import { useExperienceState } from "@/lib/v6/ExperienceProvider";

export function ProjectCard({
  project,
  index = 0,
  className,
}: {
  project: Project;
  index?: number;
  className?: string;
}) {
  const href =
    project.kind === "flagship" ? `/work/${project.slug}` : undefined;

  // System Trace (spec Section 10.2): "project cards reveal which projects
  // genuinely demonstrate that stage." Reads the same selectedStageId the
  // Operational Twin/Spine already share - no second source of truth. Only
  // flagship projects carry a spineStages array; lab projects and "no
  // stage selected" both render with no trace styling.
  const { selectedStageId } = useExperienceState();
  const demonstratesTracedStage =
    project.kind === "flagship" &&
    selectedStageId !== null &&
    project.spineStages.includes(selectedStageId);
  const isTraceDimmed = selectedStageId !== null && !demonstratesTracedStage;

  const body = (
    <>
      {project.kind === "flagship" && (
        <div className="relative overflow-hidden bg-[var(--color-control-black)]">
          {project.screenshot.status === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.screenshot.value.src}
              alt={project.screenshot.value.alt}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-[var(--ease-spine)] group-hover:scale-[1.02]"
            />
          ) : (
            <ProjectCoverArt
              flow={project.flow}
              variant={getCoverArtVariant(project.slug)}
            />
          )}
          <span className="absolute left-4 top-4 border border-white/15 bg-black/35 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/65 backdrop-blur">
            System {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-4 border-t border-[var(--line)] pt-5">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent-secondary)]">
            {project.categories.join(" / ")}
          </p>
          <h3 className="mt-3 max-w-[28ch] font-display text-heading font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--ink)]">
            {project.title}
          </h3>
          <p className="mt-3 max-w-[58ch] text-sm leading-6 text-[var(--ink-muted)]">
            {project.summary}
          </p>
        </div>
        {href && (
          <span className="project-card-arrow flex h-11 w-11 items-center justify-center border border-[var(--line)] text-[var(--ink)] transition-[transform,color,box-shadow,border-color] duration-300 ease-[var(--ease-spine)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] group-hover:shadow-[0_0_12px_rgba(216,255,79,0.3)]">
            <ArrowUpRight size={17} aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  const traceProps = {
    "data-v7-trace-demonstrates": demonstratesTracedStage ? "true" : "false",
  };
  const traceClassName = cn(
    "transition-[opacity,border-color] duration-300",
    isTraceDimmed && "opacity-40",
    demonstratesTracedStage &&
      "outline outline-1 outline-offset-4 outline-[var(--color-signal-lime)]",
  );

  const cardClassName = cn("project-card group block", traceClassName, className);

  if (href) {
    return (
      <Link
        href={href}
        className={cardClassName}
        {...traceProps}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={cardClassName} {...traceProps}>
      {body}
    </div>
  );
}
