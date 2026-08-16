//! Portfolio V9's Mission Scenario Engine (`docs/PORTFOLIO_V9_ARCHITECTURE.md`
//! polyglot addendum, Phase 8). Deterministic calculations for the five
//! Scenario Simulator categories plus a combined reliability score,
//! compiled to WebAssembly and loaded only when a visitor opts into the
//! Scenario Simulator's "deterministic engine" disclosure - never on
//! initial page load.
//!
//! Every function here is a pure, seed-free, deterministic calculation.
//! Nothing in this crate reads real infrastructure, makes a network call,
//! or produces output that could be mistaken for live telemetry - the
//! calling UI is responsible for keeping the same "Simulation" labeling
//! discipline `components/simulator/ScenarioSimulator.tsx` already
//! established for its scripted content.
//!
//! Calculation logic lives in per-category modules and is unit-tested
//! directly on the native target (`cargo test`, no wasm32 toolchain
//! required for that). This file only adds a thin `wasm-bindgen` layer
//! translating primitive JS-friendly arguments into each module's input
//! struct and back.

mod credential_compromise;
mod deployment_failure;
mod recovery_decision;
mod reliability;
mod service_degradation;
mod traffic_spike;

use wasm_bindgen::prelude::*;

/// Real crate version, surfaced to the UI so any displayed result can be
/// attributed to a specific, verifiable build - never asserted separately
/// from what actually shipped.
#[wasm_bindgen]
pub fn engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[wasm_bindgen]
pub struct TrafficSpikeOutput {
    pub peak_utilization_pct: f64,
    pub dropped_request_pct: f64,
    pub time_to_absorb_s: f64,
    pub reliability_delta: f64,
}

#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn simulate_traffic_spike(
    baseline_rps: f64,
    spike_multiplier: f64,
    instance_capacity_rps: f64,
    autoscaling_enabled: bool,
    scale_out_latency_s: f64,
    spike_duration_s: f64,
) -> TrafficSpikeOutput {
    let result = traffic_spike::simulate(&traffic_spike::TrafficSpikeInput {
        baseline_rps,
        spike_multiplier,
        instance_capacity_rps,
        autoscaling_enabled,
        scale_out_latency_s,
        spike_duration_s,
    });
    TrafficSpikeOutput {
        peak_utilization_pct: result.peak_utilization_pct,
        dropped_request_pct: result.dropped_request_pct,
        time_to_absorb_s: result.time_to_absorb_s,
        reliability_delta: result.reliability_delta,
    }
}

#[wasm_bindgen]
pub struct DeploymentFailureOutput {
    pub diagnosis_confidence_pct: f64,
    pub estimated_hours_to_root_cause: f64,
    pub reliability_delta: f64,
}

#[wasm_bindgen]
pub fn simulate_deployment_failure(
    environment_parity_pct: f64,
    agent_isolated: bool,
    retry_count: u32,
) -> DeploymentFailureOutput {
    let result = deployment_failure::simulate(&deployment_failure::DeploymentFailureInput {
        environment_parity_pct,
        agent_isolated,
        retry_count,
    });
    DeploymentFailureOutput {
        diagnosis_confidence_pct: result.diagnosis_confidence_pct,
        estimated_hours_to_root_cause: result.estimated_hours_to_root_cause,
        reliability_delta: result.reliability_delta,
    }
}

#[wasm_bindgen]
pub struct ServiceDegradationOutput {
    pub projected_latency_ms: f64,
    pub database_is_likely_cause: bool,
    pub reliability_delta: f64,
}

#[wasm_bindgen]
pub fn simulate_service_degradation(
    baseline_latency_ms: f64,
    connection_pool_utilization_pct: f64,
    diagnosed_before_acting: bool,
) -> ServiceDegradationOutput {
    let result = service_degradation::simulate(&service_degradation::ServiceDegradationInput {
        baseline_latency_ms,
        connection_pool_utilization_pct,
        diagnosed_before_acting,
    });
    ServiceDegradationOutput {
        projected_latency_ms: result.projected_latency_ms,
        database_is_likely_cause: result.database_is_likely_cause,
        reliability_delta: result.reliability_delta,
    }
}

#[wasm_bindgen]
pub struct CredentialCompromiseOutput {
    pub blast_radius_score: f64,
    pub residual_exposure_score: f64,
    pub reliability_delta: f64,
}

#[wasm_bindgen]
pub fn simulate_credential_compromise(
    privilege_level: u32,
    rotated: bool,
    rescoped_to_least_privilege: bool,
) -> CredentialCompromiseOutput {
    let result = credential_compromise::simulate(&credential_compromise::CredentialCompromiseInput {
        privilege_level,
        rotated,
        rescoped_to_least_privilege,
    });
    CredentialCompromiseOutput {
        blast_radius_score: result.blast_radius_score,
        residual_exposure_score: result.residual_exposure_score,
        reliability_delta: result.reliability_delta,
    }
}

#[wasm_bindgen]
pub struct RecoveryDecisionOutput {
    pub estimated_minutes_to_restore: f64,
    pub second_incident_risk_pct: f64,
    pub reliability_delta: f64,
}

#[wasm_bindgen]
pub fn simulate_recovery_decision(
    rollback_available: bool,
    forward_fix_confidence_pct: f64,
    time_pressure_level: u32,
    chose_rollback_first: bool,
) -> RecoveryDecisionOutput {
    let result = recovery_decision::simulate(&recovery_decision::RecoveryDecisionInput {
        rollback_available,
        forward_fix_confidence_pct,
        time_pressure_level,
        chose_rollback_first,
    });
    RecoveryDecisionOutput {
        estimated_minutes_to_restore: result.estimated_minutes_to_restore,
        second_incident_risk_pct: result.second_incident_risk_pct,
        reliability_delta: result.reliability_delta,
    }
}

#[wasm_bindgen]
pub fn combined_reliability_score(
    traffic_spike_delta: f64,
    deployment_failure_delta: f64,
    service_degradation_delta: f64,
    credential_compromise_delta: f64,
    recovery_decision_delta: f64,
) -> f64 {
    reliability::combined_score(&[
        traffic_spike_delta,
        deployment_failure_delta,
        service_degradation_delta,
        credential_compromise_delta,
        recovery_decision_delta,
    ])
}
