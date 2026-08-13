"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

// Server/first-paint snapshot: reduced=true so nothing animates before the
// real client preference is known (avoids a flash of motion for
// reduced-motion users while hydration catches up).
function getServerSnapshot() {
  return true;
}

/**
 * Single source of truth for prefers-reduced-motion (spec §6, §14: every
 * animation-driving hook reads from here, not its own matchMedia call).
 * Uses useSyncExternalStore - the correct React API for subscribing to an
 * external mutable source like matchMedia - rather than effect+setState,
 * which triggers React's set-state-in-effect lint rule and causes an extra
 * cascading render.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
