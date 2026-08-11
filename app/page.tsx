import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ReliabilitySpine } from "@/components/spine/ReliabilitySpine";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { Button } from "@/components/ui/Button";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { projects } from "@/content/projects";
import { skillDomains } from "@/content/skills";
import { experience } from "@/content/experience";
import { certifications } from "@/content/certifications";
import { site } from "@/content/site";

const flagships = projects.filter((p) => p.kind === "flagship");
const labProjects = projects.filter((p) => p.kind === "lab");

export default function Home() {
  return (
    <>
      <Hero />

      {/* Credibility strip: real technologies/certifications only, no fabricated metrics (spec §10.3) */}
      <Section className="border-y border-[var(--line)] py-10">
        <div className="flex flex-wrap items-center gap-3">
          {["AWS", "Azure", "Docker", "Jenkins", "Linux", "Kubernetes", "CI/CD"].map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      </Section>

      {/* Selected Work */}
      <Section field="manual" id="work">
        <Eyebrow>Selected work</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Four systems, end to end.
        </h2>
        <div className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2">
          {flagships.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Section>

      {/* Reliability Spine walkthrough */}
      <Section field="manual" id="spine" className="pt-0">
        <Eyebrow>How it fits together</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          The Reliability Spine
        </h2>
        <p className="mt-4 max-w-[60ch] text-[var(--ink-muted)]">
          Every project above sits somewhere on this chain. Select a stage to see what it means in practice.
        </p>
        <div className="mt-16">
          <ReliabilitySpine />
        </div>
      </Section>

      {/* Capabilities */}
      <Section field="manual" id="capabilities" className="pt-0">
        <Eyebrow>Capabilities</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Domains, not scores.
        </h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          {skillDomains.map((domain) => (
            <div key={domain.domain}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--accent-secondary)]">
                {domain.domain}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {domain.items.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section field="manual" id="experience" className="pt-0">
        <Eyebrow>Experience</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Reverse chronological.
        </h2>
        <div className="mt-12">
          <ExperienceTimeline roles={experience} />
        </div>
      </Section>

      {/* Education and selected certifications */}
      <Section field="manual" id="credentials" className="pt-0">
        <Eyebrow>Education &amp; certifications</Eyebrow>
        <div className="mt-8">
          <CertificationList items={certifications} />
        </div>
        <div className="mt-6">
          <Link href="/about" className="font-mono text-sm text-[var(--accent-secondary)] hover:text-[var(--accent)]">
            Full education history &rarr;
          </Link>
        </div>
      </Section>

      {/* Engineering Lab */}
      <Section field="manual" id="lab" className="pt-0">
        <Eyebrow>Engineering lab</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Smaller builds, same discipline.
        </h2>
        <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {labProjects.map((project) => (
            <li key={project.slug} className="border-t border-[var(--line)] pt-4">
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
      </Section>

      {/* Contact */}
      <Section field="manual" id="contact" className="pt-0">
        <Eyebrow>Contact</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Let&rsquo;s talk about a system that needs building.
        </h2>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button href={`mailto:${site.email}`}>Email Tarun</Button>
          <CopyEmailButton email={site.email} />
        </div>
      </Section>
    </>
  );
}
