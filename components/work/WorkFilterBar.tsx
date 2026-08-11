"use client";

import { useState, useMemo } from "react";
import type { Project, ProjectCategory } from "@/content/types";
import { ProjectCard } from "./ProjectCard";
import { LabProjectList } from "./LabProjectList";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { cn } from "@/lib/cn";

const categories: ProjectCategory[] = ["Cloud", "DevOps", "Systems", "Creative Engineering"];

export function WorkFilterBar({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<ProjectCategory | "All">("All");

  const filtered = useMemo(
    () => (active === "All" ? projects : projects.filter((p) => p.categories.includes(active))),
    [active, projects],
  );

  const flagships = filtered.filter((p) => p.kind === "flagship");
  const labs = filtered.filter((p) => p.kind === "lab");

  return (
    <div>
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
        {(["All", ...categories] as const).map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={active === category}
            onClick={() => setActive(category)}
            className={cn(
              "min-h-11 rounded-sm border px-4 font-mono text-sm transition-colors",
              active === category
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {flagships.length > 0 && (
        <div className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-wide text-[var(--ink-muted)]">Case studies</h2>
          <ScrollReveal
            key={`flagships-${active}`}
            className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2"
          >
            {flagships.map((project) => (
              <div key={project.slug} data-reveal>
                <ProjectCard project={project} />
              </div>
            ))}
          </ScrollReveal>
        </div>
      )}

      {labs.length > 0 && (
        <div className={flagships.length > 0 ? "mt-20" : "mt-10"}>
          <h2 className="font-mono text-xs uppercase tracking-wide text-[var(--ink-muted)]">Engineering lab</h2>
          <ScrollReveal key={`labs-${active}`} className="mt-6">
            <LabProjectList projects={labs} />
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
