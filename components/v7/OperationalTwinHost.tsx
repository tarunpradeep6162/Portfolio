"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Activity } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { decideSceneMount } from "@/lib/v7/sceneDirector";
import { OperationalTwinFallback } from "./OperationalTwinFallback";
import type { SpineStageId } from "@/content/types";

const OperationalTwinScene = dynamic(
  () => import("./OperationalTwinScene").then((mod) => mod.OperationalTwinScene),
  { ssr: false },
);

class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Activation host for the Operational Twin hero scene - zero bytes of
 * @react-three/fiber/three/OperationalTwinScene are requested before a
 * real user gesture on the "Activate Operational Twin" control below.
 * Follows AtlasCanvasHost's proven lifecycle exactly (that pattern
 * survived a serious close/reopen regression during V6 and was fixed
 * there - reproducing the same shape here reproduces the fix, not the
 * bug): idle -> loading -> ready -> error, one-canvas exclusion via the
 * shared `activeScene` reducer field, and an activeRef guard so Three.js's
 * own dispose()-triggered webglcontextlost on unmount is never
 * misread as a real failure.
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

  // Report real WebGL capability into shared state once - other surfaces
  // (Automation Fabric, Proof Ledger) may want to know this without
  // mounting their own canvas. useWebGLSupport's own lazy-useState check
  // already ran by the time this effect fires; this just publishes it.
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

  useEffect(() => {
    dispatch({ type: "QUALITY_TIER_SET", tier: mountDecision.qualityTier });
  }, [mountDecision.qualityTier, dispatch]);

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  function handleSceneError() {
    if (!activeRef.current) return;
    setErroredOut(true);
    dispatch({ type: "SCENE_ERROR", reason: "operational-twin-canvas-error" });
  }

  const armPrefetch = () => {
    if (prefetchArmed || !mountDecision.shouldMount) return;
    setPrefetchArmed(true);
    void import("./OperationalTwinScene");
  };

  useEffect(() => {
    dispatch({ type: "SPATIAL_LOAD_STATE_SET", state: { status: active ? "loading" : "idle" } });
  }, [active, dispatch]);

  function handleSelectStage(stageId: SpineStageId) {
    dispatch({ type: "STAGE_SELECTED", stageId });
  }

  if (!mountDecision.shouldMount) {
    return <OperationalTwinFallback reason={mountDecision.reason} />;
  }

  if (erroredOut) {
    return (
      <OperationalTwinFallback reason="the Operational Twin scene failed to load" />
    );
  }

  if (active) {
    return (
      <div className="mt-4">
        <div
          className="h-80 w-full overflow-hidden rounded border border-[var(--color-signal-lime)]/30 bg-[var(--color-control-black)] sm:h-[28rem]"
          role="img"
          aria-label="The Operational Twin: an interactive instrument deck representing the real delivery pipeline from commit to recovery"
          data-v7-scene="operational-twin"
          data-v7-quality={mountDecision.qualityTier}
          data-v7-ready="true"
        >
          <SceneErrorBoundary onError={handleSceneError}>
            <OperationalTwinScene
              selectedStageId={experienceState.selectedStageId}
              onSelectStage={handleSelectStage}
              qualityTier={mountDecision.qualityTier}
              onError={handleSceneError}
            />
          </SceneErrorBoundary>
        </div>
        <button
          type="button"
          onClick={() => {
            activeRef.current = false;
            dispatch({ type: "SCENE_CHANGED", scene: null });
          }}
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
      data-v7-scene="operational-twin"
      data-v7-ready="false"
      className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
    >
      <Activity size={14} aria-hidden />
      Activate Operational Twin
    </button>
  );
}
