"use client";

import { useCallback, useRef } from "react";

type Cue = "activate" | "success" | "error";

const FREQUENCIES: Record<Cue, number> = {
  activate: 520,
  success: 780,
  error: 220,
};

/**
 * Real, synthesized (WebAudio oscillator) UI sound - not a downloaded
 * asset of uncertain licensing, not autoplay, and off unless the visitor
 * explicitly opts in via the panel's sound toggle. No sound plays until
 * `play()` is actually called from a click handler while `enabled` is true.
 */
export function useCompanionSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (cue: Cue) => {
      if (!enabled || typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      contextRef.current ??= new AudioCtx();
      const ctx = contextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = FREQUENCIES[cue];
      oscillator.type = "sine";
      gain.gain.value = 0.05;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.25);
    },
    [enabled],
  );

  return { play };
}
