"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Activity } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { decideSceneMount } from "@/lib/v7/sceneDirector";
import { OperationalTwinFallback } from "./OperationalTwinFallback";
import type { SpineStageId } from "@/content/types";

const OperationalTwinControlRoomScene = dynamic(
  () =>
    import("./OperationalTwinControlRoomScene").then(
      (mod) => mod.OperationalTwinControlRoomScene,
    ),
  { ssr: false },
);

/**
 * V8 Phase 3: activation host for the Operational Twin, now mounted
 * through the shared components/v8/ControlRoomScene.tsx (via
 * OperationalTwinControlRoomScene.tsx, the dynamic-import boundary that
 * bundles the shared host with this scene's content - see
 * docs/PORTFOLIO_V8_PHASE2_ATLAS.md for why that indirection exists)
 * instead of owning its own Canvas/SceneErrorBoundary/context-loss-
 * listener/activeRef boilerplate. Keeps only what's genuinely
 * Twin-specific: `decideSceneMount`'s eligibility check (which decides
 * between the static SVG fallback and the activation button - a
 * V7-specific choice Atlas doesn't have, since Atlas's 2D diagram is
 * always present regardless), the Activate/Close controls, intent-based
 * prefetching, and publishing `WEBGL_CAPABILITY_SET` (unrelated to Canvas
 * lifecycle, so it stays here rather than moving into the shared host).
 *
 * `QUALITY_TIER_SET` and `SPATIAL_LOAD_STATE_SET` are no longer dispatched
 * here - `ControlRoomScene` now publishes both once, consistently, for
 * every scene (see docs/PORTFOLIO_V8_PHASE1_UNIFIED_HOST.md: this host
 * was previously the *only* one of the three that published
 * `QUALITY_TIER_SET` at all, an inconsistency Phase 1 already fixed by
 * centralizing it).
 */
export function OperationalTwinHost() {
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();
  const { preferences } = useCompanionPreferences();
  const experienceState = useExperienceState();
  const dispatch = useExperienceDispatch();
  const [prefetchArmed, setPrefetchArmed] = useState(false);
  const [erroredOut, setErroredOut] = useState(false);

  const active = experienceState.activeScene === "operational-twin";

  useEffect(() => {
    dispatch({
      type: "WEBGL_CAPABILITY_SET",
      capability: webglSupported ? "supported" : "unsupported",
    });
  }, [webglSupported, dispatch]);

  const mountDecision = decideSceneMount({
    motion: reducedMotion ? "reduced" : "full",
    webglCapability: webglSupported ? "supported" : "unsupported",
    lowPowerMode: preferences.lowPowerMode,
  });

  const armPrefetch = () => {
    if (prefetchArmed || !mountDecision.shouldMount) return;
    setPrefetchArmed(true);
    void import("./OperationalTwinControlRoomScene");
  };

  function handleSelectStage(stageId: SpineStageId) {
    dispatch({ type: "STAGE_SELECTED", stageId });
  }

  if (!mountDecision.shouldMount) {
    return <OperationalTwinFallback reason={mountDecision.reason} />;
  }

  if (erroredOut) {
    return <OperationalTwinFallback reason="the Operational Twin scene failed to load" />;
  }

  if (active) {
    return (
      <div className="mt-4">
        <OperationalTwinControlRoomScene
          selectedStageId={experienceState.selectedStageId}
          onSelectStage={handleSelectStage}
          onError={() => setErroredOut(true)}
          className="h-80 w-full overflow-hidden rounded border border-[var(--color-signal-lime)]/30 bg-[var(--color-control-black)] sm:h-[28rem]"
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "SCENE_CHANGED", scene: null })}
          className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:text-[var(--color-signal-lime)]"
        >
          Close Operational Twin
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setErroredOut(false);
        dispatch({ type: "SCENE_CHANGED", scene: "operational-twin" });
      }}
      onPointerEnter={armPrefetch}
      onFocus={armPrefetch}
      onTouchStart={armPrefetch}
      className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
    >
      <Activity size={14} aria-hidden />
      Activate Operational Twin
    </button>
  );
}
