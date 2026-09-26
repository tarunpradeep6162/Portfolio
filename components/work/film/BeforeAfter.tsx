"use client";

import { useId, useState } from "react";

/**
 * The before/after reveal (Phase 11): the constraint the project started
 * from and what shipped, as one frame with a draggable wipe between them.
 * Keyboard- and screen-reader-operable (a native range input), and both
 * texts are always in the DOM in full.
 */
export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(50);
  const id = useId();
  return (
    <figure className="relative mt-12 overflow-hidden border border-[var(--line)] bg-[var(--color-control-black)] text-[var(--color-cloud-linen)]">
      <figcaption className="sr-only">
        Before: {before} After: {after}
      </figcaption>
      <div aria-hidden className="relative min-h-[15rem] sm:min-h-[12rem]">
        <div className="absolute inset-0 p-6 sm:p-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-signal-coral)]">Before</p>
          <p className="mt-3 max-w-[40ch] font-display text-lg leading-snug tracking-[-0.02em] text-[var(--color-telemetry-steel)] sm:text-xl">
            {before}
          </p>
        </div>
        <div
          className="absolute inset-0 bg-[#0c140a] p-6 sm:p-8"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
        >
          <div className="flex h-full flex-col items-end text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-signal-lime)]">After</p>
            <p className="mt-3 max-w-[40ch] font-display text-lg leading-snug tracking-[-0.02em] sm:text-xl">{after}</p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-[var(--color-signal-lime)] shadow-[0_0_14px_var(--color-signal-lime)]" style={{ left: `${split}%` }}>
          <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-signal-lime)] bg-[var(--color-control-black)] font-mono text-[10px] text-[var(--color-signal-lime)]">
            ⇆
          </span>
        </div>
      </div>
      <label htmlFor={id} className="sr-only">
        Compare before and after
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="before-after-range absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </figure>
  );
}
