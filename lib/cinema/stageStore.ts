"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared state for the persistent cinema stage (components/cinema).
 * Mirrored onto <html data-cinema="..."> so CSS can open "windows" in dark
 * sections only while the 3D stage is actually live behind them.
 */
export type StageStatus = "off" | "loading" | "live" | "paused";
/**
 * Adaptive quality level: 0 = full (bloom + grade), 1 = no bloom,
 * 2 = no post + lower resolution, 3 = too slow - stage switched off.
 */
export type StageQuality = 0 | 1 | 2 | 3;

interface StageSnapshot {
  status: StageStatus;
  quality: StageQuality;
}

let snapshot: StageSnapshot = { status: "off", quality: 0 };
const listeners = new Set<() => void>();

function publish(next: Partial<StageSnapshot>) {
  snapshot = { ...snapshot, ...next };
  if (typeof document !== "undefined") {
    document.documentElement.dataset.cinema = snapshot.status;
    document.documentElement.dataset.cinemaQuality = String(snapshot.quality);
  }
  listeners.forEach((l) => l());
}

export function setStageStatus(status: StageStatus) {
  if (snapshot.status !== status) publish({ status });
}

export function setStageQuality(quality: StageQuality) {
  if (snapshot.quality !== quality) publish({ quality });
}

export function getStageSnapshot() {
  return snapshot;
}

const serverSnapshot: StageSnapshot = { status: "off", quality: 0 };

export function useStage() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => snapshot,
    () => serverSnapshot,
  );
}

/**
 * Scroll-driven story state shared between DOM sequences and the 3D stage:
 * the Reliability Spine's simulated release writes its progress here, and
 * the stage's light column reads it every frame. A plain mutable object -
 * it changes every scroll frame, which must not re-render React.
 */
export const storyState = {
  /** 0..1 progress of the simulated release down the spine. */
  spineProgress: 0,
  /** Stage index (0-7) currently raising an alert, or -1. */
  spineAlert: -1,
  /** Timestamp (ms) of the last route transition, for the camera whip. */
  transitionAt: 0,
};

/** Local-time lighting mood (Phase 18). */
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

export const MOODS: Record<TimeOfDay, { key: string; rim: string; fog: string; exposure: number; label: string }> = {
  dawn: { key: "#ffd9b8", rim: "#ff8a5c", fog: "#120d10", exposure: 1.0, label: "Dawn light" },
  day: { key: "#f4f7ff", rim: "#748cff", fog: "#0a1016", exposure: 1.05, label: "Daylight" },
  dusk: { key: "#ffc4a1", rim: "#b06cff", fog: "#110b16", exposure: 0.98, label: "Dusk" },
  night: { key: "#c9d6ff", rim: "#748cff", fog: "#06090d", exposure: 0.92, label: "Night shift" },
};
