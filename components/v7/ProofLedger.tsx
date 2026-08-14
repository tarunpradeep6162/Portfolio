"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { cn } from "@/lib/cn";
import { computeEvidenceRecords, type EvidenceStatus } from "@/lib/v7/evidenceMapper";
import { useExperienceState } from "@/lib/v6/ExperienceProvider";

const STATUS_FILTERS: { value: EvidenceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "explained", label: "Explained" },
  { value: "missing", label: "Missing" },
];

const STATUS_COLOR: Record<EvidenceStatus, string> = {
  verified: "var(--color-signal-lime)",
  explained: "var(--color-relay-cyan)",
  missing: "var(--color-incident-amber)",
};

/**
 * Proof Ledger (spec Section 10.7): every claim across every real project,
 * derived from lib/v7/evidenceMapper.ts (which reads content/projects.ts
 * directly - no second content database). Three strongly separated
 * states, every important claim resolves to exactly one. Filterable by
 * status and, when a System Trace stage is selected, by that stage - the
 * same selectedStageId every other V7 surface already reads, not a
 * duplicate selection mechanism.
 */
export function ProofLedger() {
  const [statusFilter, setStatusFilter] = useState<EvidenceStatus | "all">("all");
  const { selectedStageId } = useExperienceState();
  const allRecords = useMemo(() => computeEvidenceRecords(), []);

  const records = allRecords.filter((record) => {
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    if (selectedStageId !== null && record.stageId && record.stageId !== selectedStageId) return false;
    return true;
  });

  const counts = {
    verified: allRecords.filter((r) => r.status === "verified").length,
    explained: allRecords.filter((r) => r.status === "explained").length,
    missing: allRecords.filter((r) => r.status === "missing").length,
  };

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
        Proof Ledger
      </p>
      <p className="mt-1.5 max-w-[62ch] text-[11px] leading-5 text-[var(--ink-muted)]">
        Every claim across every real project, resolved to verified,
        explained, or missing - never left ambiguous.
        {selectedStageId && " Filtered to the currently traced stage."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter the Proof Ledger by evidence status">
        {STATUS_FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value;
          const count = filter.value === "all" ? allRecords.length : counts[filter.value];
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
                isActive
                  ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                  : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]",
              )}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>

      <ul
        className="mt-5 max-h-[28rem] overflow-y-auto border-t border-[var(--line)]"
        aria-label={`Proof Ledger, ${records.length} record${records.length === 1 ? "" : "s"} shown`}
      >
        {records.length === 0 ? (
          <li className="py-6 text-xs leading-6 text-[var(--ink-muted)]">
            No records match this filter.
          </li>
        ) : (
          records.map((record) => (
            <li key={record.id} className="grid gap-2 border-b border-[var(--line)] py-4 sm:grid-cols-[7rem_1fr]">
              <span
                className="inline-flex h-fit items-center gap-1.5 self-start font-mono text-[8px] uppercase tracking-[0.1em]"
                style={{ color: STATUS_COLOR[record.status] }}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[record.status] }}
                />
                {record.status}
              </span>
              <div>
                <p className="text-xs leading-5 text-[var(--ink)]">{record.claim}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                  {record.projectTitle}
                </p>
                {record.limitation && (
                  <p className="mt-1.5 text-[11px] leading-5 text-[var(--ink-muted)]">{record.limitation}</p>
                )}
                {record.sourceUrl && (
                  <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.08em]">
                    <ExternalLink href={record.sourceUrl}>{record.sourceLabel ?? "source"}</ExternalLink>
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
