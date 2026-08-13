import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
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
  description:
    "The web résumé for Tarun Pradeep B - Cloud Engineer and DevOps professional.",
};

export default function ResumePage() {
  return (
    <section
      data-field="manual"
      className="manual-grid bg-[var(--surface)] py-10 text-[var(--ink)] sm:py-16 lg:py-20"
    >
      <Container className="max-w-[76rem]">
        <header className="relative overflow-hidden bg-[var(--color-control-black)] p-6 text-[var(--color-cloud-linen)] sm:p-10 lg:p-14">
          <div
            aria-hidden
            className="absolute -right-20 -top-36 h-[28rem] w-[28rem] rounded-full border border-dashed border-white/10 route-orbit"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-signal-lime)]">
                Web résumé / current record
              </p>
              <h1 className="mt-5 font-display text-[clamp(2.8rem,2rem+4vw,6.25rem)] font-semibold uppercase leading-[0.82] tracking-[-0.075em]">
                Tarun
                <br />
                Pradeep B
              </h1>
              <p className="mt-6 text-lead text-[var(--color-telemetry-steel)]">
                {hero.eyebrow}
              </p>
            </div>
            <ul className="space-y-3 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-telemetry-steel)]">
              <li>{site.location}</li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-[var(--color-cloud-linen)] hover:text-[var(--color-signal-lime)]"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-signal-lime)]"
                >
                  GitHub / tarunpradeep6162
                </a>
              </li>
              <li>
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-signal-lime)]"
                >
                  LinkedIn / Tarun Pradeep B
                </a>
              </li>
            </ul>
          </div>
        </header>

        <div className="grid border-x border-b border-[var(--line)] lg:grid-cols-[0.38fr_0.62fr]">
          <aside className="border-b border-[var(--line)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
            {resumeFile.status === "ready" ? (
              <Button href={resumeFile.value.href}>
                Download résumé (PDF)
              </Button>
            ) : (
              <div className="no-print">
                <Button href={`mailto:${site.email}?subject=Résumé request`}>
                  Request a PDF by email
                </Button>
                <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
                  No PDF export yet — this page is the complete current record.
                </p>
              </div>
            )}

            <section className="mt-12">
              <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
                Skills matrix
              </h2>
              <dl className="mt-5 space-y-7">
                {skillDomains.map((domain) => (
                  <div key={domain.domain}>
                    <dt className="font-display text-sm font-semibold tracking-[-0.02em]">
                      {domain.domain}
                    </dt>
                    <dd className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">
                      {domain.items.join(" · ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-12 border-t border-[var(--line)] pt-8">
              <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
                Education
              </h2>
              <ul className="mt-5 space-y-6">
                {education.map((entry) => (
                  <li key={entry.credential}>
                    <p className="font-display text-sm font-semibold leading-tight">
                      {entry.credential}
                    </p>
                    <p className="mt-2 font-mono text-[9px] leading-5 text-[var(--ink-muted)]">
                      {entry.institution}
                      <br />
                      {entry.date}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <div className="p-6 sm:p-10 lg:p-12">
            <section>
              <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
                Experience
              </h2>
              <div className="mt-6">
                <ExperienceTimeline roles={experience} />
              </div>
            </section>

            <section className="mt-14 border-t border-[var(--line)] pt-10">
              <h2 className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
                Certifications and training
              </h2>
              <div className="mt-6">
                <CertificationList items={certifications} />
              </div>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
