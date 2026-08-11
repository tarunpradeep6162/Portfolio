/**
 * Renders a project's `flow` string ("Git -> Build -> Image -> ...") as an
 * exact, accessible DOM diagram - not an AI-generated image (spec §13).
 * A visually-hidden text alternative gives the same content to assistive
 * tech and to visitors who never see the visual boxes at all.
 */
export function ArchitectureDiagram({ flow }: { flow: string }) {
  const steps = flow.split("->").map((step) => step.trim());

  return (
    <figure>
      <div
        role="img"
        aria-label={`Architecture flow: ${steps.join(" then ")}`}
        className="flex flex-wrap items-center gap-x-2 gap-y-3"
      >
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-2">
            <span className="rounded-sm border border-[var(--line)] px-3 py-2 font-mono text-xs text-[var(--ink)]">
              {step}
            </span>
            {index < steps.length - 1 && (
              <span aria-hidden className="text-[var(--ink-muted)]">
                &rarr;
              </span>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)]">
        {steps.length} stages &middot; read left to right &middot; step {steps.length} is the current state
      </figcaption>
    </figure>
  );
}
