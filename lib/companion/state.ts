export type CompanionState =
  | "boot"
  | "idle"
  | "greeting"
  | "pointing"
  | "briefing"
  | "thinking"
  | "success"
  | "error"
  | "sleep";

export type QualityTier = "high" | "balanced" | "fallback";

export interface QualitySettings {
  dpr: [number, number];
  antialias: boolean;
  fullEmissiveDetail: boolean;
}

export const qualityPresets: Record<QualityTier, QualitySettings> = {
  high: { dpr: [1, 1.5], antialias: true, fullEmissiveDetail: true },
  balanced: { dpr: [1, 1], antialias: true, fullEmissiveDetail: true },
  fallback: { dpr: [1, 1], antialias: false, fullEmissiveDetail: false },
};

/**
 * Manual low-power toggle always wins. Otherwise a coarse, honest heuristic
 * from navigator hints - not a benchmark, just a tier pick.
 */
export function resolveQualityTier(lowPowerMode: boolean): QualityTier {
  if (lowPowerMode) return "fallback";
  if (typeof navigator === "undefined") return "balanced";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;

  if (cores <= 2 || (memory !== undefined && memory <= 2)) return "fallback";
  if (cores >= 8 && (memory === undefined || memory >= 8)) return "high";
  return "balanced";
}
