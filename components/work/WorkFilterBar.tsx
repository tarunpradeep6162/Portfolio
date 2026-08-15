"use client";

import { useMemo, useState } from "react";
import type { Project, ProjectCategory } from "@/content/types";
import { ProjectCard } from "./ProjectCard";
import { LabProjectList } from "./LabProjectList";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { cn } from "@/lib/cn";

const categories: ProjectCategory[] = [
  "Cloud",
  "DevOps",
  "Systems",
  "Creative Engineering",
];

export function WorkFilterBar({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<ProjectCategory | "All">("All");

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((project) => project.categories.includes(active)),
    [active, projects],
  );

  const flagships = filtered.filter((project) => project.kind === "flagship");
  const labs = filtered.filter((project) => project.kind === "lab");

  return (
    <div>
      <div className="flex flex-col gap-5 border-y border-[var(--line)] py-5 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter projects by category"
          className="flex flex-wrap gap-x-5 gap-y-2"
        >
          {(["All", ...categories] as const).map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={active === category}
              onClick={() => setActive(category)}
              className={cn(
                "min-h-11 border-b font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors",
                active === category
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--ink-muted)] hover:border-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
        >
          {String(filtered.length).padStart(2, "0")} records visible
        </p>
      </div>

      {flagships.length > 0 && (
        <section className="mt-16" aria-labelledby="case-studies-heading">
          <div className="flex items-end justify-between gap-6">
            <h2
              id="case-studies-heading"
              className="font-display text-heading font-semibold tracking-[-0.045em] text-[var(--ink)]"
            >
              Case studies
            </h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Long-form / verified
            </p>
          </div>
          <ScrollReveal
            key={`flagships-${active}`}
            className="mt-8 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:gap-y-24"
          >
            {flagships.map((project, index) => (
              <div key={project.slug} data-reveal>
                <ProjectCard project={project} index={index} />
              </div>
            ))}
          </ScrollReveal>
        </section>
      )}

      {labs.length > 0 && (
        <section
          className={flagships.length > 0 ? "mt-28" : "mt-16"}
          aria-labelledby="lab-heading"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[0.7fr_1.3fr] sm:items-end">
            <h2
              id="lab-heading"
              className="font-display text-heading font-semibold tracking-[-0.045em] text-[var(--ink)]"
            >
              Engineering lab
            </h2>
            <p className="max-w-[55ch] text-sm leading-6 text-[var(--ink-muted)]">
              Compact builds and focused exercises. Missing repository links
              stay private until they are verified.
            </p>
          </div>
          <ScrollReveal key={`labs-${active}`} className="mt-8">
            <LabProjectList projects={labs} />
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
