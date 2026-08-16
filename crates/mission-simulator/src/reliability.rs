//! Combines the per-category reliability deltas from the other five
//! modules into a single 0-100 score. A fixed, documented starting point
//! plus the average delta - deliberately simple and transparent rather
//! than a black box, since the point of this engine is to demonstrate a
//! real, inspectable calculation, not to look impressive.

/// A fixed, documented starting point for this simulation's combined
/// score - not a measured baseline of any real system.
const BASELINE_SCORE: f64 = 70.0;

pub fn combined_score(deltas: &[f64; 5]) -> f64 {
    let average_delta: f64 = deltas.iter().sum::<f64>() / deltas.len() as f64;
    (BASELINE_SCORE + average_delta).clamp(0.0, 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_deterministic() {
        let deltas = [1.0, -2.0, 3.0, -0.5, 2.0];
        assert_eq!(combined_score(&deltas), combined_score(&deltas));
    }

    #[test]
    fn all_zero_deltas_returns_the_baseline() {
        assert_eq!(combined_score(&[0.0; 5]), BASELINE_SCORE);
    }

    #[test]
    fn clamps_to_the_zero_to_hundred_range() {
        assert_eq!(combined_score(&[1000.0; 5]), 100.0);
        assert_eq!(combined_score(&[-1000.0; 5]), 0.0);
    }

    #[test]
    fn positive_deltas_raise_the_score_and_negative_deltas_lower_it() {
        let raised = combined_score(&[10.0, 10.0, 10.0, 10.0, 10.0]);
        let lowered = combined_score(&[-10.0, -10.0, -10.0, -10.0, -10.0]);
        assert!(raised > BASELINE_SCORE);
        assert!(lowered < BASELINE_SCORE);
    }
}
