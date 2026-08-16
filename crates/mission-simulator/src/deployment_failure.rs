//! Deterministic deployment-failure diagnosis model: how environment
//! parity and controller/agent isolation affect confidence and time spent
//! finding a root cause. Pure Rust, deterministic, no I/O.

pub struct DeploymentFailureInput {
    pub environment_parity_pct: f64,
    pub agent_isolated: bool,
    pub retry_count: u32,
}

#[derive(Debug, PartialEq)]
pub struct DeploymentFailureResult {
    pub diagnosis_confidence_pct: f64,
    pub estimated_hours_to_root_cause: f64,
    pub reliability_delta: f64,
}

pub fn simulate(input: &DeploymentFailureInput) -> DeploymentFailureResult {
    let parity = input.environment_parity_pct.clamp(0.0, 100.0);

    // Isolating controller from agent narrows the failure domain, which
    // this model treats as a fixed confidence bonus on top of whatever
    // environment parity already provides.
    let isolation_bonus = if input.agent_isolated { 35.0 } else { 0.0 };
    let diagnosis_confidence_pct = (parity * 0.5 + isolation_bonus).min(100.0);

    // Retrying without isolating multiplies wasted cycles, since each
    // retry re-runs the same coupled, undiagnosed path; retrying after
    // isolating narrows the search space each time instead.
    let base_hours: f64 = 4.0;
    let retry_penalty = if input.agent_isolated {
        f64::from(input.retry_count) * 0.25
    } else {
        f64::from(input.retry_count) * 1.5
    };
    let estimated_hours_to_root_cause =
        (base_hours - diagnosis_confidence_pct / 30.0 + retry_penalty).max(0.25);

    let reliability_delta = (diagnosis_confidence_pct / 20.0) - (estimated_hours_to_root_cause / 4.0);

    DeploymentFailureResult {
        diagnosis_confidence_pct,
        estimated_hours_to_root_cause,
        reliability_delta,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> DeploymentFailureInput {
        DeploymentFailureInput {
            environment_parity_pct: 60.0,
            agent_isolated: true,
            retry_count: 1,
        }
    }

    #[test]
    fn is_deterministic() {
        assert_eq!(simulate(&base_input()), simulate(&base_input()));
    }

    #[test]
    fn isolation_increases_diagnosis_confidence_for_equal_parity() {
        let isolated = base_input();
        let mut coupled = base_input();
        coupled.agent_isolated = false;

        assert!(simulate(&isolated).diagnosis_confidence_pct > simulate(&coupled).diagnosis_confidence_pct);
    }

    #[test]
    fn retrying_without_isolation_costs_more_time_than_retrying_with_it() {
        let mut isolated = base_input();
        isolated.retry_count = 3;
        let mut coupled = base_input();
        coupled.agent_isolated = false;
        coupled.retry_count = 3;

        assert!(
            simulate(&coupled).estimated_hours_to_root_cause
                > simulate(&isolated).estimated_hours_to_root_cause
        );
    }

    #[test]
    fn outputs_stay_within_sane_bounds() {
        let result = simulate(&base_input());
        assert!((0.0..=100.0).contains(&result.diagnosis_confidence_pct));
        assert!(result.estimated_hours_to_root_cause > 0.0);
    }

    #[test]
    fn zero_retries_and_zero_parity_does_not_panic() {
        let input = DeploymentFailureInput {
            environment_parity_pct: 0.0,
            agent_isolated: false,
            retry_count: 0,
        };
        let result = simulate(&input);
        assert!(result.diagnosis_confidence_pct.is_finite());
        assert!(result.estimated_hours_to_root_cause.is_finite());
    }
}
