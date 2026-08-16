/**
 * Pure-TypeScript reference implementation of the Mission Scenario
 * Engine (`docs/PORTFOLIO_V9_ARCHITECTURE.md` polyglot addendum, Phase
 * 8) - the exact same formulas as `crates/mission-simulator/src/*.rs`,
 * ported deliberately, not approximated, so a visitor without WASM
 * support (or with a reduced-data preference) sees equivalent results,
 * never a degraded or fabricated substitute. `lib/v9/missionEngine.ts`
 * is the only caller that decides when this runs instead of the
 * compiled engine.
 */
import type {
  CredentialCompromiseParams,
  CredentialCompromiseResult,
  DeploymentFailureParams,
  DeploymentFailureResult,
  RecoveryDecisionParams,
  RecoveryDecisionResult,
  ServiceDegradationParams,
  ServiceDegradationResult,
  TrafficSpikeParams,
  TrafficSpikeResult,
} from "@/lib/v9/missionEngineTypes";

export function simulateTrafficSpike(params: TrafficSpikeParams): TrafficSpikeResult {
  const demand = Math.max(params.baselineRps * params.spikeMultiplier, 0);
  const capacity = Math.max(params.instanceCapacityRps, 1);
  const peakUtilizationPct = Math.min((demand / capacity) * 100, 999);

  let droppedRequestPct: number;
  let timeToAbsorbS: number;

  if (!params.autoscalingEnabled) {
    const overflowRatio = Math.max(demand - capacity, 0) / Math.max(demand, 1);
    droppedRequestPct = overflowRatio * 100;
    timeToAbsorbS = Math.max(params.spikeDurationS, 0);
  } else {
    const ramp = Math.min(Math.max(params.scaleOutLatencyS, 0), Math.max(params.spikeDurationS, 0));
    const avgCapacityDuringRamp = capacity + Math.max(demand - capacity, 0) / 2;
    const avgShortfallRatio = Math.max(demand - avgCapacityDuringRamp, 0) / Math.max(demand, 1);
    const rampFraction = ramp / Math.max(params.spikeDurationS, 0.001);
    droppedRequestPct = avgShortfallRatio * rampFraction * 100;
    timeToAbsorbS = ramp;
  }

  const reliabilityDelta = -Math.min(droppedRequestPct / 10, 10);

  return { peakUtilizationPct, droppedRequestPct, timeToAbsorbS, reliabilityDelta };
}

export function simulateDeploymentFailure(params: DeploymentFailureParams): DeploymentFailureResult {
  const parity = Math.min(Math.max(params.environmentParityPct, 0), 100);
  const isolationBonus = params.agentIsolated ? 35 : 0;
  const diagnosisConfidencePct = Math.min(parity * 0.5 + isolationBonus, 100);

  const baseHours = 4;
  const retryPenalty = params.agentIsolated ? params.retryCount * 0.25 : params.retryCount * 1.5;
  const estimatedHoursToRootCause = Math.max(
    baseHours - diagnosisConfidencePct / 30 + retryPenalty,
    0.25,
  );

  const reliabilityDelta = diagnosisConfidencePct / 20 - estimatedHoursToRootCause / 4;

  return { diagnosisConfidencePct, estimatedHoursToRootCause, reliabilityDelta };
}

export function simulateServiceDegradation(params: ServiceDegradationParams): ServiceDegradationResult {
  const utilization = Math.min(Math.max(params.connectionPoolUtilizationPct, 0), 99) / 100;
  const amplification = 1 / Math.max(1 - utilization, 0.01);
  const projectedLatencyMs = Math.max(params.baselineLatencyMs, 0) * amplification;
  const databaseIsLikelyCause = utilization > 0.7;
  const reliabilityDelta = params.diagnosedBeforeActing ? 5 : -3;

  return { projectedLatencyMs, databaseIsLikelyCause, reliabilityDelta };
}

export function simulateCredentialCompromise(
  params: CredentialCompromiseParams,
): CredentialCompromiseResult {
  const level = Math.min(Math.max(params.privilegeLevel, 1), 3);
  const baseBlastRadius = level * 30;

  const rotationFactor = params.rotated ? 0.3 : 1;
  const blastRadiusScore = Math.min(baseBlastRadius * rotationFactor, 100);

  const residualExposureScore = params.rescopedToLeastPrivilege
    ? (level - 1) * 5
    : baseBlastRadius * 0.8;

  const reliabilityDelta = -(residualExposureScore / 15);

  return { blastRadiusScore, residualExposureScore, reliabilityDelta };
}

export function simulateRecoveryDecision(params: RecoveryDecisionParams): RecoveryDecisionResult {
  const pressure = Math.min(Math.max(params.timePressureLevel, 1), 3);

  let estimatedMinutesToRestore: number;
  let secondIncidentRiskPct: number;

  if (params.choseRollbackFirst && params.rollbackAvailable) {
    estimatedMinutesToRestore = 10;
    secondIncidentRiskPct = 5;
  } else {
    const confidence = Math.min(Math.max(params.forwardFixConfidencePct, 0), 100) / 100;
    estimatedMinutesToRestore = 20 + (1 - confidence) * 60 * pressure / 2;
    secondIncidentRiskPct = Math.min((1 - confidence) * pressure * 15, 95);
  }

  const reliabilityDelta = 10 - estimatedMinutesToRestore / 10 - secondIncidentRiskPct / 10;

  return { estimatedMinutesToRestore, secondIncidentRiskPct, reliabilityDelta };
}

const BASELINE_SCORE = 70;

export function combinedReliabilityScore(deltas: readonly [number, number, number, number, number]): number {
  const averageDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  return Math.min(Math.max(BASELINE_SCORE + averageDelta, 0), 100);
}
