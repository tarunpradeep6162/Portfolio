import { describe, it, expect, afterEach, vi } from "vitest";
import { decideSceneMount } from "@/lib/v7/sceneDirector";

describe("decideSceneMount", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses to mount when motion is reduced, regardless of WebGL/power", () => {
    const decision = decideSceneMount({
      motion: "reduced",
      webglCapability: "supported",
      lowPowerMode: false,
    });
    expect(decision.shouldMount).toBe(false);
    expect(decision.qualityTier).toBe("fallback");
    expect(decision.reason).toContain("reduced motion");
  });

  it("refuses to mount when WebGL capability is unknown (not yet detected)", () => {
    const decision = decideSceneMount({
      motion: "full",
      webglCapability: "unknown",
      lowPowerMode: false,
    });
    expect(decision.shouldMount).toBe(false);
    expect(decision.reason).toContain("not yet detected");
  });

  it("refuses to mount when WebGL is unsupported", () => {
    const decision = decideSceneMount({
      motion: "full",
      webglCapability: "unsupported",
      lowPowerMode: false,
    });
    expect(decision.shouldMount).toBe(false);
    expect(decision.reason).toContain("WebGL unsupported");
  });

  it("refuses to mount when low-power mode forces the fallback tier", () => {
    const decision = decideSceneMount({
      motion: "full",
      webglCapability: "supported",
      lowPowerMode: true,
    });
    expect(decision.shouldMount).toBe(false);
    expect(decision.qualityTier).toBe("fallback");
    expect(decision.reason).toContain("fallback quality tier");
  });

  it("mounts at a non-fallback tier when motion is full, WebGL is supported, and power is standard", () => {
    // navigator.hardwareConcurrency/deviceMemory are whatever jsdom reports
    // by default here - the point of this test is only that a genuinely
    // eligible combination of inputs is not refused, not which exact
    // non-fallback tier resolveQualityTier's device heuristic picks.
    const decision = decideSceneMount({
      motion: "full",
      webglCapability: "supported",
      lowPowerMode: false,
    });
    expect(decision.shouldMount).toBe(true);
    expect(["high", "balanced"]).toContain(decision.qualityTier);
    expect(decision.reason).toBe("eligible");
  });
});
