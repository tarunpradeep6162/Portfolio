import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WorkFilterBar } from "@/components/work/WorkFilterBar";
import { VisitorPathSelector } from "@/components/work/VisitorPathSelector";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Cloud, DevOps, systems, and creative engineering projects by Tarun Pradeep B.",
};

const flagshipCount = projects.filter(
  (project) => project.kind === "flagship",
).length;
const labCount = projects.filter((project) => project.kind === "lab").length;

export default function WorkPage() {
  return (
    <>
      <section className="control-grid relative overflow-hidden border-b border-white/10 bg-[var(--color-control-black)] py-20 sm:py-28 lg:py-36">
        <div
          aria-hidden
          className="absolute right-[-8rem] top-[-16rem] h-[42rem] w-[42rem] rounded-full border border-dashed border-white/10 route-orbit"
        />
        <Container className="relative grid grid-cols-1 gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <Eyebrow>Work index / 01</Eyebrow>
            <h1 className="mt-6 max-w-[13ch] font-display text-display font-semibold leading-[0.91] tracking-[-0.065em] text-[var(--ink)]">
              Proof, arranged as systems.
            </h1>
            <p className="mt-6 max-w-[58ch] text-lead leading-8 text-[var(--ink-muted)]">
              Detailed implementation records first. Smaller engineering
              experiments follow as a compact lab index.
            </p>
          </div>
          <dl className="grid grid-cols-2 border border-[var(--line)]">
            <div className="border-r border-[var(--line)] p-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Case studies
              </dt>
              <dd className="mt-3 font-display text-5xl font-semibold tracking-[-0.06em] text-[var(--accent)]">
                {String(flagshipCount).padStart(2, "0")}
              </dd>
            </div>
            <div className="p-5">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Lab records
              </dt>
              <dd className="mt-3 font-display text-5xl font-semibold tracking-[-0.06em] text-[var(--accent)]">
                {String(labCount).padStart(2, "0")}
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      <section
        data-field="manual"
        className="manual-grid bg-[var(--surface)] py-16 text-[var(--ink)] sm:py-24 lg:py-28"
      >
        <Container>
          <VisitorPathSelector />
          <div className="mt-8">
            <WorkFilterBar projects={projects} />
          </div>
        </Container>
      </section>
    </>
  );
}
