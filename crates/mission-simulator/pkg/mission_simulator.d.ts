/* tslint:disable */
/* eslint-disable */

export class CredentialCompromiseOutput {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    blast_radius_score: number;
    reliability_delta: number;
    residual_exposure_score: number;
}

export class DeploymentFailureOutput {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    diagnosis_confidence_pct: number;
    estimated_hours_to_root_cause: number;
    reliability_delta: number;
}

export class RecoveryDecisionOutput {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    estimated_minutes_to_restore: number;
    reliability_delta: number;
    second_incident_risk_pct: number;
}

export class ServiceDegradationOutput {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    database_is_likely_cause: boolean;
    projected_latency_ms: number;
    reliability_delta: number;
}

export class TrafficSpikeOutput {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    dropped_request_pct: number;
    peak_utilization_pct: number;
    reliability_delta: number;
    time_to_absorb_s: number;
}

export function combined_reliability_score(traffic_spike_delta: number, deployment_failure_delta: number, service_degradation_delta: number, credential_compromise_delta: number, recovery_decision_delta: number): number;

/**
 * Real crate version, surfaced to the UI so any displayed result can be
 * attributed to a specific, verifiable build - never asserted separately
 * from what actually shipped.
 */
export function engine_version(): string;

export function simulate_credential_compromise(privilege_level: number, rotated: boolean, rescoped_to_least_privilege: boolean): CredentialCompromiseOutput;

export function simulate_deployment_failure(environment_parity_pct: number, agent_isolated: boolean, retry_count: number): DeploymentFailureOutput;

export function simulate_recovery_decision(rollback_available: boolean, forward_fix_confidence_pct: number, time_pressure_level: number, chose_rollback_first: boolean): RecoveryDecisionOutput;

export function simulate_service_degradation(baseline_latency_ms: number, connection_pool_utilization_pct: number, diagnosed_before_acting: boolean): ServiceDegradationOutput;

export function simulate_traffic_spike(baseline_rps: number, spike_multiplier: number, instance_capacity_rps: number, autoscaling_enabled: boolean, scale_out_latency_s: number, spike_duration_s: number): TrafficSpikeOutput;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_credentialcompromiseoutput_free: (a: number, b: number) => void;
    readonly __wbg_get_credentialcompromiseoutput_blast_radius_score: (a: number) => number;
    readonly __wbg_get_credentialcompromiseoutput_reliability_delta: (a: number) => number;
    readonly __wbg_get_credentialcompromiseoutput_residual_exposure_score: (a: number) => number;
    readonly __wbg_get_servicedegradationoutput_database_is_likely_cause: (a: number) => number;
    readonly __wbg_get_trafficspikeoutput_reliability_delta: (a: number) => number;
    readonly __wbg_set_credentialcompromiseoutput_blast_radius_score: (a: number, b: number) => void;
    readonly __wbg_set_credentialcompromiseoutput_reliability_delta: (a: number, b: number) => void;
    readonly __wbg_set_credentialcompromiseoutput_residual_exposure_score: (a: number, b: number) => void;
    readonly __wbg_set_servicedegradationoutput_database_is_likely_cause: (a: number, b: number) => void;
    readonly __wbg_set_trafficspikeoutput_reliability_delta: (a: number, b: number) => void;
    readonly __wbg_trafficspikeoutput_free: (a: number, b: number) => void;
    readonly combined_reliability_score: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly engine_version: (a: number) => void;
    readonly simulate_credential_compromise: (a: number, b: number, c: number) => number;
    readonly simulate_deployment_failure: (a: number, b: number, c: number) => number;
    readonly simulate_recovery_decision: (a: number, b: number, c: number, d: number) => number;
    readonly simulate_service_degradation: (a: number, b: number, c: number) => number;
    readonly simulate_traffic_spike: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly __wbg_get_deploymentfailureoutput_estimated_hours_to_root_cause: (a: number) => number;
    readonly __wbg_get_deploymentfailureoutput_reliability_delta: (a: number) => number;
    readonly __wbg_get_recoverydecisionoutput_reliability_delta: (a: number) => number;
    readonly __wbg_get_recoverydecisionoutput_second_incident_risk_pct: (a: number) => number;
    readonly __wbg_get_servicedegradationoutput_reliability_delta: (a: number) => number;
    readonly __wbg_get_trafficspikeoutput_dropped_request_pct: (a: number) => number;
    readonly __wbg_get_trafficspikeoutput_time_to_absorb_s: (a: number) => number;
    readonly __wbg_get_recoverydecisionoutput_estimated_minutes_to_restore: (a: number) => number;
    readonly __wbg_get_deploymentfailureoutput_diagnosis_confidence_pct: (a: number) => number;
    readonly __wbg_get_trafficspikeoutput_peak_utilization_pct: (a: number) => number;
    readonly __wbg_set_recoverydecisionoutput_second_incident_risk_pct: (a: number, b: number) => void;
    readonly __wbg_set_recoverydecisionoutput_reliability_delta: (a: number, b: number) => void;
    readonly __wbg_set_recoverydecisionoutput_estimated_minutes_to_restore: (a: number, b: number) => void;
    readonly __wbg_set_deploymentfailureoutput_reliability_delta: (a: number, b: number) => void;
    readonly __wbg_set_deploymentfailureoutput_estimated_hours_to_root_cause: (a: number, b: number) => void;
    readonly __wbg_set_deploymentfailureoutput_diagnosis_confidence_pct: (a: number, b: number) => void;
    readonly __wbg_set_servicedegradationoutput_reliability_delta: (a: number, b: number) => void;
    readonly __wbg_set_servicedegradationoutput_projected_latency_ms: (a: number, b: number) => void;
    readonly __wbg_get_servicedegradationoutput_projected_latency_ms: (a: number) => number;
    readonly __wbg_set_trafficspikeoutput_time_to_absorb_s: (a: number, b: number) => void;
    readonly __wbg_set_trafficspikeoutput_peak_utilization_pct: (a: number, b: number) => void;
    readonly __wbg_set_trafficspikeoutput_dropped_request_pct: (a: number, b: number) => void;
    readonly __wbg_recoverydecisionoutput_free: (a: number, b: number) => void;
    readonly __wbg_deploymentfailureoutput_free: (a: number, b: number) => void;
    readonly __wbg_servicedegradationoutput_free: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
