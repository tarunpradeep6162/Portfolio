/**
 * Public API the Scenario Simulator calls into
 * (`docs/PORTFOLIO_V9_ARCHITECTURE.md` polyglot addendum, Phase 8).
 * Every function here tries the compiled WASM engine first
 * (`lib/v9/wasmOwnership.ts`, loaded only on this first call, per the
 * intent-loading contract) and falls back to the pure-TS reference
 * implementation (`lib/v9/missionEngineFallback.ts`) if WASM is
 * unavailable or fails to load - the caller always gets a result, and
 * always knows which engine actually produced it via `source`.
 */
import { loadMissionEngineWasm } from "@/lib/v9/wasmOwnership";
import * as fallback from "@/lib/v9/missionEngineFallback";
import type {
  CredentialCompromiseParams,
  CredentialCompromiseResult,
  DeploymentFailureParams,
  DeploymentFailureResult,
  EngineSource,
  RecoveryDecisionParams,
  RecoveryDecisionResult,
  ServiceDegradationParams,
  ServiceDegradationResult,
  TrafficSpikeParams,
  TrafficSpikeResult,
} from "@/lib/v9/missionEngineTypes";

export interface EngineRunResult<T> {
  result: T;
  source: EngineSource;
}

async function tryWasm<T>(run: (mod: Awaited<ReturnType<typeof loadMissionEngineWasm>>) => T): Promise<T | null> {
  try {
    const mod = await loadMissionEngineWasm();
    return run(mod);
  } catch {
    // WASM unsupported, blocked, or failed to fetch/instantiate - the
    // caller falls back to the TS reference implementation below. This is
    // an expected, handled path, not an error state to surface.
    return null;
  }
}

export async function runTrafficSpike(params: TrafficSpikeParams): Promise<EngineRunResult<TrafficSpikeResult>> {
  const wasmResult = await tryWasm((mod) => {
    const output = mod.simulate_traffic_spike(
      params.baselineRps,
      params.spikeMultiplier,
      params.instanceCapacityRps,
      params.autoscalingEnabled,
      params.scaleOutLatencyS,
      params.spikeDurationS,
    );
    try {
      return {
        peakUtilizationPct: output.peak_utilization_pct,
        droppedRequestPct: output.dropped_request_pct,
        timeToAbsorbS: output.time_to_absorb_s,
        reliabilityDelta: output.reliability_delta,
      };
    } finally {
      output.free();
    }
  });
  if (wasmResult) return { result: wasmResult, source: "wasm" };
  return { result: fallback.simulateTrafficSpike(params), source: "fallback" };
}

export async function runDeploymentFailure(
  params: DeploymentFailureParams,
): Promise<EngineRunResult<DeploymentFailureResult>> {
  const wasmResult = await tryWasm((mod) => {
    const output = mod.simulate_deployment_failure(
      params.environmentParityPct,
      params.agentIsolated,
      params.retryCount,
    );
    try {
      return {
        diagnosisConfidencePct: output.diagnosis_confidence_pct,
        estimatedHoursToRootCause: output.estimated_hours_to_root_cause,
        reliabilityDelta: output.reliability_delta,
      };
    } finally {
      output.free();
    }
  });
  if (wasmResult) return { result: wasmResult, source: "wasm" };
  return { result: fallback.simulateDeploymentFailure(params), source: "fallback" };
}

export async function runServiceDegradation(
  params: ServiceDegradationParams,
): Promise<EngineRunResult<ServiceDegradationResult>> {
  const wasmResult = await tryWasm((mod) => {
    const output = mod.simulate_service_degradation(
      params.baselineLatencyMs,
      params.connectionPoolUtilizationPct,
      params.diagnosedBeforeActing,
    );
    try {
      return {
        projectedLatencyMs: output.projected_latency_ms,
        databaseIsLikelyCause: output.database_is_likely_cause,
        reliabilityDelta: output.reliability_delta,
      };
    } finally {
      output.free();
    }
  });
  if (wasmResult) return { result: wasmResult, source: "wasm" };
  return { result: fallback.simulateServiceDegradation(params), source: "fallback" };
}

export async function runCredentialCompromise(
  params: CredentialCompromiseParams,
): Promise<EngineRunResult<CredentialCompromiseResult>> {
  const wasmResult = await tryWasm((mod) => {
    const output = mod.simulate_credential_compromise(
      params.privilegeLevel,
      params.rotated,
      params.rescopedToLeastPrivilege,
    );
    try {
      return {
        blastRadiusScore: output.blast_radius_score,
        residualExposureScore: output.residual_exposure_score,
        reliabilityDelta: output.reliability_delta,
      };
    } finally {
      output.free();
    }
  });
  if (wasmResult) return { result: wasmResult, source: "wasm" };
  return { result: fallback.simulateCredentialCompromise(params), source: "fallback" };
}

export async function runRecoveryDecision(
  params: RecoveryDecisionParams,
): Promise<EngineRunResult<RecoveryDecisionResult>> {
  const wasmResult = await tryWasm((mod) => {
    const output = mod.simulate_recovery_decision(
      params.rollbackAvailable,
      params.forwardFixConfidencePct,
      params.timePressureLevel,
      params.choseRollbackFirst,
    );
    try {
      return {
        estimatedMinutesToRestore: output.estimated_minutes_to_restore,
        secondIncidentRiskPct: output.second_incident_risk_pct,
        reliabilityDelta: output.reliability_delta,
      };
    } finally {
      output.free();
    }
  });
  if (wasmResult) return { result: wasmResult, source: "wasm" };
  return { result: fallback.simulateRecoveryDecision(params), source: "fallback" };
}

export async function runCombinedReliabilityScore(
  deltas: readonly [number, number, number, number, number],
): Promise<EngineRunResult<number>> {
  const wasmResult = await tryWasm((mod) =>
    mod.combined_reliability_score(deltas[0], deltas[1], deltas[2], deltas[3], deltas[4]),
  );
  if (wasmResult !== null) return { result: wasmResult, source: "wasm" };
  return { result: fallback.combinedReliabilityScore(deltas), source: "fallback" };
}

/** Real engine build version for UI attribution, or null if WASM never loaded. */
export async function getEngineVersion(): Promise<string | null> {
  const version = await tryWasm((mod) => mod.engine_version());
  return version;
}
