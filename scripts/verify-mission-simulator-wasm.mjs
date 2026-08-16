import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

/**
 * Loads the compiled Mission Scenario Engine
 * (crates/mission-simulator/pkg/) directly from raw bytes (bypassing
 * fetch(), which doesn't support file:// URLs in Node) and runs every
 * exported function against fixed inputs, printing the results as JSON.
 *
 * Used by .github/workflows/v9-rust-wasm.yml to verify that a freshly
 * rebuilt artifact is *functionally* equivalent to the committed one -
 * not byte-identical, which wasm-bindgen/wasm-opt do not guarantee
 * across runs (non-deterministic internal ordering can change the
 * compiled bytes without changing behavior; see
 * docs/PORTFOLIO_V9_PHASE8_MISSION_SCENARIO_ENGINE.md for the real CI
 * failure that surfaced this). Comparing computed outputs is the
 * guarantee docs/PORTFOLIO_V9_ARCHITECTURE.md's "Build/deploy
 * separation" actually needs: that the committed artifact behaves like
 * what the reviewed Rust source currently compiles to.
 */
const pkgDir = path.resolve(import.meta.dirname, "..", "crates", "mission-simulator", "pkg");
const wasmPath = path.join(pkgDir, "mission_simulator_bg.wasm");
const jsPath = path.join(pkgDir, "mission_simulator.js");

const mod = await import(pathToFileURL(jsPath));
await mod.default({ module_or_path: readFileSync(wasmPath) });

function freeAndPluck(output, fields) {
  const result = {};
  for (const field of fields) result[field] = output[field];
  output.free();
  return result;
}

const results = {
  trafficSpike: freeAndPluck(mod.simulate_traffic_spike(100, 5, 150, true, 60, 300), [
    "peak_utilization_pct",
    "dropped_request_pct",
    "time_to_absorb_s",
    "reliability_delta",
  ]),
  deploymentFailure: freeAndPluck(mod.simulate_deployment_failure(60, true, 1), [
    "diagnosis_confidence_pct",
    "estimated_hours_to_root_cause",
    "reliability_delta",
  ]),
  serviceDegradation: freeAndPluck(mod.simulate_service_degradation(20, 85, true), [
    "projected_latency_ms",
    "database_is_likely_cause",
    "reliability_delta",
  ]),
  credentialCompromise: freeAndPluck(mod.simulate_credential_compromise(3, true, true), [
    "blast_radius_score",
    "residual_exposure_score",
    "reliability_delta",
  ]),
  recoveryDecision: freeAndPluck(mod.simulate_recovery_decision(true, 50, 3, true), [
    "estimated_minutes_to_restore",
    "second_incident_risk_pct",
    "reliability_delta",
  ]),
  combinedReliabilityScore: mod.combined_reliability_score(1, -2, 3, -4, 5),
};

const json = JSON.stringify(results, null, 2);
const outPath = process.argv[2];
if (outPath) {
  writeFileSync(outPath, json);
  console.error(`Wrote computed results to ${outPath}`);
} else {
  console.log(json);
}
