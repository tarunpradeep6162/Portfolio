"use client";

import { useCallback, useMemo, useRef } from "react";

export type Cue = "activate" | "success" | "error" | "servo" | "think" | "message" | "listen";

/**
 * Real, synthesized (WebAudio) UI sound - not a downloaded asset of
 * uncertain licensing, not autoplay, and off unless the visitor explicitly
 * opts in via the panel's sound toggle. No sound plays until `play()` is
 * called while `enabled` is true, and every cue is a short, quiet layer
 * (peak gain <= 0.06) so it reads as texture, not notification spam.
 */
export function useCompanionSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    contextRef.current ??= new AudioCtx();
    return contextRef.current;
  }, []);

  const play = useCallback(
    (cue: Cue) => {
      if (!enabled) return;
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const tone = (
        frequency: number,
        start: number,
        duration: number,
        { type = "sine", gain = 0.05, glideTo }: { type?: OscillatorType; gain?: number; glideTo?: number } = {},
      ) => {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now + start);
        if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, now + start + duration);
        amp.gain.setValueAtTime(0.0001, now + start);
        amp.gain.exponentialRampToValueAtTime(gain, now + start + 0.015);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
        osc.connect(amp).connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.02);
      };

      // Band-passed noise with a sweeping centre frequency: a small motor.
      const servo = (duration: number, from: number, to: number) => {
        const length = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 8;
        filter.frequency.setValueAtTime(from, now);
        filter.frequency.exponentialRampToValueAtTime(to, now + duration);
        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0.0001, now);
        amp.gain.exponentialRampToValueAtTime(0.04, now + 0.04);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.connect(filter).connect(amp).connect(ctx.destination);
        source.start(now);
      };

      switch (cue) {
        case "activate":
          servo(0.35, 300, 1400);
          tone(523.25, 0.18, 0.18, { type: "triangle", gain: 0.045 });
          tone(783.99, 0.3, 0.32, { type: "triangle", gain: 0.05 });
          break;
        case "success":
          tone(659.25, 0, 0.14, { type: "triangle" });
          tone(987.77, 0.1, 0.26, { type: "triangle", gain: 0.055 });
          break;
        case "error":
          tone(220, 0, 0.22, { type: "square", gain: 0.025, glideTo: 160 });
          break;
        case "servo":
          servo(0.28, 500, 1800);
          break;
        case "think":
          for (let i = 0; i < 3; i++) tone(1320, i * 0.11, 0.04, { gain: 0.018 });
          break;
        case "message":
          tone(880, 0, 0.09, { gain: 0.03, glideTo: 1175 });
          break;
        case "listen":
          tone(587.33, 0, 0.1, { type: "triangle", gain: 0.035 });
          tone(880, 0.08, 0.14, { type: "triangle", gain: 0.035 });
          break;
      }
    },
    [enabled, getContext],
  );

  // Stable identity so callers can list `sound` as an effect dependency.
  return useMemo(() => ({ play }), [play]);
}
