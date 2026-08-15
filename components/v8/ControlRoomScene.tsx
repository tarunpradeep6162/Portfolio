"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { decideSceneMount } from "@/lib/v7/sceneDirector";
import { qualityPresets, type QualityTier } from "@/lib/companion/state";
import { claimCanvasOwnership, releaseCanvasOwnership } from "@/lib/v8/canvasOwnership";
import type { SceneKind } from "@/lib/v6/types";

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

export interface ControlRoomSceneRenderContext {
  qualityTier: QualityTier;
}

export interface ControlRoomSceneProps {
  /** Which SceneKind this instance renders for - the same field
   * (`ExperienceState.activeScene`) every V7 scene host already used for
   * mutual exclusion. Passing it explicitly here, instead of each caller
   * re-deriving its own `active` boolean, is what lets this component own
   * the full mount/lifecycle/context-loss/one-canvas contract exactly
   * once, rather than every scene reimplementing it (see
   * docs/PORTFOLIO_V8_DISCOVERY.md's "duplicated systems" finding). */
  scene: Exclude<SceneKind, null>;
  /** Recorded on SCENE_ERROR - kept scene-specific for the same debugging
   * trail the old per-scene reasons (e.g. "atlas-canvas-error") gave. */
  errorReason: string;
  /** Whether a canvas failure should dispatch SCENE_ERROR (clearing the
   * shared `activeScene`) in addition to calling `onError`. Defaults to
   * true, matching Atlas/Operational Twin's V7 behavior, where `scene`
   * and `activeScene` mean the same thing - deactivating on error is
   * correct there. RC-01 is the one exception: its outer panel's mounted
   * state (owned by CompanionRoot.tsx) already reads the *same*
   * `activeScene` field to decide whether the whole panel - not just its
   * 3D portrait - is open. The original CompanionCanvas.tsx never
   * dispatched SCENE_ERROR for exactly this reason: a canvas failure
   * should fall back to the static portrait, not close RC-01 entirely.
   * Set false for scenes where the canvas and the panel are independently
   * mounted concepts. */
  deactivateOnError?: boolean;
  ariaLabel: string;
  className?: string;
  cameraPosition: [number, number, number];
  cameraFov: number;
  /** Scene content, evaluated only once mount is actually decided. The
   * caller remains responsible for wrapping its own content component in
   * next/dynamic (this component cannot do that generically without
   * losing per-scene code-splitting) - see
   * docs/PORTFOLIO_V8_IMPLEMENTATION_PLAN.md Phase 1/2. */
  children: (ctx: ControlRoomSceneRenderContext) => ReactNode;
  /** Optional: called (in addition to this component's own SCENE_ERROR
   * dispatch) whenever this scene fails - lets the caller keep its own
   * local error-UI flag exactly as every V7 host already did, rather than
   * inferring "did *my* scene fail" from the shared, not scene-scoped
   * `spatialLoad` field (which could reflect a different scene's past
   * failure). */
  onError?: () => void;
}

/**
 * The one shared implementation of the Canvas-owning lifecycle contract
 * every V7 scene (Atlas, Operational Twin, RC-01) previously reimplemented
 * independently and by hand: intent-gated mount, reduced-motion/WebGL/
 * low-power eligibility (`lib/v7/sceneDirector`'s `decideSceneMount`,
 * reused here rather than duplicated), context-loss recovery, an
 * `activeRef` guard against Three.js's own `dispose()`-triggered
 * `webglcontextlost` firing on a deliberate close (not a real failure),
 * and a runtime-checked one-canvas invariant (`lib/v8/canvasOwnership`) -
 * not just "no two scenes' `active` happen to be true at once by
 * convention," but an actual claim/release check that surfaces a real
 * error if two ever try to hold the canvas simultaneously.
 *
 * Renders nothing unless `scene === activeScene` AND `decideSceneMount`
 * independently agrees this device/preference combination is eligible -
 * re-derived here rather than trusted from the caller, so a future
 * activation control that forgets to gate itself still cannot mount an
 * ineligible or duplicate scene.
 */
