"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, useSoundEnabled } from "@/lib/cinema/sound";
import { cn } from "@/lib/cn";

/** Header control for the site-wide sound design. Off by default. */
export function SoundToggle({ className }: { className?: string }) {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!on)}
      aria-pressed={on}
      aria-label={on ? "Turn site sound off" : "Turn site sound on"}
      className={cn(
        "flex h-9 items-center gap-2 border px-2.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors",
        on
          ? "border-[var(--color-signal-lime)]/60 text-[var(--color-signal-lime)]"
          : "border-white/15 text-[var(--color-telemetry-steel)] hover:border-white/40 hover:text-[var(--color-cloud-linen)]",
        className,
      )}
    >
      {on ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}
      <span className="hidden lg:inline">{on ? "Sound on" : "Sound"}</span>
      {on && (
        <span aria-hidden className="sound-bars flex h-3 items-end gap-[2px]">
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}
