import type { LabProject } from "@/content/types";
import { Badge } from "@/components/ui/Badge";

export function LabProjectList({ projects }: { projects: LabProject[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.slug} data-reveal className="border-t border-[var(--line)] pt-4">
          <h3 className="font-display text-sm font-semibold text-[var(--ink)]">{project.title}</h3>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{project.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.toolsAndServices.slice(0, 4).map((tool) => (
              <Badge key={tool}>{tool}</Badge>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
