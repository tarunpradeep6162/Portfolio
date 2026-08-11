import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/types";
import { ProjectCoverArt, getCoverArtVariant } from "./ProjectCoverArt";
import { cn } from "@/lib/cn";

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

  const body = (
    <>
      {project.kind === "flagship" && (
        <div className="relative overflow-hidden bg-[var(--color-control-black)]">
          {project.screenshot.status === "ready" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.screenshot.value.src}
              alt={project.screenshot.value.alt}
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
          <span className="project-card-arrow flex h-11 w-11 items-center justify-center border border-[var(--line)] text-[var(--ink)] transition-transform duration-300 ease-[var(--ease-spine)]">
            <ArrowUpRight size={17} aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("project-card group block", className)}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
