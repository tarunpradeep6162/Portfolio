"use client";

import { useSyncExternalStore } from "react";

/**
 * Site-wide sound design (Phase 4). Everything is synthesized with WebAudio
 * - no audio files to download or license - and nothing makes a sound until
 * the visitor turns sound on (off by default, remembered per device).
 *
 *   ambient  - a low, slowly breathing drone (two detuned sines + filtered
 *              noise "air") that runs while sound is on
 *   tick     - a tiny glassy click on hover/press of interactive elements
 *   whoosh   - a filtered-noise sweep on route transitions and wipes
 *   servo    - a small motor for RC-01 movement and 3D camera moves
 *   impact   - a soft low thud for title cards and slates
 *
 * Peak gains stay <= 0.06 so it reads as texture, never notification spam.
 */
const STORAGE_KEY = "tp-sound";

type Listener = () => void;
const listeners = new Set<Listener>();
let enabled = false;
let loaded = false;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;
let noiseBuffer: AudioBuffer | null = null;

function readStored() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    enabled = false;
  }
}

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) {
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

function startAmbient() {
  const c = context();
  if (!c || !master || ambient) return;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 2.5);
  out.connect(master);

  const oscs = [55, 55.4, 82.4].map((f, i) => {
    const o = c.createOscillator();
    o.type = i === 2 ? "triangle" : "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = i === 2 ? 0.12 : 0.4;
    o.connect(g).connect(out);
    o.start();
    return o;
  });
  // Air: low-passed noise whose cutoff slowly breathes.
  const air = noise(c);
  air.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(lp.frequency);
  const airGain = c.createGain();
  airGain.gain.value = 0.18;
  air.connect(lp).connect(airGain).connect(out);
  air.start();
  lfo.start();

  ambient = {
    stop: () => {
      const t = c.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      window.setTimeout(() => {
        oscs.forEach((o) => o.stop());
        air.stop();
        lfo.stop();
        out.disconnect();
      }, 900);
    },
  };
}

function stopAmbient() {
  ambient?.stop();
  ambient = null;
}

export type SoundCue = "tick" | "whoosh" | "servo" | "impact";

export function playSound(cue: SoundCue) {
  readStored();
  if (!enabled) return;
  const c = context();
  if (!c || !master) return;
  const now = c.currentTime;
  const env = (g: GainNode, peak: number, attack: number, release: number) => {
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
  };

  if (cue === "tick") {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(2400, now);
    o.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
    const g = c.createGain();
    env(g, 0.02, 0.004, 0.05);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.08);
  } else if (cue === "whoosh" || cue === "servo") {
    const src = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = cue === "servo" ? 9 : 1.4;
    const dur = cue === "servo" ? 0.3 : 0.7;
    bp.frequency.setValueAtTime(cue === "servo" ? 500 : 180, now);
    bp.frequency.exponentialRampToValueAtTime(cue === "servo" ? 1800 : 2600, now + dur * 0.8);
    const g = c.createGain();
    env(g, cue === "servo" ? 0.035 : 0.06, dur * 0.35, dur * 0.65);
    src.connect(bp).connect(g).connect(master);
    src.start(now);
    src.stop(now + dur + 0.05);
  } else if (cue === "impact") {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(90, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.6);
    const g = c.createGain();
    env(g, 0.06, 0.01, 0.7);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 0.75);
  }
}

export function isSoundEnabled() {
  readStored();
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  readStored();
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // storage blocked: the choice still applies for this page view
  }
  if (next) {
    startAmbient();
    playSound("impact");
  } else stopAmbient();
  listeners.forEach((l) => l());
}

/**
 * Browsers only allow audio after a user gesture, so a remembered "on" is
 * resumed on the visitor's first interaction rather than at page load.
 */
export function resumeSoundOnGesture() {
  readStored();
  if (!enabled || ambient) return;
  startAmbient();
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, isSoundEnabled, () => false);
}
