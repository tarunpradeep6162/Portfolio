"use client";

import { tours, type CompanionTourId } from "@/content/companion";
import { cn } from "@/lib/cn";

interface CompanionTourPanelProps {
  activeTourId: CompanionTourId | null;
  onSelect: (tourId: CompanionTourId) => void;
  onClose: () => void;
}

/**
 * Deterministic, selectable visitor journeys (spec: "RC-01 must support
 * selectable visitor journeys"). Not free-form - a fixed list, and the
 * visitor can always dismiss this and browse normally.
 */
export function CompanionTourPanel({
  activeTourId,
  onSelect,
  onClose,
}: CompanionTourPanelProps) {
  return (
    <div className="border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-telemetry-steel)]">
          Choose a tour
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)] hover:text-[var(--color-signal-lime)]"
        >
          Skip / browse normally
        </button>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {tours.map((tour) => (
          <li key={tour.id}>
            <button
              type="button"
              onClick={() => onSelect(tour.id)}
              aria-pressed={activeTourId === tour.id}
              className={cn(
                "flex w-full flex-col rounded border px-3 py-2 text-left transition-colors",
                activeTourId === tour.id
                  ? "border-[var(--color-signal-lime)] bg-[var(--color-signal-lime)]/10"
                  : "border-white/10 hover:border-white/25",
              )}
            >
              <span className="font-display text-xs font-semibold text-[var(--color-cloud-linen)]">
                {tour.label}
              </span>
              <span className="mt-0.5 text-[11px] leading-4 text-[var(--color-telemetry-steel)]">
                {tour.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
