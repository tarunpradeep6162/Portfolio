import { CheckCircle2, Clock } from "lucide-react";
import { automationStages } from "@/content/v7/automation";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { cn } from "@/lib/cn";

/**
 * Automation Fabric (spec Section 10.6): the real pipeline from
 * docs/AUTOMATED_CI_CD.md, stage by stage, each labelled with the real
 * system that performs it and honest evidence - never a tool marked
 * "passed" without a real run behind it. Server-rendered: this is a
 * factual record, not an interactive scene, so it doesn't need client
 * state or a canvas.
 */
export function AutomationFabric() {
  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
        Automation Fabric
      </p>
      <p className="mt-1.5 max-w-[62ch] text-[11px] leading-5 text-[var(--ink-muted)]">
        The real pipeline this site ships through - Change through Rollback
        readiness. Every stage names the system that actually performs it;
        &ldquo;pending&rdquo; means genuinely not yet run for this version, not
        a hidden failure.
      </p>

      <ol className="mt-5 flex flex-col divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {automationStages.map((item, index) => {
          const verified = item.evidence.status === "verified";
          return (
            <li key={item.slug} className="grid gap-3 py-4 sm:grid-cols-[2.5rem_10rem_1fr] sm:gap-5">
              <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--ink-muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  {item.stage}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent-secondary)]">
                  {item.tool}
                </p>
              </div>
              <div>
                <p className="text-xs leading-6 text-[var(--ink-muted)]">{item.description}</p>
                <div
                  className={cn(
                    "mt-2 flex items-start gap-2 rounded border px-3 py-2 text-[11px] leading-5",
                    verified
                      ? "border-[var(--color-signal-lime)]/30 bg-[var(--color-signal-lime)]/5 text-[var(--ink)]"
                      : "border-[var(--color-incident-amber)]/30 bg-[var(--color-incident-amber)]/5 text-[var(--ink)]",
                  )}
                >
                  {verified ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--color-signal-lime)]" aria-hidden />
                  ) : (
                    <Clock size={14} className="mt-0.5 shrink-0 text-[var(--color-incident-amber)]" aria-hidden />
                  )}
                  <span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                      {verified ? "Verified — " : "Pending — "}
                    </span>
                    {item.evidence.detail}
                    {item.evidence.url && (
                      <>
                        {" "}
                        <ExternalLink href={item.evidence.url}>evidence</ExternalLink>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