export function ControlRoomScene({
  scene,
  errorReason,
  ariaLabel,
  className,
  cameraPosition,
  cameraFov,
  children,
  onError,
  deactivateOnError = true,
}: ControlRoomSceneProps) {
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();
  const { preferences } = useCompanionPreferences();
  const experienceState = useExperienceState();
  const dispatch = useExperienceDispatch();

  const requestedActive = experienceState.activeScene === scene;
  const mountDecision = decideSceneMount({
    motion: reducedMotion ? "reduced" : "full",
    webglCapability: webglSupported ? "supported" : "unsupported",
    lowPowerMode: preferences.lowPowerMode,
  });
  const active = requestedActive && mountDecision.shouldMount;

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    dispatch({ type: "SPATIAL_LOAD_STATE_SET", state: { status: active ? "loading" : "idle" } });
  }, [active, dispatch]);

  // Publishes the quality tier this scene is actually mounting at into
  // shared state whenever it's active - previously only OperationalTwinHost
  // did this (AtlasCanvasHost computed its tier locally and never
  // published it), so other surfaces reading `qualityTier` centrally saw
  // a stale/default value while Atlas was the active scene. Publishing it
  // here, once, for every scene fixes that as a direct consequence of
  // sharing one implementation instead of three.
  useEffect(() => {
    if (!active) return;
    dispatch({ type: "QUALITY_TIER_SET", tier: mountDecision.qualityTier });
  }, [active, mountDecision.qualityTier, dispatch]);

  // Structural one-canvas enforcement: claims ownership under this scene's
  // own key on mount, releases on unmount/deactivation. A second instance
  // claiming ownership while this one still holds it means whatever
  // dispatched SCENE_CHANGED did so without the shared eligibility check
  // agreeing - a real bug, surfaced immediately instead of silently
  // producing two canvases.
  useEffect(() => {
    if (!active) return;
    const violation = claimCanvasOwnership(scene);
    if (violation) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[control-room] canvas ownership violation: "${violation.attempted}" tried to mount while "${violation.currentOwner}" still owned the canvas.`,
        );
      }
      if (deactivateOnError) {
        dispatch({ type: "SCENE_ERROR", reason: `${errorReason}-ownership-conflict` });
      }
      onError?.();
      return;
    }
    return () => releaseCanvasOwnership(scene);
    // onError/deactivateOnError intentionally excluded - callers pass
    // stable values (see AtlasCanvasHost/OperationalTwinHost/
    // CompanionControlRoomScene), and including them would re-run this
    // effect (and re-claim ownership) on every render for callers that
    // don't memoize onError.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scene, errorReason, dispatch]);

  function handleSceneError() {
    if (!activeRef.current) return;
    if (deactivateOnError) {
      dispatch({ type: "SCENE_ERROR", reason: errorReason });
    }
    onError?.();
  }

  // Pauses the render loop entirely when the tab is hidden or the canvas
  // leaves the viewport - previously only CompanionCanvas.tsx (RC-01) had
  // this; Atlas and Operational Twin never needed it because they're
  // always already in view at the moment of activation. Generalized here
  // rather than kept RC-01-only, since it's a real perf win with no
  // behavioral downside for any scene (pausing frames doesn't change
  // canvas presence/count, only whether it's actively rendering).
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!active || !node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    function handleVisibility() {
      setPageVisible(!document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [active]);

  if (!active) return null;

  const quality = qualityPresets[mountDecision.qualityTier];
  const running = inView && pageVisible;

  return (
    <div ref={wrapperRef} className={className} role="img" aria-label={ariaLabel} data-v8-scene={scene}>
      <SceneErrorBoundary onError={handleSceneError}>
        <Canvas
          dpr={quality.dpr}
          frameloop={running ? "always" : "never"}
          gl={{ antialias: quality.antialias, alpha: true, powerPreference: "low-power" }}
          camera={{ position: cameraPosition, fov: cameraFov }}
          onCreated={({ gl }) => {
            // A lost WebGL context doesn't throw a JS exception, so the
            // error boundary above can never catch it alone - this
            // listener is what actually routes context loss into the same
            // recovery path, matching every V7 scene's identical pattern.
            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                event.preventDefault();
                handleSceneError();
              },
              { once: true },
            );
          }}
        >
          {children({ qualityTier: mountDecision.qualityTier })}
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
