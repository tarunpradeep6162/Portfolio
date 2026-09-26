/**
 * The cinema cue bus: a tiny typed pub/sub that lets any part of the site
 * "call a shot" without importing the component that performs it. RC-01's
 * tours use it for director mode; chapter slates use it for letterbox bars;
 * route changes use it for the transition whoosh.
 *
 * Deliberately not React state: cues are momentary events, and listeners
 * (the stage's camera, the letterbox, the sound engine) live in different
 * trees. Everything is a no-op on the server.
 */
export type CinemaCue =
  | { type: "letterbox"; on: boolean; source: string }
  | { type: "director"; on: boolean; label?: string }
  | { type: "focus"; section: string | null }
  | { type: "slate"; label: string }
  | { type: "transition" };

type Listener = (cue: CinemaCue) => void;
const listeners = new Set<Listener>();

export function emitCue(cue: CinemaCue) {
  for (const listener of [...listeners]) listener(cue);
}

export function onCue(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
