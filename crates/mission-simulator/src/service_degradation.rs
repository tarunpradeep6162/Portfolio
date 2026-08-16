//! Deterministic service-degradation (database latency) model, using a
//! standard M/M/1-style queueing amplification shape: latency grows
//! nonlinearly as utilization approaches saturation. This is a textbook
//! queueing-theory curve applied to illustrative inputs, not a
//! measurement of any real database.

pub struct ServiceDegradationInput {
    pub baseline_latency_ms: f64,
    pub connection_pool_utilization_pct: f64,
    pub diagnosed_before_acting: bool,
}

#[derive(Debug, PartialEq)]
pub struct ServiceDegradationResult {
    pub projected_latency_ms: f64,
    pub database_is_likely_cause: bool,
    pub reliability_delta: f64,
}

pub fn simulate(input: &ServiceDegradationInput) -> ServiceDegradationResult {
    let utilization = input.connection_pool_utilization_pct.clamp(0.0, 99.0) / 100.0;

    // M/M/1-style amplification factor: 1 / (1 - utilization), clamped away
    // from a divide-by-zero singularity at full saturation.
    let amplification = 1.0 / (1.0 - utilization).max(0.01);
    let projected_latency_ms = input.baseline_latency_ms.max(0.0) * amplification;

    let database_is_likely_cause = utilization > 0.7;

    // Diagnosing before acting avoids remediation cycles that don't
    // address the actual bottleneck.
    let reliability_delta = if input.diagnosed_before_acting { 5.0 } else { -3.0 };

    ServiceDegradationResult {
        projected_latency_ms,
        database_is_likely_cause,
        reliability_delta,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> ServiceDegradationInput {
        ServiceDegradationInput {
            baseline_latency_ms: 20.0,
            connection_pool_utilization_pct: 50.0,
            diagnosed_before_acting: true,
        }
    }

    #[test]
    fn is_deterministic() {
        assert_eq!(simulate(&base_input()), simulate(&base_input()));
    }

    #[test]
    fn latency_amplifies_as_utilization_rises() {
        let low = simulate(&base_input());
        let mut high_input = base_input();
        high_input.connection_pool_utilization_pct = 90.0;
        let high = simulate(&high_input);

        assert!(high.projected_latency_ms > low.projected_latency_ms);
    }

    #[test]
    fn flags_the_database_as_likely_cause_only_above_the_threshold() {
        let mut below = base_input();
        below.connection_pool_utilization_pct = 60.0;
        let mut above = base_input();
        above.connection_pool_utilization_pct = 85.0;

        assert!(!simulate(&below).database_is_likely_cause);
        assert!(simulate(&above).database_is_likely_cause);
    }

    #[test]
    fn diagnosing_first_yields_a_better_reliability_delta() {
        let diagnosed = base_input();
        let mut blind = base_input();
        blind.diagnosed_before_acting = false;

        assert!(simulate(&diagnosed).reliability_delta > simulate(&blind).reliability_delta);
    }

    #[test]
    fn full_saturation_does_not_produce_infinite_or_nan_latency() {
        let mut input = base_input();
        input.connection_pool_utilization_pct = 100.0;
        let result = simulate(&input);
        assert!(result.projected_latency_ms.is_finite());
    }
}
