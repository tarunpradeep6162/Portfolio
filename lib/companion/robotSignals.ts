import type { Gesture } from "@/lib/rc01/actions";

/**
 * A tiny mutable signal bus between the DOM world (speech, chat, scroll,
 * page actions) and RC-01's render loop. The 3D model reads these values
 * inside `useFrame` every frame, so writing them never triggers a React
 * render - the right trade-off for 60fps body language driven by events
 * that fire dozens of times a second (word boundaries, scroll deltas).
 *
 * Module-level state is intentional: there is at most one RC-01 on the page
 * (enforced by the V6 activeScene invariant).
 */
interface Signals {
  /** 0..1, decays every frame; bumped on each spoken word. */
  voiceEnergy: number;
  speaking: boolean;
  /** Where to look, in -1..1 head space, and until when (ms timestamp). */
  gaze: { x: number; y: number; until: number };
  gesture: { name: Gesture; startedAt: number } | null;
  flinchAt: number;
  /** 0..1 lean toward the viewer while they're reading attentively. */
  attention: number;
}

export const robotSignals: Signals = {
  voiceEnergy: 0,
  speaking: false,
  gaze: { x: 0, y: 0, until: 0 },
  gesture: null,
  flinchAt: 0,
  attention: 0,
};

export function pulseVoice(strength = 1) {
  robotSignals.voiceEnergy = Math.min(1, robotSignals.voiceEnergy + 0.55 * strength);
}

export function setSpeaking(speaking: boolean) {
  robotSignals.speaking = speaking;
}

export function playGesture(name: Gesture) {
  robotSignals.gesture = { name, startedAt: performance.now() };
}

export function flinch() {
  robotSignals.flinchAt = performance.now();
}

export function setAttention(value: number) {
  robotSignals.attention = Math.max(0, Math.min(1, value));
}

/**
 * Turns RC-01's head toward a DOM element for a while. The robot lives in a
 * docked panel, so "toward" is the direction from the panel's centre to the
 * element's centre, normalised against the viewport.
 */
export function lookAtElement(element: Element | null, panel: Element | null, durationMs = 2600) {
  if (!element || !panel) return;
  const target = element.getBoundingClientRect();
  const origin = panel.getBoundingClientRect();
  const dx = target.left + target.width / 2 - (origin.left + origin.width / 2);
  const dy = target.top + target.height / 2 - (origin.top + origin.height / 4);
  robotSignals.gaze = {
    x: Math.max(-1, Math.min(1, dx / (window.innerWidth / 2))),
    // Screen y grows downward; head pitch "up" is positive.
    y: Math.max(-1, Math.min(1, -dy / (window.innerHeight / 2))),
    until: performance.now() + durationMs,
  };
}

/** Gesture keyframe duration in ms - shared by the model and tests. */
export const GESTURE_DURATION_MS: Record<Gesture, number> = {
  wave: 1600,
  nod: 900,
  point: 1800,
  shrug: 1100,
  celebrate: 1300,
};
