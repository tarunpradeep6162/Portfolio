import { resolveQualityTier, type QualityTier } from "@/lib/companion/state";
import type { MotionPreference, WebGLCapability } from "@/lib/v6/types";

export interface SceneMountInputs {
  motion: MotionPreference;
  webglCapability: WebGLCapability;
  lowPowerMode: boolean;
}

export interface SceneMountDecision {
  shouldMount: boolean;
  qualityTier: QualityTier;
  reason: string;
}

/**
 * The single decision point for "should any V7 3D scene mount right now,
 * and at what quality" - pulled out of any component so it's a pure
 * function three different hosts (Operational Twin, and later any other
 * V7 canvas) can call identically instead of each re-deriving the same
 * three checks slightly differently.
 *
 * Deliberately conservative: reduced motion and unsupported/unknown WebGL
 * both refuse to mount rather than falling back to a degraded scene - the
 * spec's fallback tier still means "no WebGL canvas at all" (Section 11),
 * not "a cheaper canvas."
 */
export function decideSceneMount(inputs: SceneMountInputs): SceneMountDecision {
  if (inputs.motion === "reduced") {
    return {
      shouldMount: false,
      qualityTier: "fallback",
      reason: "reduced motion",
    };
  }

  if (inputs.webglCapability !== "supported") {
    return {
      shouldMount: false,
      qualityTier: "fallback",
      reason:
        inputs.webglCapability === "unknown"
          ? "WebGL capability not yet detected"
          : "WebGL unsupported",
    };
  }

  const qualityTier = resolveQualityTier(inputs.lowPowerMode);
  if (qualityTier === "fallback") {
    return {
      shouldMount: false,
      qualityTier,
      reason: "fallback quality tier (low-power mode or constrained device)",
    };
  }

  return { shouldMount: true, qualityTier, reason: "eligible" };
}
