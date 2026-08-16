"use client";

import { useState } from "react";
import { useExperienceState } from "@/lib/v6/ExperienceProvider";

/**
 * Recruiter mode hides the deep-transparency surfaces (Proof Ledger,
 * Project Comparison, Automation Fabric, Incident Replay) by default so
 * the recruiter path stays the fast, outcome-first read it's designed to
 * be - but "never a wall" (VisitorPathSelector's own long-standing
 * contract) still applies: a collapsed reveal control, not a removed
 * section, so the same evidence stays one click away for a recruiter who
 * wants it.
 */
export function RecruiterGate({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { visitorPath } = useExperienceState();
  const [revealed, setRevealed] = useState(false);

  if (visitorPath !== "recruiter" || revealed) {
    return <>{children}</>;
  }

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
        {label}
      </p>
      <p className="mt-2 max-w-[56ch] text-[11px] leading-5 text-[var(--ink-muted)]">
        Hidden by default in Recruiter mode to keep this path fast - the
        same real evidence is one click away.
      </p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="mt-3 rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
      >
        Show anyway
      </button>
    </div>
  );
}
