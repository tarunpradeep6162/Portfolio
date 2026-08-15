import type { LabProject } from "@/content/types";

export function LabProjectList({ projects }: { projects: LabProject[] }) {
  return (
    <ol className="border-t border-[var(--line)]">
      {projects.map((project, index) => (
        <li
          key={project.slug}
          data-reveal
          className="group grid grid-cols-1 gap-3 border-b border-[var(--line)] py-6 sm:grid-cols-[3rem_0.72fr_1.28fr] sm:gap-6"
        >
          <span className="font-mono text-[9px] tracking-[0.14em] text-[var(--accent-secondary)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {project.categories.join(" / ")}
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold leading-tight tracking-[-0.035em] text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
              {project.title}
            </h3>
          </div>
          <div>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              {project.summary}
            </p>
            <p className="mt-3 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
              {project.toolsAndServices.join(" · ")}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
