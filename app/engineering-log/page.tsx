import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IncidentReplay } from "@/components/v7/IncidentReplay";
import { AutomationFabric } from "@/components/v7/AutomationFabric";
import { RecruiterGate } from "@/components/shared/RecruiterGate";

export const metadata: Metadata = {
  title: "Engineering log",
  description:
    "How this portfolio itself is built and shipped — real CI/CD pipeline stages and real incidents from its own development.",
};

export default function EngineeringLogPage() {
  return (
    <section className="control-grid relative border-b border-white/10 bg-[var(--color-control-black)] py-20 text-[var(--ink)] sm:py-28 lg:py-36">
      <Container>
        <Eyebrow>Engineering log</Eyebrow>
        <h1 className="mt-5 max-w-[16ch] font-display text-display font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--color-cloud-linen)]">
          How this site itself is built and shipped.
        </h1>
        <p className="mt-6 max-w-[60ch] text-lead leading-8 text-[var(--color-telemetry-steel)]">
          This portfolio holds itself to the same evidence standard as the
          case studies: a real CI/CD pipeline (Automation Fabric) and real,
          documented incidents from building this site (Incident Replay) —
          separate from the flagship project work on{" "}
          <Link
            href="/work"
            className="underline decoration-white/30 underline-offset-4 hover:decoration-[var(--color-signal-lime)]"
          >
            /work
          </Link>
          , so the two don&rsquo;t compete for the same scroll.
        </p>

        <div id="automation-fabric">
          <RecruiterGate label="Automation Fabric">
            <AutomationFabric />
          </RecruiterGate>
        </div>
        <div id="incident-replay">
          <RecruiterGate label="Incident Replay">
            <IncidentReplay />
          </RecruiterGate>
        </div>
      </Container>
    </section>
  );
}
