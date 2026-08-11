import Link from "next/link";
import type { Project } from "@/content/types";
import { Badge } from "@/components/ui/Badge";
import { ProjectCoverArt, getCoverArtVariant } from "./ProjectCoverArt";

export function ProjectCard({ project }: { project: Project }) {
  const href = project.kind === "flagship" ? `/work/${project.slug}` : undefined;
  const body = (
    <>
      {project.kind === "flagship" &&
        (project.screenshot.status === "ready" ? (
          // Real screenshots are added by Tarun later; alt text is sourced from the field itself.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.screenshot.value.src} alt={project.screenshot.value.alt} className="aspect-[16/10] w-full rounded-sm object-cover" />
        ) : (
          <ProjectCoverArt flow={project.flow} variant={getCoverArtVariant(project.slug)} />
        ))}

      <div className="mt-4 flex flex-wrap gap-2">
        {project.categories.map((category) => (
          <Badge key={category}>{category}</Badge>
        ))}
        {project.kind === "flagship" && project.labelNote && <Badge>{project.labelNote}</Badge>}
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold text-[var(--ink)]">{project.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{project.summary}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group block rounded-sm p-1 transition-colors focus-visible:bg-[var(--surface-raised)]/40">
        {body}
      </Link>
    );
  }

  return <div>{body}</div>;
}
