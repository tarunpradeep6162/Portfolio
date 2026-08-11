import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { about } from "@/content/site";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";

export const metadata: Metadata = {
  title: "About",
  description: "Career story, experience, education, and certifications for Tarun Pradeep B.",
};

export default function AboutPage() {
  return (
    <>
      <Section field="manual" className="pt-16">
        <Eyebrow>About</Eyebrow>
        <h1 className="mt-3 max-w-3xl font-display text-display font-semibold text-[var(--ink)]">
          Career story
        </h1>
        <p className="mt-6 max-w-[68ch] leading-relaxed text-[var(--ink-muted)]">{about.narrative}</p>
      </Section>

      <Section field="manual" className="pt-0">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Experience</h2>
        <div className="mt-8">
          <ExperienceTimeline roles={experience} />
        </div>
      </Section>

      <Section field="manual" className="pt-0">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Education</h2>
        <ul className="mt-6 flex flex-col gap-4">
          {education.map((entry) => (
            <li key={entry.credential} className="border-t border-[var(--line)] pt-4">
              <p className="font-display text-sm font-semibold text-[var(--ink)]">{entry.credential}</p>
              <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">
                {entry.institution} · {entry.date}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section field="manual">
        <h2 className="font-display text-heading font-semibold text-[var(--ink)]">Certifications and training</h2>
        <div className="mt-6">
          <CertificationList items={certifications} />
        </div>
      </Section>
    </>
  );
}
