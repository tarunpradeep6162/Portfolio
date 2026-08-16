//! Deterministic credential-compromise blast-radius model: how privilege
//! level, rotation, and re-scoping to least privilege together determine
//! blast radius and residual exposure. Pure Rust, deterministic, no I/O.

pub struct CredentialCompromiseInput {
    /// 1 = minimal privilege, 2 = broad, 3 = admin.
    pub privilege_level: u32,
    pub rotated: bool,
    pub rescoped_to_least_privilege: bool,
}

#[derive(Debug, PartialEq)]
pub struct CredentialCompromiseResult {
    pub blast_radius_score: f64,
    pub residual_exposure_score: f64,
    pub reliability_delta: f64,
}

pub fn simulate(input: &CredentialCompromiseInput) -> CredentialCompromiseResult {
    let level = f64::from(input.privilege_level.clamp(1, 3));
    let base_blast_radius = level * 30.0; // 30 / 60 / 90

    let rotation_factor = if input.rotated { 0.3 } else { 1.0 };
    let blast_radius_score = (base_blast_radius * rotation_factor).min(100.0);

    // Residual exposure is what's still true after remediation - most of
    // all, whether the excess privilege itself was ever addressed, not just
    // the leaked key.
    let residual_exposure_score = if input.rescoped_to_least_privilege {
        (level - 1.0) * 5.0
    } else {
        base_blast_radius * 0.8
    };

    let reliability_delta = -(residual_exposure_score / 15.0);

    CredentialCompromiseResult {
        blast_radius_score,
        residual_exposure_score,
        reliability_delta,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> CredentialCompromiseInput {
        CredentialCompromiseInput {
            privilege_level: 3,
            rotated: false,
            rescoped_to_least_privilege: false,
        }
    }

    #[test]
    fn is_deterministic() {
        assert_eq!(simulate(&base_input()), simulate(&base_input()));
    }

    #[test]
    fn rotation_alone_reduces_blast_radius_but_not_residual_exposure() {
        let unrotated = simulate(&base_input());
        let mut rotated_input = base_input();
        rotated_input.rotated = true;
        let rotated = simulate(&rotated_input);

        assert!(rotated.blast_radius_score < unrotated.blast_radius_score);
        // Residual exposure is unaffected by rotation alone - the excess
        // privilege itself is still in place.
        assert_eq!(rotated.residual_exposure_score, unrotated.residual_exposure_score);
    }

    #[test]
    fn rescoping_to_least_privilege_reduces_residual_exposure() {
        let unscoped = simulate(&base_input());
        let mut scoped_input = base_input();
        scoped_input.rescoped_to_least_privilege = true;
        let scoped = simulate(&scoped_input);

        assert!(scoped.residual_exposure_score < unscoped.residual_exposure_score);
    }

    #[test]
    fn rotating_and_rescoping_together_yields_the_best_reliability_delta() {
        let worst = simulate(&base_input());
        let mut best_input = base_input();
        best_input.rotated = true;
        best_input.rescoped_to_least_privilege = true;
        let best = simulate(&best_input);

        assert!(best.reliability_delta > worst.reliability_delta);
    }

    #[test]
    fn privilege_level_is_clamped_to_a_valid_range() {
        let mut input = base_input();
        input.privilege_level = 99;
        let result = simulate(&input);
        // Clamped to level 3 (admin) internally - must not exceed the
        // level-3 blast radius ceiling of 90 before the rotation factor.
        assert!(result.blast_radius_score <= 90.0);
    }
}
