"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { incidents } from "@/content/v7/incidents";
import { incidentStepOrder } from "@/lib/v7/incidentModel";

/**
 * Incident Replay (spec Section 10.5): real, documented engineering
 * incidents from this site's own V6/V7 development
 * (content/v7/incidents.ts), stepped through symptom -> evidence -> root
 * cause -> correction -> verification -> prevention -> known limitation.
 * Every field is real; "known limitation" is always shown, including
 * when the honest answer is "none identified" - omitting that field
 * because an incident resolved cleanly would hide exactly the kind of
 * honesty this component exists to demonstrate.
 *
 * Deliberately reuses TimeMachine's step-through interaction shape
 * (select from a list, Previous/Next through ordered steps, aria-current
 * on the active one) rather than inventing a different pattern for a
 * conceptually similar "step through an ordered real sequence" control.
 */
export function IncidentReplay() {
  const [activeIncidentSlug, setActiveIncidentSlug] = useState(incidents[0].slug);
  const [stepIndex, setStepIndex] = useState(0);
  const headingId = useId();

  const incident = incidents.find((i) => i.slug === activeIncidentSlug) ?? incidents[0];
  const stepKey = incidentStepOrder[stepIndex];
  const step = incident[stepKey];

  function selectIncident(slug: string) {
    setActiveIncidentSlug(slug);
    setStepIndex(0);
  }

  function goToStep(index: number) {
    setStepIndex(Math.max(0, Math.min(incidentStepOrder.length - 1, index)));
  }

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p
        id={headingId}
        className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]"
      >
        Incident Replay
      </p>
      <p className="mt-1.5 text-[11px] leading-5 text-[var(--ink-muted)]">
        Real, documented engineering incidents from this site&rsquo;s own
        development - not fabricated outages.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {incidents.map((item) => {
          const isActive = item.slug === activeIncidentSlug;
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => selectIncident(item.slug)}
                aria-pressed={isActive}
                className={cn(
                  "rounded border px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-[0.06em] transition-colors",
                  isActive
                    ? "border-[var(--color-incident-amber)] text-[var(--color-incident-amber)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-incident-amber)] hover:text-[var(--color-incident-amber)]",
                )}
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        System: {incident.system}
      </p>

      <div
        role="group"
        aria-labelledby={headingId}
        className="mt-4"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goToStep(stepIndex + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToStep(stepIndex - 1);
          }
        }}
      >
        <ol className="flex flex-wrap gap-2">
          {incidentStepOrder.map((key, index) => {
            const isActive = index === stepIndex;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => goToStep(index)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${incident[key].label}, step ${index + 1} of ${incidentStepOrder.length}`}
                  className={cn(
                    "rounded border px-3 py-1.5 font-mono text-[10px] tracking-[0.04em] transition-colors",
                    isActive
                      ? "border-[var(--color-incident-amber)] text-[var(--color-incident-amber)]"
                      : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-incident-amber)] hover:text-[var(--color-incident-amber)]",
                  )}
                >
                  {incident[key].label}
                </button>
              </li>
            );
          })}
        </ol>

        <div
          role="status"
          className="mt-4 border border-[var(--color-incident-amber)]/30 bg-[var(--color-incident-amber)]/5 px-4 py-3"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink)]">
            Step {stepIndex + 1} of {incidentStepOrder.length}: {step.label}
          </p>
          <p className="mt-1.5 text-xs leading-6 text-[var(--ink-muted)]">{step.detail}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0}
            aria-label="Previous step in this incident's record"
            className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-incident-amber)] hover:text-[var(--color-incident-amber)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--ink-muted)]"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goToStep(stepIndex + 1)}
            disabled={stepIndex === incidentStepOrder.length - 1}
            aria-label="Next step in this incident's record"
            className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-incident-amber)] hover:text-[var(--color-incident-amber)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--ink-muted)]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
