"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { useExperienceDispatch, useExperienceState } from "@/lib/v6/ExperienceProvider";

/**
 * The V9 Engineer Investigation connective pass
 * (docs/PORTFOLIO_V9_ARCHITECTURE.md / docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md
 * Phase 3). Unlike the Recruiter Flight Plan, this phase adds no new
 * content system - architecture decisions, incident reconstruction,
 * automation/deployment history, and security/performance proof all
 * already exist on this page (the 4 flagship case-study pages' own
 * implementationDecisions/challengeAndResolution fields, and the
 * IncidentReplay/AutomationFabric/ProofLedger/ProjectComparison sections
 * inside #spine). This component's only job is to sequence real jump
 * links to that existing content when visitorPath === "engineer" -
 * connecting, not duplicating.
 */
export function EngineerInvestigationBar() {
  const { visitorPath } = useExperienceState();
  const dispatch = useExperienceDispatch();

  if (visitorPath !== "engineer") return null;

  const stops = [
    { href: "/work", label: "Architecture & decisions" },
    { href: "#evidence-graph", label: "Evidence graph" },
    { href: "#scenario-simulator", label: "Scenario simulator" },
    { href: "/engineering-log#incident-replay", label: "Incident reconstruction" },
    { href: "/engineering-log#automation-fabric", label: "Deployment history" },
    { href: "#proof-ledger", label: "Security & performance proof" },
    { href: "#project-comparison", label: "Compare systems" },
  ];

  return (
    <section
      aria-label="Engineer investigation"
      data-field="manual"
      className="border-b border-white/10 bg-[var(--color-control-black)] py-10 text-[var(--color-cloud-linen)] sm:py-14"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-signal-lime)]">
              Engineer investigation
            </p>
            <p className="mt-2 max-w-[60ch] text-sm leading-6 text-[var(--ink-muted)]">
              Full implementation detail and real trade-offs, in the same real
              evidence already on this page - nothing below is summarized or
              softened for this path.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "VISITOR_PATH_SET", path: null })}
            className="mt-1 shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] underline decoration-white/20 underline-offset-4 hover:decoration-[var(--color-signal-lime)]"
          >
            Exit investigation
          </button>
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {stops.map((stop) => (
            <li key={stop.href}>
              <Link
                href={stop.href}
                className="inline-flex items-center gap-2 rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)]/50 hover:text-[var(--color-signal-lime)]"
              >
                {stop.href.startsWith("#") && <ArrowDown size={11} aria-hidden />}
                {stop.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
