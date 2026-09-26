"use client";

import { Clapperboard } from "lucide-react";
import { setCinemaEnabled, useCinemaEnabled } from "@/lib/cinema/stageStore";
import { cn } from "@/lib/cn";

/** Header switch for the full 3D cinema stage (off by default, remembered). */
export function CinemaToggle({ className }: { className?: string }) {
  const on = useCinemaEnabled();
  return (
    <button
      type="button"
      onClick={() => setCinemaEnabled(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn cinema mode off" : "Turn cinema mode on (3D stage)"}
      title={on ? "Cinema mode on - full 3D stage" : "Cinema mode - turn on the full 3D stage"}
      className={cn(
        // Rendered on the server too (no pop-in / header shift); hidden by CSS
        // for reduced motion, where the 3D stage never runs anyway.
        "flex h-9 items-center gap-2 border px-2.5 motion-reduce:hidden font-mono text-[9px] uppercase tracking-[0.16em] transition-colors",
        on
          ? "border-[var(--color-signal-lime)]/60 text-[var(--color-signal-lime)]"
          : "border-white/15 text-[var(--color-telemetry-steel)] hover:border-white/40 hover:text-[var(--color-cloud-linen)]",
        className,
      )}
    >
      <Clapperboard size={14} aria-hidden />
      <span className="hidden lg:inline">{on ? "Cinema on" : "Cinema"}</span>
    </button>
  );
}
