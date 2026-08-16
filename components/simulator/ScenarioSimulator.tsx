"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { scenarios, type Scenario, type ScenarioChoice } from "@/content/v9/scenarios";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";

const stageLabelById = new Map(spineStages.map((stage) => [stage.id, stage.label]));
const projectTitleBySlug = new Map(projects.map((project) => [project.slug, project.title]));

/**
 * The V9 Scenario Simulator (docs/PORTFOLIO_V9_ARCHITECTURE.md /
 * docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md Phase 5) - flagged in
 * docs/PORTFOLIO_V9_DISCOVERY.md as the pillar most likely to
 * accidentally violate "never fake live infrastructure" if built
 * carelessly, so two rules are enforced structurally here, not just by
 * convention:
 *
 * 1. Every scenario card and every expanded scenario view renders a
 *    persistent, visible "SIMULATION" label - not a tooltip, not only a
 *    doc comment. It is present in the DOM whenever scenario content is
 *    shown, so it survives a screen reader, a screenshot, or a quick
 *    glance equally.
 * 2. This component makes zero network requests and reads no external
 *    state - content/v9/scenarios.ts is the entire data source, already
 *    validated against real skills/projects/spine stages by
 *    tests/unit/scenarios.test.ts. There is nothing here that could be
 *    mistaken for a live system because nothing here is live.
 *
 * Purely client-side interaction state (which scenario is open, which
 * choice was picked) - never persisted, never sent anywhere.
 */
export function ScenarioSimulator() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [choiceByScenario, setChoiceByScenario] = useState<Record<string, string>>({});

  return (
    <section
      id="scenario-simulator"
      aria-label="Scenario simulator"
      data-field="manual"
      className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
    >
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Scenario simulator</Eyebrow>
          <h2 className="mt-5 max-w-[18ch] font-display text-heading font-semibold tracking-[-0.04em]">
            Educational simulations, not live systems.
          </h2>
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-[var(--ink-muted)]">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--accent)]" />
            <span>
              Every scenario below is a hypothetical teaching exercise, entirely scripted in
              this browser - it is not connected to any real or live infrastructure. Each
              choice&apos;s outcome is tied to a real skill and a real project, not an invented
              statistic.
            </span>
          </p>
        </div>

        <ul className="mt-10 flex flex-col gap-3">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.slug}
              scenario={scenario}
              open={openSlug === scenario.slug}
              selectedChoiceId={choiceByScenario[scenario.slug] ?? null}
              onToggle={() =>
                setOpenSlug((current) => (current === scenario.slug ? null : scenario.slug))
              }
              onChoose={(choiceId) =>
                setChoiceByScenario((current) => ({ ...current, [scenario.slug]: choiceId }))
              }
            />
          ))}
        </ul>
      </Container>
    </section>
  );
}

function ScenarioCard({
  scenario,
  open,
  selectedChoiceId,
  onToggle,
  onChoose,
}: {
  scenario: Scenario;
  open: boolean;
  selectedChoiceId: string | null;
  onToggle: () => void;
  onChoose: (choiceId: string) => void;
}) {
  const selectedChoice = scenario.choices.find((choice) => choice.id === selectedChoiceId) ?? null;

  return (
    <li className="border border-[var(--line)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
            Simulation
          </span>
          <span className="font-display text-base font-semibold">{scenario.title}</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
          {stageLabelById.get(scenario.spineStageId) ?? scenario.spineStageId}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--line)] p-5">
          <p className="text-sm leading-6 text-[var(--ink-muted)]">{scenario.setup}</p>

          <ul className="mt-5 flex flex-col gap-2">
            {scenario.choices.map((choice) => (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => onChoose(choice.id)}
                  aria-pressed={selectedChoiceId === choice.id}
                  className={cn(
                    "w-full rounded border px-4 py-2.5 text-left text-sm transition-colors",
                    selectedChoiceId === choice.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--line)] hover:border-[var(--accent)]/40",
                  )}
                >
                  {choice.label}
                </button>
              </li>
            ))}
          </ul>

          {selectedChoice && <ChoiceOutcome choice={selectedChoice} />}
        </div>
      )}
    </li>
  );
}

function ChoiceOutcome({ choice }: { choice: ScenarioChoice }) {
  const projectTitle = projectTitleBySlug.get(choice.relatedProjectSlug);
  return (
    <div className="mt-4 border-t border-[var(--line)] pt-4">
      <div className="flex items-start gap-2">
        {choice.recommended ? (
          <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--accent)]" />
        ) : (
          <XCircle size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
        )}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            {choice.recommended ? "Recommended approach" : "Trade-off"}
          </p>
          <p className="mt-1 text-sm leading-6">{choice.outcome}</p>
        </div>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
        Connects to
        <span className="rounded border border-[var(--line)] px-2 py-1 text-[var(--ink)]">
          {choice.skillLabel}
        </span>
        <ArrowRight size={10} aria-hidden />
        {projectTitle && (
          <Link
            href={`/work/${choice.relatedProjectSlug}`}
            className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            {projectTitle}
          </Link>
        )}
      </p>
    </div>
  );
}
