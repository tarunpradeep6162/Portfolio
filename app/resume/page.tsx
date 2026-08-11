import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { resumeFile, site, hero } from "@/content/site";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";
import { skillDomains } from "@/content/skills";

export const metadata: Metadata = {
  title: "Résumé",
  description: "The web résumé for Tarun Pradeep B - Cloud Engineer and DevOps professional.",
};

/**
 * No résumé PDF is supplied yet (CONTENT_GAPS.md), and the spec explicitly
 * rejects both a fabricated PDF and a broken/disabled download button as
 * responses to that gap - "provide a polished web résumé" instead. This
 * page assembles one from the same typed content everywhere else on the
 * site draws from (experience.ts, education.ts, certifications.ts,
 * skills.ts): no fact here that isn't already published elsewhere on the
 * site, just composed as a single dense, print-friendly document.
 */
export default function ResumePage() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>Résumé</Eyebrow>
      <h1 className="mt-3 font-display text-display font-semibold text-[var(--ink)]">{site.name}</h1>
      <p className="mt-2 max-w-[60ch] text-[var(--ink-muted)]">{hero.eyebrow}</p>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-[var(--ink-muted)]">
        <li>{site.location}</li>
        <li>
          <a href={`mailto:${site.email}`} className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            {site.email}
          </a>
        </li>
        <li>
          <a href={site.github} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            GitHub
          </a>
        </li>
        <li>
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            LinkedIn
          </a>
        </li>
      </ul>

      {resumeFile.status === "ready" ? (
        <div className="mt-8">
          <Button href={resumeFile.value.href}>Download résumé (PDF)</Button>
        </div>
      ) : (
        <div className="mt-8">
          <Button href={`mailto:${site.email}?subject=Résumé request`}>Request a PDF by email</Button>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
            No PDF export yet &mdash; everything below is the complete, current record.
          </p>
        </div>
      )}

      <div className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Experience</h2>
        <div className="mt-6">
          <ExperienceTimeline roles={experience} />
        </div>
      </div>

      <div className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Skills</h2>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {skillDomains.map((domain) => (
            <div key={domain.domain}>
              <dt className="font-mono text-xs font-semibold uppercase tracking-wide text-[var(--accent-secondary)]">
                {domain.domain}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{domain.items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Education</h2>
        <ul className="mt-6 flex flex-col gap-4">
          {education.map((entry) => (
            <li key={entry.credential} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <p className="font-display text-sm font-semibold text-[var(--ink)]">{entry.credential}</p>
                <p className="font-mono text-xs text-[var(--ink-muted)]">{entry.institution}</p>
              </div>
              <p className="font-mono text-xs text-[var(--ink-muted)]">{entry.date}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Certifications and training</h2>
        <div className="mt-6">
          <CertificationList items={certifications} />
        </div>
      </div>

      <div className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Core technologies</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["AWS", "Azure", "Docker", "Jenkins", "Linux", "Kubernetes", "CI/CD"].map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      </div>
    </Section>
  );
}
