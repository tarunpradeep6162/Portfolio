import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { ProjectCard } from "@/components/work/ProjectCard";
import { LabProjectList } from "@/components/work/LabProjectList";
import { ReliabilitySpine } from "@/components/spine/ReliabilitySpine";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { Button } from "@/components/ui/Button";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
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
        <ScrollReveal className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2">
          {flagships.map((project) => (
            <div key={project.slug} data-reveal>
              <ProjectCard project={project} />
            </div>
          ))}
        </ScrollReveal>
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
        <ScrollReveal className="mt-16">
          <ReliabilitySpine />
        </ScrollReveal>
      </Section>

      {/* Capabilities */}
      <Section field="manual" id="capabilities" className="pt-0">
        <Eyebrow>Capabilities</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Domains, not scores.
        </h2>
        <ScrollReveal className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {skillDomains.map((domain) => (
            <div key={domain.domain} data-reveal className="border-t border-[var(--line)] pt-4">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent-secondary)]">
                {domain.domain}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{domain.items.join(" · ")}</p>
            </div>
          ))}
        </ScrollReveal>
      </Section>

      {/* Experience */}
      <Section field="manual" id="experience" className="pt-0">
        <Eyebrow>Experience</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
          Reverse chronological.
        </h2>
        <ScrollReveal className="mt-12">
          <ExperienceTimeline roles={experience} />
        </ScrollReveal>
      </Section>

      {/* Education and selected certifications */}
      <Section field="manual" id="credentials" className="pt-0">
        <Eyebrow>Education &amp; certifications</Eyebrow>
        <ScrollReveal className="mt-8">
          <CertificationList items={certifications} />
        </ScrollReveal>
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
        <ScrollReveal className="mt-10">
          <LabProjectList projects={labProjects} />
        </ScrollReveal>
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
