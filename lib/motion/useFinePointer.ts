"use client";

import { useSyncExternalStore } from "react";

const query = "(hover: hover) and (pointer: fine)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

// No pointer-driven effects until the real capability is confirmed client-side.
function getServerSnapshot() {
  return false;
}

/**
 * True only for devices with a precise pointer and real hover support - the
 * gate for pointer-driven camera parallax and similar effects that would be
 * meaningless (or actively wrong) on touch/coarse-pointer devices.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
