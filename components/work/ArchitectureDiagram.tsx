export function ArchitectureDiagram({ flow }: { flow: string }) {
  const steps = flow.split("->").map((step) => step.trim());

  return (
    <figure>
      <ol
        aria-label={`Architecture flow: ${steps.join(" then ")}`}
        className="grid border-l border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-3"
      >
        {steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="relative min-h-28 border-b border-r border-[var(--line)] p-4"
          >
            <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--accent-secondary)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-5 max-w-[22ch] font-display text-sm font-semibold leading-tight tracking-[-0.025em] text-[var(--ink)]">
              {step}
            </p>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute bottom-3 right-3 font-mono text-xs text-[var(--accent)]"
              >
                ↘
              </span>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {steps.length} verified stages · numbered in delivery order
      </figcaption>
    </figure>
  );
}
