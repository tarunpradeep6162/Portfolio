import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArchitectureDiagram } from "@/components/work/ArchitectureDiagram";
import { AtlasSection } from "@/components/atlas/AtlasSection";
import { TimeMachine } from "@/components/atlas/TimeMachine";
import { ProofMode } from "@/components/work/ProofMode";
import {
  ProjectCoverArt,
  getCoverArtVariant,
  COVER_ART_LEGEND,
} from "@/components/work/ProjectCoverArt";
import { projects } from "@/content/projects";
import type { FlagshipProject } from "@/content/types";

function getFlagship(slug: string): FlagshipProject | undefined {
  const project = projects.find((item) => item.slug === slug);
  return project?.kind === "flagship" ? project : undefined;
}

export function generateStaticParams() {
  return projects
    .filter((project) => project.kind === "flagship")
    .map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getFlagship(slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

function Chapter({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-[var(--line)] py-10 sm:grid-cols-[4rem_1fr] sm:gap-8 sm:py-14">
      <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--accent-secondary)]">
        {number}
      </span>
      <div>
        <h2 className="font-display text-heading font-semibold tracking-[-0.045em] text-[var(--ink)]">
          {title}
        </h2>
        <div className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getFlagship(slug);
  if (!project) notFound();

  const flagships = projects.filter((item) => item.kind === "flagship");
  const projectIndex = flagships.findIndex(
    (item) => item.slug === project.slug,
  );
  const nextProject = flagships[(projectIndex + 1) % flagships.length];
  const variant = getCoverArtVariant(project.slug);

  return (
    <article>
      <header className="control-grid relative overflow-hidden border-b border-white/10 bg-[var(--color-control-black)] py-16 sm:py-20 lg:py-24">
        <Container>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)] transition-colors hover:text-[var(--color-signal-lime)]"
          >
            <ArrowLeft size={13} aria-hidden /> Work index
          </Link>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Eyebrow>
                Case study / {String(projectIndex + 1).padStart(2, "0")}
              </Eyebrow>
              <h1 className="mt-6 font-display text-[clamp(2.6rem,1.65rem+3.2vw,5.4rem)] font-semibold leading-[0.93] tracking-[-0.065em] text-[var(--ink)]">
                {project.title}
              </h1>
              <p className="mt-6 max-w-[54ch] text-lead leading-8 text-[var(--ink-muted)]">
                {project.summary}
              </p>
              <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
                {project.categories.join(" / ")}
              </p>
              {project.labelNote && (
                <p className="mt-4 max-w-[60ch] text-xs leading-5 text-[var(--ink-muted)]">
                  {project.labelNote}
                </p>
              )}
            </div>

            <div className="shadow-[0_32px_100px_rgba(0,0,0,0.35)]">
              {project.screenshot.status === "ready" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.screenshot.value.src}
                  alt={project.screenshot.value.alt}
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-[12/7] w-full object-cover"
                />
              ) : (
                <ProjectCoverArt
                  flow={project.flow}
                  variant={variant}
                  bordered={false}
                />
              )}
            </div>
          </div>
        </Container>
      </header>

      <div
        data-field="manual"
        className="manual-grid bg-[var(--surface)] text-[var(--ink)]"
      >
        <Container className="grid grid-cols-1 gap-12 py-16 sm:py-20 lg:grid-cols-[0.36fr_0.64fr] lg:gap-20 lg:py-28">
          <aside>
            <div className="border-t border-[var(--line)] pt-5 lg:sticky lg:top-28">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
                Project record
              </p>
              <dl className="mt-6 space-y-6">
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Responsibility
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--ink)]">
                    {project.responsibility}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Stack
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--ink)]">
                    {project.toolsAndServices.join(" · ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                    Protocol mapping
                  </dt>
                  <dd className="mt-2 font-mono text-[10px] uppercase leading-5 tracking-[0.08em] text-[var(--accent-secondary)]">
                    {project.spineStages.join(" → ")}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>

          <div>
            <Chapter number="01" title="The constraint">
              <p>{project.context}</p>
            </Chapter>

            <Chapter number="02" title="The architecture">
              {project.screenshot.status !== "ready" && (
                <p className="mb-6 max-w-[64ch] font-mono text-[9px] uppercase leading-5 tracking-[0.08em]">
                  {COVER_ART_LEGEND[variant]}
                </p>
              )}
              <ArchitectureDiagram flow={project.flow} />
              <AtlasSection flow={project.flow} projectLabel={project.title} />
              <TimeMachine spineStageIds={project.spineStages} projectLabel={project.title} />
            </Chapter>

            <Chapter number="03" title="The engineering decisions">
              <ul className="border-t border-[var(--line)]">
                {project.implementationDecisions.map((decision, index) => (
                  <li
                    key={decision}
                    className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[var(--line)] py-4"
                  >
                    <span className="font-mono text-[9px] text-[var(--accent-secondary)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </Chapter>

            <Chapter number="04" title="The hard part">
              <p>{project.challengeAndResolution}</p>
            </Chapter>

            <Chapter number="05" title="What shipped">
              <p className="font-display text-[clamp(1.55rem,1.25rem+1vw,2.3rem)] font-semibold leading-[1.18] tracking-[-0.04em] text-[var(--ink)]">
                {project.outcome}
              </p>
              {project.links.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-5 font-mono text-[10px] uppercase tracking-[0.1em]">
                  {project.links.map((link) => (
                    <ExternalLink key={link.href} href={link.href}>
                      {link.label}
                    </ExternalLink>
                  ))}
                </div>
              )}
            </Chapter>

            <ProofMode project={project} />
          </div>
        </Container>
      </div>

      <section className="border-t border-white/10 bg-[var(--color-control-black)] py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-telemetry-steel)]">
              Next system
            </p>
            <h2 className="mt-4 max-w-[22ch] font-display text-heading font-semibold leading-tight tracking-[-0.045em] text-[var(--color-cloud-linen)]">
              {nextProject.title}
            </h2>
          </div>
          <Button href={`/work/${nextProject.slug}`} variant="secondary">
            Read next case <ArrowUpRight size={15} aria-hidden />
          </Button>
        </Container>
      </section>
    </article>
  );
}
