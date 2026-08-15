"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { spineStages } from "@/content/spine";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { cn } from "@/lib/cn";
import type { SpineStageId } from "@/content/types";

const STAGE_QUERY_PARAM = "stage";

/**
 * The System Trace control (spec Section 10.2, the signature interaction).
 * Every button here dispatches into the same lib/v6/experienceReducer.ts
 * state the Operational Twin, ReliabilitySpine, and ProjectCard already
 * read from - selecting a stage here is what makes the Instrument Deck's
 * matching instrument light up, the Reliability Spine list highlight the
 * same stage, and project cards dim/highlight by whether they actually
 * demonstrate it. No independent local state duplicating any of that.
 *
 * Fully keyboard-operable: every stage is a real <button>, native Tab/
 * Enter/Space semantics, aria-pressed reflects selection.
 *
 * Exported wrapped in its own <Suspense> boundary - useSearchParams()
 * below opts a component out of static rendering unless something above
 * it suspends, and this surfaced as a real production-build failure
 * ("useSearchParams() should be wrapped in a suspense boundary"), not a
 * lint warning, when first wired into the SSR homepage. Wrapping it here
 * once means every future caller gets this for free instead of needing
 * to remember it themselves.
 */
export function SystemTrace({ className }: { className?: string }) {
  return (
    <Suspense fallback={<SystemTraceFallback className={className} />}>
      <SystemTraceControl className={className} />
    </Suspense>
  );
}

function SystemTraceFallback({ className }: { className?: string }) {
  // Matches the real control's approximate footprint (10 buttons' worth
  // of row height) to avoid a layout shift during the brief pre-hydration
  // window - not interactive, gone as soon as the real control mounts.
  return (
    <div className={cn("flex flex-wrap gap-2", className)} aria-hidden>
      {spineStages.map((stage) => (
        <span
          key={stage.id}
          className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] opacity-50"
        >
          {stage.label}
        </span>
      ))}
    </div>
  );
}

function SystemTraceControl({ className }: { className?: string }) {
  const { selectedStageId, traceScope } = useExperienceState();
  const dispatch = useExperienceDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedFromUrl = useRef(false);

  // Read a shared/bookmarked ?stage= once, on mount only. After that the
  // reducer is the single source of truth and the effect below mirrors it
  // back into the URL - this does not keep re-reading the URL afterward.
  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;
    const stageParam = searchParams.get(STAGE_QUERY_PARAM);
    const isRealStage = spineStages.some((stage) => stage.id === stageParam);
    if (isRealStage && stageParam !== selectedStageId) {
      dispatch({ type: "STAGE_SELECTED", stageId: stageParam as SpineStageId });
    }
    // Intentionally run once on mount only - see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedStageId) {
      params.set(STAGE_QUERY_PARAM, selectedStageId);
    } else {
      params.delete(STAGE_QUERY_PARAM);
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    // Deliberately reacts only to selectedStageId, not to searchParams -
    // this effect writes the URL, it must not re-fire from its own write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStageId, pathname, router]);

  function selectStage(stageId: SpineStageId) {
    if (stageId === selectedStageId) {
      dispatch({ type: "SELECTION_CLEARED" });
      return;
    }
    dispatch({ type: "STAGE_SELECTED", stageId });
  }

  function reset() {
    dispatch({ type: "SELECTION_CLEARED" });
    dispatch({ type: "TRACE_SCOPE_SET", scope: "single" });
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      data-v7-trace-scope={traceScope}
      data-v7-trace-stage={selectedStageId ?? "none"}
    >
      {spineStages.map((stage) => {
        const isActive = stage.id === selectedStageId;
        return (
          <button
            key={stage.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => selectStage(stage.id)}
            className={cn(
              "rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
              isActive
                ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]",
            )}
          >
            {stage.label}
          </button>
        );
      })}
      <button
        type="button"
        aria-pressed={traceScope === "all"}
        onClick={() =>
          dispatch({
            type: "TRACE_SCOPE_SET",
            scope: traceScope === "all" ? "single" : "all",
          })
        }
        className={cn(
          "rounded border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
          traceScope === "all"
            ? "border-[var(--color-packet-blue)] text-[var(--color-packet-blue)]"
            : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-packet-blue)] hover:text-[var(--color-packet-blue)]",
        )}
      >
        All stages
      </button>
      {(selectedStageId !== null || traceScope === "all") && (
        <button
          type="button"
          onClick={reset}
          className="rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-coral)] hover:text-[var(--color-signal-coral)]"
        >
          Reset trace
        </button>
      )}
    </div>
  );
}
