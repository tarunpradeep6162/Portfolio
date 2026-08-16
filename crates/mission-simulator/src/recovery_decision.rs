//! Deterministic incident-recovery model: rolling back to a known-good
//! state first vs. forward-fixing under time pressure. Pure Rust,
//! deterministic, no I/O.

pub struct RecoveryDecisionInput {
    pub rollback_available: bool,
    pub forward_fix_confidence_pct: f64,
    /// 1 = low, 2 = medium, 3 = high.
    pub time_pressure_level: u32,
    pub chose_rollback_first: bool,
}

#[derive(Debug, PartialEq)]
pub struct RecoveryDecisionResult {
    pub estimated_minutes_to_restore: f64,
    pub second_incident_risk_pct: f64,
    pub reliability_delta: f64,
}

pub fn simulate(input: &RecoveryDecisionInput) -> RecoveryDecisionResult {
    let pressure = f64::from(input.time_pressure_level.clamp(1, 3));

    let (estimated_minutes_to_restore, second_incident_risk_pct) =
        if input.chose_rollback_first && input.rollback_available {
            // Rollback restores a known-good state directly; investigation
            // happens afterward, off the critical path - a fixed, low-risk
            // shape regardless of pressure, since the decision itself
            // removes the pressure from the restore step.
            (10.0, 5.0)
        } else {
            // Forward-fixing under time pressure: both restoration time and
            // the risk of a second mistake grow as confidence in the fix
            // drops and pressure rises.
            let confidence = input.forward_fix_confidence_pct.clamp(0.0, 100.0) / 100.0;
            let minutes = 20.0 + (1.0 - confidence) * 60.0 * pressure / 2.0;
            let risk = ((1.0 - confidence) * pressure * 15.0).min(95.0);
            (minutes, risk)
        };

    let reliability_delta =
        10.0 - (estimated_minutes_to_restore / 10.0) - (second_incident_risk_pct / 10.0);

    RecoveryDecisionResult {
        estimated_minutes_to_restore,
        second_incident_risk_pct,
        reliability_delta,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> RecoveryDecisionInput {
        RecoveryDecisionInput {
            rollback_available: true,
            forward_fix_confidence_pct: 50.0,
            time_pressure_level: 3,
            chose_rollback_first: false,
        }
    }

    #[test]
    fn is_deterministic() {
        assert_eq!(simulate(&base_input()), simulate(&base_input()));
    }

    #[test]
    fn rollback_first_restores_faster_than_a_low_confidence_forward_fix_under_pressure() {
        let forward = simulate(&base_input());
        let mut rollback_input = base_input();
        rollback_input.chose_rollback_first = true;
        let rollback = simulate(&rollback_input);

        assert!(rollback.estimated_minutes_to_restore < forward.estimated_minutes_to_restore);
        assert!(rollback.second_incident_risk_pct < forward.second_incident_risk_pct);
    }

    #[test]
    fn higher_confidence_forward_fix_reduces_second_incident_risk() {
        let mut low_confidence = base_input();
        low_confidence.forward_fix_confidence_pct = 20.0;
        let mut high_confidence = base_input();
        high_confidence.forward_fix_confidence_pct = 90.0;

        assert!(
            simulate(&high_confidence).second_incident_risk_pct
                < simulate(&low_confidence).second_incident_risk_pct
        );
    }

    #[test]
    fn choosing_rollback_without_it_being_available_falls_back_to_forward_fix_math() {
        let mut input = base_input();
        input.chose_rollback_first = true;
        input.rollback_available = false;

        let with_unavailable_rollback = simulate(&input);
        let mut forward_input = base_input();
        forward_input.chose_rollback_first = false;
        let pure_forward = simulate(&forward_input);

        assert_eq!(with_unavailable_rollback, pure_forward);
    }

    #[test]
    fn outputs_stay_finite_and_non_negative() {
        let result = simulate(&base_input());
        assert!(result.estimated_minutes_to_restore >= 0.0);
        assert!(result.second_incident_risk_pct >= 0.0);
        assert!(result.reliability_delta.is_finite());
    }
}
