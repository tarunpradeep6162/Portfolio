/**
 * Intent-loading guard for the Mission Scenario Engine's compiled
 * WebAssembly module, deliberately mirroring
 * `lib/v8/canvasOwnership.ts`'s contract for a WASM module instead of a
 * Canvas: this module is dynamically imported and instantiated at most
 * once per page session, and only when a visitor actually asks for it
 * (`lib/v9/missionEngine.ts` is the only caller, invoked from the
 * Scenario Simulator's "Run the deterministic engine" disclosure) -
 * never on initial route load. That is what keeps
 * "zero WASM bytes before intent" (`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`)
 * true by construction rather than by convention.
 */
import type * as MissionSimulatorModule from "@/crates/mission-simulator/pkg/mission_simulator";

type MissionEngineModule = typeof MissionSimulatorModule;

let requested = false;
let enginePromise: Promise<MissionEngineModule> | null = null;

export function isMissionEngineWasmRequested(): boolean {
  return requested;
}

/**
 * Marks the engine as requested and returns the loaded module, importing
 * and initializing it on the first call only. Every call after the first
 * - concurrent or later - receives the same promise, so a visitor
 * clicking the disclosure twice in a row never triggers a second fetch.
 *
 * Rejects (never throws synchronously) if `WebAssembly` isn't available
 * in this environment or the module fails to load/instantiate - the
 * caller (`lib/v9/missionEngine.ts`) is responsible for falling back to
 * `lib/v9/missionEngineFallback.ts` in that case.
 */
export function loadMissionEngineWasm(): Promise<MissionEngineModule> {
  requested = true;
  if (!enginePromise) {
    enginePromise = (async () => {
      if (typeof WebAssembly === "undefined") {
        throw new Error("WebAssembly is not available in this environment.");
      }
      const mod = await import("@/crates/mission-simulator/pkg/mission_simulator");
      await mod.default();
      return mod;
    })();
  }
  return enginePromise;
}

/** Test-only - production code never needs to reset this mid-session. */
export function __resetMissionEngineWasmForTests(): void {
  requested = false;
  enginePromise = null;
}
