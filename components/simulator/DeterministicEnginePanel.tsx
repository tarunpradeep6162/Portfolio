"use client";

import { useState } from "react";
import { Cpu, Loader2 } from "lucide-react";
import { runEngineForChoice, type EngineRunSummary } from "@/lib/v9/missionEngineParams";

type EngineState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; summary: EngineRunSummary }
  | { status: "error" };

/**
 * The Mission Scenario Engine's opt-in surface inside the Scenario
 * Simulator (`docs/PORTFOLIO_V9_ARCHITECTURE.md` polyglot addendum,
 * Phase 8). Renders only a button until clicked - the compiled WASM
 * module (`lib/v9/wasmOwnership.ts`) is never imported before that
 * click, preserving "zero WASM bytes before intent"
 * (`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`). `lib/v9/missionEngine.ts`
 * falls back to a pure-TS reference implementation automatically if WASM
 * fails to load, so this panel never has a hard failure state beyond
 * "the engine could not run in this browser," which is itself rare.
 */
export function DeterministicEnginePanel({
  scenarioSlug,
  choiceId,
}: {
  scenarioSlug: string;
  choiceId: string;
}) {
  const [state, setState] = useState<EngineState>({ status: "idle" });

  const run = async () => {
    setState({ status: "loading" });
    try {
      const summary = await runEngineForChoice(scenarioSlug, choiceId);
      setState(summary ? { status: "ready", summary } : { status: "error" });
    } catch {
      setState({ status: "error" });
    }
  };

  if (state.status === "idle") {
    return (
      <button
        type="button"
        onClick={run}
        className="mt-4 flex items-center gap-2 rounded border border-[var(--line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--ink)]"
      >
        <Cpu size={12} aria-hidden />
        Run the deterministic engine
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)]"
      >
        <Loader2 size={12} aria-hidden className="animate-spin" />
        Loading engine...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="mt-4 text-xs text-[var(--ink-muted)]">
        The deterministic engine could not run in this browser.
      </p>
    );
  }

  const { summary } = state;
  return (
    <div className="mt-4 border border-[var(--line)] bg-[var(--bg)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          Simulation - computed
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {summary.source === "wasm" ? "Rust/WASM engine" : "TypeScript fallback"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {summary.fields.map((field) => (
          <div key={field.label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              {field.label}
            </dt>
            <dd className="mt-0.5 text-sm">{field.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] leading-5 text-[var(--ink-muted)]">
        Computed live in your browser by a deterministic engine, from the illustrative parameters above -
        not a measurement of any real system.
      </p>
    </div>
  );
}
