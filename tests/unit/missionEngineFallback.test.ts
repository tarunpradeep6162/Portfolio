import { describe, it, expect } from "vitest";
import {
  combinedReliabilityScore,
  simulateCredentialCompromise,
  simulateDeploymentFailure,
  simulateRecoveryDecision,
  simulateServiceDegradation,
  simulateTrafficSpike,
} from "@/lib/v9/missionEngineFallback";
import { runEngineForChoice } from "@/lib/v9/missionEngineParams";
import { scenarios } from "@/content/v9/scenarios";

/**
 * The pure-TS reference implementation
 * (docs/PORTFOLIO_V9_ARCHITECTURE.md polyglot addendum, Phase 8) must be
 * a genuine equivalent of crates/mission-simulator's Rust formulas, not
 * an approximation - a visitor without WASM support gets the same
 * numbers, not a degraded substitute. These mirror the exact expected
 * values crates/mission-simulator/src/*.rs's own unit tests assert
 * against the same inputs.
 */
describe("Mission Scenario Engine - TypeScript fallback", () => {
  it("traffic spike: is deterministic and matches the expected capacity model", () => {
    const params = {
      baselineRps: 100,
      spikeMultiplier: 5,
      instanceCapacityRps: 150,
      autoscalingEnabled: true,
      scaleOutLatencyS: 60,
      spikeDurationS: 300,
    };
    const a = simulateTrafficSpike(params);
    const b = simulateTrafficSpike(params);
    expect(a).toEqual(b);
    expect(a.peakUtilizationPct).toBeCloseTo((100 * 5) / 150 * 100, 5);
  });

  it("traffic spike: autoscaling drops fewer requests than fixed capacity for the same spike", () => {
    const base = {
      baselineRps: 100,
      spikeMultiplier: 5,
      instanceCapacityRps: 150,
      scaleOutLatencyS: 60,
      spikeDurationS: 300,
    };
    const fixed = simulateTrafficSpike({ ...base, autoscalingEnabled: false });
    const autoscaled = simulateTrafficSpike({ ...base, autoscalingEnabled: true });
    expect(fixed.droppedRequestPct).toBeGreaterThan(autoscaled.droppedRequestPct);
  });

  it("deployment failure: isolating the agent increases diagnosis confidence for equal parity", () => {
    const isolated = simulateDeploymentFailure({
      environmentParityPct: 60,
      agentIsolated: true,
      retryCount: 1,
    });
    const coupled = simulateDeploymentFailure({
      environmentParityPct: 60,
      agentIsolated: false,
      retryCount: 1,
    });
    expect(isolated.diagnosisConfidencePct).toBeGreaterThan(coupled.diagnosisConfidencePct);
  });

  it("service degradation: latency amplifies as utilization rises, and flags the database only above 70%", () => {
    const low = simulateServiceDegradation({
      baselineLatencyMs: 20,
      connectionPoolUtilizationPct: 50,
      diagnosedBeforeActing: true,
    });
    const high = simulateServiceDegradation({
      baselineLatencyMs: 20,
      connectionPoolUtilizationPct: 90,
      diagnosedBeforeActing: true,
    });
    expect(high.projectedLatencyMs).toBeGreaterThan(low.projectedLatencyMs);
    expect(low.databaseIsLikelyCause).toBe(false);
    expect(high.databaseIsLikelyCause).toBe(true);
  });

  it("credential compromise: rotation alone reduces blast radius but not residual exposure", () => {
    const unrotated = simulateCredentialCompromise({
      privilegeLevel: 3,
      rotated: false,
      rescopedToLeastPrivilege: false,
    });
    const rotated = simulateCredentialCompromise({
      privilegeLevel: 3,
      rotated: true,
      rescopedToLeastPrivilege: false,
    });
    expect(rotated.blastRadiusScore).toBeLessThan(unrotated.blastRadiusScore);
    expect(rotated.residualExposureScore).toBe(unrotated.residualExposureScore);
  });

  it("recovery decision: rollback-first restores faster and with lower second-incident risk", () => {
    const forward = simulateRecoveryDecision({
      rollbackAvailable: true,
      forwardFixConfidencePct: 50,
      timePressureLevel: 3,
      choseRollbackFirst: false,
    });
    const rollback = simulateRecoveryDecision({
      rollbackAvailable: true,
      forwardFixConfidencePct: 50,
      timePressureLevel: 3,
      choseRollbackFirst: true,
    });
    expect(rollback.estimatedMinutesToRestore).toBeLessThan(forward.estimatedMinutesToRestore);
    expect(rollback.secondIncidentRiskPct).toBeLessThan(forward.secondIncidentRiskPct);
  });

  it("combined reliability score: all-zero deltas return exactly the documented baseline (70)", () => {
    expect(combinedReliabilityScore([0, 0, 0, 0, 0])).toBe(70);
  });

  it("combined reliability score: clamps to the 0-100 range", () => {
    expect(combinedReliabilityScore([1000, 1000, 1000, 1000, 1000])).toBe(100);
    expect(combinedReliabilityScore([-1000, -1000, -1000, -1000, -1000])).toBe(0);
  });
});

describe("Mission Scenario Engine - scenario/choice parameter mapping", () => {
  it("has a mapping for every real scenario slug in content/v9/scenarios.ts", async () => {
    for (const scenario of scenarios) {
      const summary = await runEngineForChoice(scenario.slug, scenario.choices[0].id);
      expect(summary, `no engine mapping for scenario "${scenario.slug}"`).not.toBeNull();
    }
  });

  it("every real choice in every real scenario produces a finite, well-formed result", async () => {
    for (const scenario of scenarios) {
      for (const choice of scenario.choices) {
        const summary = await runEngineForChoice(scenario.slug, choice.id);
        expect(summary).not.toBeNull();
        expect(summary!.fields.length).toBeGreaterThan(0);
        expect(Number.isFinite(summary!.reliabilityDelta)).toBe(true);
      }
    }
  });
});
