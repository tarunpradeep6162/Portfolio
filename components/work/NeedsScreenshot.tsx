/**
 * Reserved-aspect-ratio placeholder for missing project imagery (spec §13:
 * never a stock laptop mockup pretending to be the real project). Fixed
 * aspect ratio prevents layout shift once a real screenshot lands.
 */
export function NeedsScreenshot({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-[16/10] w-full items-center justify-center rounded-sm border border-dashed border-[var(--line)] bg-[var(--surface-raised)]/30"
      role="img"
      aria-label={`${label}: screenshot not yet available`}
    >
      <p className="px-6 text-center font-mono text-xs uppercase tracking-wide text-[var(--ink-muted)]">
        Needs project screenshot
      </p>
    </div>
  );
}
