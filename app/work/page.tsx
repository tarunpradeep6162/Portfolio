import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { WorkFilterBar } from "@/components/work/WorkFilterBar";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Work",
  description: "Cloud, DevOps, systems, and creative engineering projects by Tarun Pradeep B.",
};

export default function WorkPage() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>Selected work</Eyebrow>
      <h1 className="mt-3 max-w-3xl font-display text-display font-semibold text-[var(--ink)]">
        Systems, projects, and the evidence behind them.
      </h1>
      <p className="mt-4 max-w-[60ch] text-[var(--ink-muted)]">
        Four flagship case studies with full implementation detail, plus a compact engineering lab of smaller
        builds. Filter by domain to narrow the list.
      </p>

      <div className="mt-12">
        <WorkFilterBar projects={projects} />
      </div>
    </Section>
  );
}
