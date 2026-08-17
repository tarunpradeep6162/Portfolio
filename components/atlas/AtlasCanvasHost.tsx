"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Boxes } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { resolveQualityTier } from "@/lib/companion/state";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";

const AtlasSpatialScene = dynamic(
  () => import("./AtlasSpatialScene").then((mod) => mod.AtlasSpatialScene),
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

interface AtlasCanvasHostProps {
  flow: string;
  projectLabel: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

/**
 * The intent-loaded spatial enhancement on top of AtlasSection's always-
 * present 2D diagram - zero bytes of this file's dynamic import
 * (@react-three/fiber, three, AtlasSpatialScene) are requested until a real
 * user gesture (hover/focus/touch/click on the "Enter 3D view" control
 * below). Enforces the site-wide one-canvas rule via the shared
 * `activeScene` reducer field: activating this scene claims "atlas",
 * which - because CompanionRoot derives its own visibility from the same
 * field - closes RC-01 first if it was open, and this scene closes itself
 * if something else (RC-01, later Time Machine) claims the scene instead.
 */
export function AtlasCanvasHost({
  flow,
  projectLabel,
  selectedNodeId,
  onSelectNode,
}: AtlasCanvasHostProps) {
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();
  const { preferences } = useCompanionPreferences();
  const experienceState = useExperienceState();
  const dispatch = useExperienceDispatch();
  const [prefetchArmed, setPrefetchArmed] = useState(false);
  const [erroredOut, setErroredOut] = useState(false);

  const active = experienceState.activeScene === "atlas";
  const qualityTier = resolveQualityTier(preferences.lowPowerMode);

  // Three.js's own WebGLRenderer.dispose() (called by R3F when this scene
  // unmounts) intentionally force-loses the WebGL context as part of its
  // own cleanup - that fires the exact same "webglcontextlost" event a
  // genuine driver crash would. This ref lets AtlasSpatialScene's listener
  // tell "we just closed this on purpose" apart from "the context actually
  // died while active": synced via effect for the general case, and set
  // synchronously in the Close button's own click handler below for the
  // one path confirmed (by direct reproduction) to race the effect.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Shared by both the outer SceneErrorBoundary (catches a genuine thrown
  // exception during React's unmount/cleanup pass) and AtlasSpatialScene's
  // own onError prop (catches the raw webglcontextlost DOM event) - both
  // paths can fire from Three.js's own intentional cleanup-on-unmount, not
  // just from a real failure, so both need the same activeRef guard.
  function handleSceneError() {
    if (!activeRef.current) return;
    setErroredOut(true);
    dispatch({ type: "SCENE_ERROR", reason: "atlas-canvas-error" });
  }

  const armPrefetch = () => {
    if (prefetchArmed || reducedMotion || !webglSupported) return;
    setPrefetchArmed(true);
    void import("./AtlasSpatialScene");
  };

  useEffect(() => {
    dispatch({ type: "SPATIAL_LOAD_STATE_SET", state: { status: active ? "loading" : "idle" } });
  }, [active, dispatch]);

  if (reducedMotion) {
    return (
      <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        3D view unavailable while reduced motion is enabled - the diagram above is complete.
      </p>
    );
  }

  if (!webglSupported) {
    return (
      <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        3D view unavailable - WebGL not supported in this browser. The diagram above is complete.
      </p>
    );
  }

  if (preferences.lowPowerMode) {
    return (
      <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        3D view unavailable while low-power mode is on - the diagram above is complete.
      </p>
    );
  }

  if (erroredOut) {
    return (
      <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        3D view failed to load - the diagram above is complete.
      </p>
    );
  }

  if (active) {
    return (
      <div className="mt-4">
        <div
          className="h-72 w-full overflow-hidden rounded border border-[var(--color-gold-primary)]/30 bg-[var(--color-dark-navy)] sm:h-96"
          role="img"
          aria-label={`Interactive 3D rendering of ${projectLabel}'s architecture - the same nodes as the diagram above, selectable in 3D`}
        >
          <SceneErrorBoundary onError={handleSceneError}>
            <AtlasSpatialScene
              flow={flow}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              qualityTier={qualityTier}
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
          className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:text-[var(--color-gold-primary)]"
        >
          Close 3D view
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        // Reset any error from a previous activation - this component
        // instance persists across scene switches (mutual exclusion only
        // hides its output, it doesn't unmount AtlasCanvasHost), so a stale
        // error flag must not survive a fresh activation attempt.
        setErroredOut(false);
        dispatch({ type: "SCENE_CHANGED", scene: "atlas" });
      }}
      onPointerEnter={armPrefetch}
      onFocus={armPrefetch}
      onTouchStart={armPrefetch}
      className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-gold-primary)] hover:text-[var(--color-gold-primary)]"
    >
      <Boxes size={13} aria-hidden />
      Enter 3D view
    </button>
  );
}
