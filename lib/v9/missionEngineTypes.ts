/**
 * Shared result shapes for the Mission Scenario Engine
 * (`docs/PORTFOLIO_V9_ARCHITECTURE.md` polyglot addendum, Phase 8). Both
 * the compiled WASM engine (`lib/v9/wasmOwnership.ts`) and the pure-TS
 * fallback (`lib/v9/missionEngineFallback.ts`) produce these exact
 * shapes, so `lib/v9/missionEngine.ts` and the UI never need to know
 * which one actually ran.
 */

export type EngineSource = "wasm" | "fallback";

export interface TrafficSpikeParams {
  baselineRps: number;
  spikeMultiplier: number;
  instanceCapacityRps: number;
  autoscalingEnabled: boolean;
  scaleOutLatencyS: number;
  spikeDurationS: number;
}

export interface TrafficSpikeResult {
  peakUtilizationPct: number;
  droppedRequestPct: number;
  timeToAbsorbS: number;
  reliabilityDelta: number;
}

export interface DeploymentFailureParams {
  environmentParityPct: number;
  agentIsolated: boolean;
  retryCount: number;
}

export interface DeploymentFailureResult {
  diagnosisConfidencePct: number;
  estimatedHoursToRootCause: number;
  reliabilityDelta: number;
}

export interface ServiceDegradationParams {
  baselineLatencyMs: number;
  connectionPoolUtilizationPct: number;
  diagnosedBeforeActing: boolean;
}

export interface ServiceDegradationResult {
  projectedLatencyMs: number;
  databaseIsLikelyCause: boolean;
  reliabilityDelta: number;
}

export interface CredentialCompromiseParams {
  privilegeLevel: number;
  rotated: boolean;
  rescopedToLeastPrivilege: boolean;
}

export interface CredentialCompromiseResult {
  blastRadiusScore: number;
  residualExposureScore: number;
  reliabilityDelta: number;
}

export interface RecoveryDecisionParams {
  rollbackAvailable: boolean;
  forwardFixConfidencePct: number;
  timePressureLevel: number;
  choseRollbackFirst: boolean;
}

export interface RecoveryDecisionResult {
  estimatedMinutesToRestore: number;
  secondIncidentRiskPct: number;
  reliabilityDelta: number;
}
