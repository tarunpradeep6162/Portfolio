/**
 * Maps a Scenario Simulator choice
 * (`content/v9/scenarios.ts`) onto the specific Mission Scenario Engine
 * call and parameters for its category (`docs/PORTFOLIO_V9_ARCHITECTURE.md`
 * polyglot addendum, Phase 8). Baseline parameters below are documented,
 * illustrative constants for this teaching simulation - not measurements
 * of any real system. Only the field(s) a given choice actually
 * represents vary between choices in the same scenario, so what a
 * visitor sees is the isolated, computed effect of the decision itself,
 * not an arbitrary number.
 */
import {
  runCredentialCompromise,
  runDeploymentFailure,
  runRecoveryDecision,
  runServiceDegradation,
  runTrafficSpike,
} from "@/lib/v9/missionEngine";
import type { EngineSource } from "@/lib/v9/missionEngineTypes";

export interface EngineField {
  label: string;
  value: string;
}

export interface EngineRunSummary {
  fields: EngineField[];
  reliabilityDelta: number;
  source: EngineSource;
}

export async function runEngineForChoice(
  scenarioSlug: string,
  choiceId: string,
): Promise<EngineRunSummary | null> {
  switch (scenarioSlug) {
    case "traffic-spike": {
      const autoscalingEnabled = choiceId === "auto-scaling";
      const instanceCapacityRps = choiceId === "manual-instances" ? 320 : 150;
      const { result, source } = await runTrafficSpike({
        baselineRps: 100,
        spikeMultiplier: 5,
        instanceCapacityRps,
        autoscalingEnabled,
        scaleOutLatencyS: 60,
        spikeDurationS: 300,
      });
      return {
        source,
        reliabilityDelta: result.reliabilityDelta,
        fields: [
          { label: "Peak utilization", value: `${result.peakUtilizationPct.toFixed(0)}%` },
          { label: "Dropped requests", value: `${result.droppedRequestPct.toFixed(1)}%` },
          { label: "Time to absorb", value: `${result.timeToAbsorbS.toFixed(0)}s` },
        ],
      };
    }
    case "deployment-failure": {
      const agentIsolated = choiceId === "isolate-agent";
      const retryCount = choiceId === "push-again" ? 3 : 1;
      const { result, source } = await runDeploymentFailure({
        environmentParityPct: 60,
        agentIsolated,
        retryCount,
      });
      return {
        source,
        reliabilityDelta: result.reliabilityDelta,
        fields: [
          { label: "Diagnosis confidence", value: `${result.diagnosisConfidencePct.toFixed(0)}%` },
          { label: "Est. hours to root cause", value: result.estimatedHoursToRootCause.toFixed(1) },
        ],
      };
    }
    case "compromised-credentials": {
      const rotated = choiceId !== "ignore";
      const rescopedToLeastPrivilege = choiceId === "least-privilege";
      const { result, source } = await runCredentialCompromise({
        privilegeLevel: 3,
        rotated,
        rescopedToLeastPrivilege,
      });
      return {
        source,
        reliabilityDelta: result.reliabilityDelta,
        fields: [
          { label: "Blast radius", value: `${result.blastRadiusScore.toFixed(0)} / 100` },
          { label: "Residual exposure", value: `${result.residualExposureScore.toFixed(0)} / 100` },
        ],
      };
    }
    case "database-latency": {
      const diagnosedBeforeActing = choiceId === "check-metrics-first";
      const connectionPoolUtilizationPct = choiceId === "add-cache-blind" ? 85 : 82;
      const { result, source } = await runServiceDegradation({
        baselineLatencyMs: 20,
        connectionPoolUtilizationPct,
        diagnosedBeforeActing,
      });
      return {
        source,
        reliabilityDelta: result.reliabilityDelta,
        fields: [
          { label: "Projected latency", value: `${result.projectedLatencyMs.toFixed(0)}ms` },
          { label: "Database is likely cause", value: result.databaseIsLikelyCause ? "Yes" : "No" },
        ],
      };
    }
    case "recovery-decision": {
      const choseRollbackFirst = choiceId === "rollback-first";
      const forwardFixConfidencePct = choiceId === "forward-fix" ? 55 : 30;
      const { result, source } = await runRecoveryDecision({
        rollbackAvailable: true,
        forwardFixConfidencePct,
        timePressureLevel: 3,
        choseRollbackFirst,
      });
      return {
        source,
        reliabilityDelta: result.reliabilityDelta,
        fields: [
          { label: "Est. minutes to restore", value: result.estimatedMinutesToRestore.toFixed(0) },
          { label: "Second-incident risk", value: `${result.secondIncidentRiskPct.toFixed(0)}%` },
        ],
      };
    }
    default:
      return null;
  }
}
