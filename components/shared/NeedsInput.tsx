/**
 * The one canonical "Needs input" callout (spec §2, §7-9). Every field
 * modeled as Field<T> with status "needs-input" renders through this
 * component - never a blank space, never a fabricated placeholder value.
 */
export function NeedsInput({ note }: { note: string }) {
  return (
    <div
      role="note"
      className="rounded-sm border border-dashed border-[var(--line)] bg-[var(--surface-raised)]/40 px-4 py-3 font-mono text-xs text-[var(--ink-muted)]"
    >
      <span className="font-semibold text-[var(--accent-secondary)]">Needs input — </span>
      {note}
    </div>
  );
}
