import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ArchitectureDiagram } from "@/components/work/ArchitectureDiagram";
import { ProjectCoverArt, getCoverArtVariant, COVER_ART_LEGEND } from "@/components/work/ProjectCoverArt";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { cn } from "@/lib/cn";
import { projects } from "@/content/projects";
import type { FlagshipProject } from "@/content/types";

function getFlagship(slug: string): FlagshipProject | undefined {
  const project = projects.find((p) => p.slug === slug);
  return project?.kind === "flagship" ? project : undefined;
}

export function generateStaticParams() {
  return projects.filter((p) => p.kind === "flagship").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getFlagship(slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getFlagship(slug);
  if (!project) notFound();

  const flagshipIndex = projects.filter((p) => p.kind === "flagship").findIndex((p) => p.slug === project.slug);
  const reverseColumns = flagshipIndex % 2 === 1;
  const related = projects.filter((p) => p.kind === "flagship" && p.slug !== project.slug).slice(0, 2);

  return (
    <article>
      <Section field="manual" className="pt-16 pb-10">
        <Eyebrow>Case study</Eyebrow>
        <h1 className="mt-3 max-w-3xl font-display text-display font-semibold text-[var(--ink)]">
          {project.title}
        </h1>
        {project.labelNote && <p className="mt-3 font-mono text-xs text-[var(--accent-secondary)]">{project.labelNote}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.categories.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
        </div>
        <h2 className="sr-only">The problem</h2>
        <p className="mt-6 max-w-[60ch] text-[var(--ink-muted)]">{project.context}</p>
      </Section>

      {/* Full-bleed moment: cover art runs edge to edge, outside the measured
          text column, instead of sitting inside the same max-w-7xl frame as
          every other block on the page. */}
      <div data-field="manual" className="w-full bg-[var(--surface)]">
        {project.screenshot.status === "ready" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.screenshot.value.src}
            alt={project.screenshot.value.alt}
            className="aspect-[21/9] w-full object-cover"
          />
        ) : (
          <ProjectCoverArt flow={project.flow} variant={getCoverArtVariant(project.slug)} bordered={false} />
        )}
      </div>

      <Section field="manual" className="pt-10">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">The architecture</h2>
        {project.screenshot.status !== "ready" && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
            {COVER_ART_LEGEND[getCoverArtVariant(project.slug)]}
          </p>
        )}
        <p className="mt-3 max-w-[60ch] text-sm text-[var(--ink-muted)]">
          Each stage below is a real step in this project&rsquo;s delivery path &mdash; see{" "}
          <Link href="/#spine" className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            how it fits the wider Reliability Spine
          </Link>
          .
        </p>
        <div className="mt-6">
          <ArchitectureDiagram flow={project.flow} />
        </div>
      </Section>

      <Section field="manual" className="pt-0">
        <div className={cn("grid gap-10 sm:grid-cols-2", reverseColumns && "sm:[&>*:first-child]:order-2")}>
          <div>
            <h2 className="font-display text-heading font-semibold text-[var(--ink)]">What I owned</h2>
            <p className="mt-3 text-[var(--ink-muted)]">{project.responsibility}</p>
          </div>
          <div>
            <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Tools and services</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.toolsAndServices.map((tool) => (
                <Badge key={tool}>{tool}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section field="manual" className="pt-0">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">How it was built</h2>
        <ScrollReveal>
          <ul className="mt-4 flex flex-col gap-2">
            {project.implementationDecisions.map((decision) => (
              <li key={decision} data-reveal className="flex gap-3 text-[var(--ink-muted)]">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {decision}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </Section>

      <Section field="manual" className="pt-0">
        <div className={cn("grid gap-10 sm:grid-cols-2", reverseColumns && "sm:[&>*:first-child]:order-2")}>
          <div>
            <h2 className="font-display text-heading font-semibold text-[var(--ink)]">The hard part</h2>
            <p className="mt-3 text-[var(--ink-muted)]">{project.challengeAndResolution}</p>
          </div>
          <div>
            <h2 className="font-display text-heading font-semibold text-[var(--ink)]">What shipped</h2>
            <p className="mt-3 text-[var(--ink-muted)]">{project.outcome}</p>
          </div>
        </div>
      </Section>

      {project.links.length > 0 && (
        <Section field="manual" className="pt-0">
          <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Links</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {project.links.map((link) => (
              <li key={link.href}>
                <ExternalLink href={link.href}>{link.label}</ExternalLink>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section field="manual">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">More case studies</h2>
        <ul className="mt-4 flex flex-wrap gap-6">
          {related.map((p) => (
            <li key={p.slug}>
              <Link href={`/work/${p.slug}`} className="font-mono text-sm text-[var(--accent-secondary)] hover:text-[var(--accent)]">
                {p.title} &rarr;
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
