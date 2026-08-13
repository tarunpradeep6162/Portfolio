import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExperienceTimeline } from "@/components/about/ExperienceTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { about } from "@/content/site";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";

export const metadata: Metadata = {
  title: "About",
  description:
    "Career story, experience, education, and certifications for Tarun Pradeep B.",
};

export default function AboutPage() {
  return (
    <>
      <section className="control-grid relative overflow-hidden bg-[var(--color-control-black)] py-20 sm:py-28 lg:py-36">
        <div
          aria-hidden
          className="absolute -right-48 top-12 h-[36rem] w-[36rem] rounded-full border border-dashed border-white/10 route-orbit"
        />
        <Container className="relative grid gap-12 lg:grid-cols-[0.58fr_1.42fr] lg:gap-20">
          <div>
            <Eyebrow>About / 01</Eyebrow>
            <h1 className="mt-6 font-display text-display font-semibold leading-[0.91] tracking-[-0.065em] text-[var(--ink)]">
              The operator behind the systems.
            </h1>
          </div>
          <div className="lg:pt-16">
            <p className="max-w-[66ch] text-lead leading-8 text-[var(--ink-muted)]">
              {about.narrative}
            </p>
            <Link
              href="/work"
              className="mt-8 inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              Inspect the work <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        </Container>
      </section>

      <section
        data-field="manual"
        className="manual-grid bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
      >
        <Container>
          <p className="max-w-[23ch] font-display text-display font-semibold leading-[0.98] tracking-[-0.06em]">
            &ldquo;{about.philosophy}&rdquo;
          </p>
          <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
            Operating principle / not a slogan
          </p>
        </Container>
      </section>

      <section
        data-field="manual"
        className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
      >
        <Container className="grid gap-12 lg:grid-cols-[0.42fr_1.58fr] lg:gap-20">
          <div>
            <Eyebrow>Experience / 02</Eyebrow>
            <h2 className="mt-5 font-display text-heading font-semibold tracking-[-0.045em]">
              Three operating contexts.
            </h2>
          </div>
          <ExperienceTimeline roles={experience} />
        </Container>
      </section>

      <section
        data-field="manual"
        className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
      >
        <Container className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow>Education / 03</Eyebrow>
            <div className="mt-8 border-t border-[var(--line)]">
              {education.map((entry, index) => (
                <article
                  key={entry.credential}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[var(--line)] py-6"
                >
                  <span className="font-mono text-[9px] text-[var(--accent-secondary)]">
                    0{index + 1}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold leading-tight tracking-[-0.035em]">
                      {entry.credential}
                    </h2>
                    <p className="mt-3 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
                      {entry.institution} · {entry.date}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow>Certification record / 04</Eyebrow>
            <div className="mt-8">
              <CertificationList items={certifications} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
