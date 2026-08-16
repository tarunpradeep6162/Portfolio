//! Deterministic traffic-spike capacity model. Pure Rust, no I/O, no time,
//! no randomness - identical inputs always produce identical outputs. This
//! is a teaching simulation of a standard capacity-planning shape (fixed
//! capacity vs. autoscaled capacity absorbing a demand spike), not a
//! measurement of any real system.

pub struct TrafficSpikeInput {
    pub baseline_rps: f64,
    pub spike_multiplier: f64,
    pub instance_capacity_rps: f64,
    pub autoscaling_enabled: bool,
    pub scale_out_latency_s: f64,
    pub spike_duration_s: f64,
}

#[derive(Debug, PartialEq)]
pub struct TrafficSpikeResult {
    pub peak_utilization_pct: f64,
    pub dropped_request_pct: f64,
    pub time_to_absorb_s: f64,
    pub reliability_delta: f64,
}

pub fn simulate(input: &TrafficSpikeInput) -> TrafficSpikeResult {
    let demand = (input.baseline_rps * input.spike_multiplier).max(0.0);
    let capacity = input.instance_capacity_rps.max(1.0);
    let peak_utilization_pct = ((demand / capacity) * 100.0).min(999.0);

    let (dropped_request_pct, time_to_absorb_s) = if !input.autoscaling_enabled {
        // Fixed capacity for the whole spike: any demand over capacity is
        // dropped for the entire duration, since nothing grows to meet it.
        let overflow_ratio = (demand - capacity).max(0.0) / demand.max(1.0);
        (overflow_ratio * 100.0, input.spike_duration_s.max(0.0))
    } else {
        // Capacity ramps linearly from current capacity to demand-matching
        // capacity over scale_out_latency_s; requests are dropped only
        // during that ramp window, proportional to the average shortfall
        // across it.
        let ramp = input.scale_out_latency_s.max(0.0).min(input.spike_duration_s.max(0.0));
        let avg_capacity_during_ramp = capacity + (demand - capacity).max(0.0) / 2.0;
        let avg_shortfall_ratio = (demand - avg_capacity_during_ramp).max(0.0) / demand.max(1.0);
        let ramp_fraction = ramp / input.spike_duration_s.max(0.001);
        (avg_shortfall_ratio * ramp_fraction * 100.0, ramp)
    };

    // A simulation-only reliability delta, purely a deterministic function
    // of dropped_request_pct - not a claim about any real reliability score.
    let reliability_delta = -(dropped_request_pct / 10.0).min(10.0);

    TrafficSpikeResult {
        peak_utilization_pct,
        dropped_request_pct,
        time_to_absorb_s,
        reliability_delta,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_input() -> TrafficSpikeInput {
        TrafficSpikeInput {
            baseline_rps: 100.0,
            spike_multiplier: 5.0,
            instance_capacity_rps: 150.0,
            autoscaling_enabled: true,
            scale_out_latency_s: 60.0,
            spike_duration_s: 300.0,
        }
    }

    #[test]
    fn is_deterministic() {
        let a = simulate(&base_input());
        let b = simulate(&base_input());
        assert_eq!(a, b);
    }

    #[test]
    fn autoscaling_absorbs_a_spike_within_ample_capacity() {
        let input = TrafficSpikeInput {
            baseline_rps: 100.0,
            spike_multiplier: 1.2,
            instance_capacity_rps: 500.0,
            autoscaling_enabled: true,
            scale_out_latency_s: 60.0,
            spike_duration_s: 300.0,
        };
        let result = simulate(&input);
        assert_eq!(result.dropped_request_pct, 0.0);
        assert!(result.reliability_delta >= -0.01);
    }

    #[test]
    fn fixed_capacity_drops_more_than_autoscaled_for_the_same_spike() {
        let mut fixed = base_input();
        fixed.autoscaling_enabled = false;
        let autoscaled = base_input();

        let fixed_result = simulate(&fixed);
        let autoscaled_result = simulate(&autoscaled);

        assert!(fixed_result.dropped_request_pct > autoscaled_result.dropped_request_pct);
    }

    #[test]
    fn utilization_and_drop_rate_never_negative() {
        let result = simulate(&base_input());
        assert!(result.peak_utilization_pct >= 0.0);
        assert!(result.dropped_request_pct >= 0.0);
        assert!(result.time_to_absorb_s >= 0.0);
    }

    #[test]
    fn zero_baseline_does_not_divide_by_zero() {
        let input = TrafficSpikeInput {
            baseline_rps: 0.0,
            spike_multiplier: 5.0,
            instance_capacity_rps: 150.0,
            autoscaling_enabled: true,
            scale_out_latency_s: 60.0,
            spike_duration_s: 300.0,
        };
        let result = simulate(&input);
        assert!(result.peak_utilization_pct.is_finite());
        assert!(result.dropped_request_pct.is_finite());
    }
}
