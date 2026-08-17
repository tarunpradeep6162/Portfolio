import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/hero/Hero";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ReliabilitySpine } from "@/components/spine/ReliabilitySpine";
import { InteractiveTimeline } from "@/components/about/InteractiveTimeline";
import { CertificationList } from "@/components/about/CertificationList";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { projects } from "@/content/projects";
import { skillDomains } from "@/content/skills";
import { experience } from "@/content/experience";
import { certifications } from "@/content/certifications";
import { education } from "@/content/education";
import { site } from "@/content/site";

const flagships = projects.filter((project) => project.kind === "flagship");
const labProjects = projects.filter((project) => project.kind === "lab");

export default function Home() {
  return (
    <>
      <Hero />

      <section
        id="work"
        data-field="manual"
        className="manual-grid bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <Eyebrow>Selected systems / 01</Eyebrow>
              <h2 className="mt-5 max-w-[12ch] font-display text-display font-semibold leading-[0.94] tracking-[-0.055em]">
                Evidence over adjectives.
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="max-w-[56ch] text-lead leading-8 text-[var(--ink-muted)]">
                Four implementation stories covering container delivery,
                distributed automation, production architecture, and deployed
                authentication.
              </p>
              <Link
                href="/work"
                className="mt-6 inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-secondary)] hover:text-[var(--accent)]"
              >
                Open the complete work index{" "}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>

          <ScrollReveal className="mt-16 grid gap-x-7 gap-y-16 lg:grid-cols-12 lg:gap-y-24">
            {flagships.map((project, index) => (
              <div
                key={project.slug}
                data-reveal
                className={
                  index === 0 || index === 3 ? "lg:col-span-7" : "lg:col-span-5"
                }
              >
                <ProjectCard project={project} index={index} />
              </div>
            ))}
          </ScrollReveal>
        </Container>
      </section>

      <section
        id="spine"
        className="control-grid relative border-y border-white/10 bg-[var(--color-dark-navy)] py-20 sm:py-28 lg:py-36"
      >
        <Container className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div>
            <div className="lg:sticky lg:top-32">
              <Eyebrow>Reliability protocol / 02</Eyebrow>
              <h2 className="mt-5 max-w-[10ch] font-display text-display font-semibold leading-[0.93] tracking-[-0.055em] text-[var(--ink)]">
                A system is only as strong as its recovery path.
              </h2>
              <p className="mt-6 max-w-[46ch] text-base leading-7 text-[var(--ink-muted)]">
                The same eight-stage protocol connects every case study. Open a
                stage to inspect the operating principle and see how much
                project evidence maps to it.
              </p>
              <div className="mt-10 grid max-w-md grid-cols-2 border border-[var(--line)] font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <div className="border-r border-[var(--line)] p-4">
                  <span className="block font-display text-3xl font-semibold text-[var(--accent)]">
                    08
                  </span>
                  delivery stages
                </div>
                <div className="p-4">
                  <span className="block font-display text-3xl font-semibold text-[var(--accent)]">
                    04
                  </span>
                  mapped systems
                </div>
              </div>
            </div>
          </div>
          <ReliabilitySpine />
        </Container>
      </section>

      <section
        data-field="manual"
        className="bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28 lg:py-36"
      >
        <Container className="grid gap-14 lg:grid-cols-[0.58fr_1.42fr] lg:gap-20">
          <div>
            <Eyebrow>Capability matrix / 03</Eyebrow>
            <p className="mt-8 font-display text-[clamp(5rem,13vw,12rem)] font-bold leading-[0.7] tracking-[-0.09em] text-[var(--ink)]">
              05
            </p>
            <p className="mt-5 max-w-[24ch] text-sm leading-6 text-[var(--ink-muted)]">
              Engineering domains grouped by work performed—not invented
              proficiency scores.
            </p>
          </div>
          <dl className="border-t border-[var(--line)]">
            {skillDomains.map((domain, index) => (
              <div
                key={domain.domain}
                className="grid gap-3 border-b border-[var(--line)] py-6 sm:grid-cols-[3rem_0.55fr_1.45fr] sm:gap-6"
              >
                <dt className="font-mono text-[9px] tracking-[0.16em] text-[var(--accent-secondary)]">
                  0{index + 1}
                </dt>
                <dt className="font-display text-lg font-semibold tracking-[-0.025em]">
                  {domain.domain}
                </dt>
                <dd className="text-sm leading-6 text-[var(--ink-muted)]">
                  {domain.items.join(" · ")}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section
        data-field="manual"
        className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.58fr_1.42fr] lg:gap-20">
            <div>
              <Eyebrow>Operating history / 04</Eyebrow>
              <h2 className="mt-5 max-w-[11ch] font-display text-display font-semibold leading-[0.95] tracking-[-0.055em]">
                From support pressure to cloud delivery.
              </h2>
              <Link
                href="/about"
                className="mt-7 inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-secondary)] hover:text-[var(--accent)]"
              >
                Read the full story <ArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
            <ScrollReveal>
              <InteractiveTimeline roles={experience} />
            </ScrollReveal>
          </div>
        </Container>
      </section>

      <section
        data-field="manual"
        className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
      >
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Credentials / 05</Eyebrow>
            <h2 className="mt-5 font-display text-heading font-semibold tracking-[-0.04em]">
              Education and selected certification
            </h2>
            <div className="mt-8 border-t border-[var(--line)]">
              {education.map((entry) => (
                <div
                  key={entry.credential}
                  className="border-b border-[var(--line)] py-5"
                >
                  <p className="font-display text-base font-semibold">
                    {entry.credential}
                  </p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                    {entry.institution} · {entry.date}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <CertificationList items={certifications.slice(0, 2)} />
            </div>
          </div>

          <div className="border-l-0 border-[var(--line)] lg:border-l lg:pl-20">
            <Eyebrow>Engineering lab / 06</Eyebrow>
            <p className="mt-6 font-display text-[clamp(3.75rem,8vw,7rem)] font-bold leading-none tracking-[-0.075em]">
              {String(labProjects.length).padStart(2, "0")}
            </p>
            <p className="mt-5 max-w-[42ch] text-lead leading-8 text-[var(--ink-muted)]">
              Smaller builds across serverless delivery, networking,
              persistence, autoscaling, Kubernetes, and creative engineering.
            </p>
            <Button href="/work" variant="secondary" className="mt-8">
              Enter the engineering lab
            </Button>
          </div>
        </Container>
      </section>

      <section
        id="contact"
        className="control-grid relative overflow-hidden bg-[var(--color-dark-navy)] py-24 sm:py-32 lg:py-40"
      >
        <div
          aria-hidden
          className="route-orbit absolute -right-40 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-dashed border-white/10"
        />
        <div
          aria-hidden
          className="absolute -right-8 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-[var(--color-gold-primary)]/20"
        />
        <Container className="relative">
          <Eyebrow>Final route / 07</Eyebrow>
          <h2 className="mt-6 max-w-[13ch] font-display text-display font-semibold leading-[0.92] tracking-[-0.06em] text-[var(--ink)]">
            Bring me the system that cannot stay manual.
          </h2>
          <p className="mt-6 max-w-[54ch] text-lead leading-8 text-[var(--ink-muted)]">
            Start with the infrastructure problem, the delivery bottleneck, or
            the recovery question.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href={`mailto:${site.email}`}>Email Tarun</Button>
            <CopyEmailButton email={site.email} />
          </div>
        </Container>
      </section>
    </>
  );
}
