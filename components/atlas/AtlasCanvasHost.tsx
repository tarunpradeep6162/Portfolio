"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Boxes } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { computeAtlasSceneGeometry } from "@/lib/v8/atlasSceneGeometry";

const AtlasControlRoomScene = dynamic(
  () => import("./AtlasControlRoomScene").then((mod) => mod.AtlasControlRoomScene),
  { ssr: false },
);

interface AtlasCanvasHostProps {
  flow: string;
  projectLabel: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

/**
 * V8 Phase 2: the intent-loaded spatial enhancement on top of
 * AtlasSection's always-present 2D diagram, now mounted through the
 * shared components/v8/ControlRoomScene.tsx instead of owning its own
 * Canvas/SceneErrorBoundary/context-loss-listener/activeRef boilerplate -
 * that entire lifecycle (previously duplicated identically across Atlas,
 * Operational Twin, and RC-01) now lives in exactly one place. This host
 * keeps only what's genuinely Atlas-specific: the reduced-motion/no-WebGL/
 * low-power/errored fallback messages, the "Enter 3D view"/"Close 3D view"
 * controls (mutually exclusive with the active scene, exactly as V7), and
 * the camera's project-specific centerX (computed once here via the same
 * pure lib/v8/atlasSceneGeometry helper AtlasSceneContent uses to render,
 * so both agree on the same number without duplicating the layout math).
 *
 * Zero bytes of @react-three/fiber/three/AtlasSceneContent are requested
 * until a real user gesture (hover/focus/touch/click) on "Enter 3D view" -
 * unchanged from V7.
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

  const armPrefetch = () => {
    if (prefetchArmed || reducedMotion || !webglSupported) return;
    setPrefetchArmed(true);
    void import("./AtlasControlRoomScene");
  };

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

  // Same ordering/short-circuit as V7's AtlasCanvasHost: once erroredOut is
  // set, this branch owns rendering permanently for this mounted instance -
  // preserved for behavioral parity (see docs/PORTFOLIO_V8_PHASE2_ATLAS.md).
  if (erroredOut) {
    return (
      <p className="mt-4 font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        3D view failed to load - the diagram above is complete.
      </p>
    );
  }

  if (active) {
    const centerX = computeAtlasSceneGeometry(flow).centerX;
    return (
      <div className="mt-4">
        <AtlasControlRoomScene
          flow={flow}
          projectLabel={projectLabel}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          cameraPosition={[centerX, 0.6, 3.4]}
          onError={() => setErroredOut(true)}
          className="h-72 w-full overflow-hidden rounded border border-[var(--color-signal-lime)]/30 bg-[var(--color-control-black)] sm:h-96"
        />
        <button
          type="button"
          onClick={() => dispatch({ type: "SCENE_CHANGED", scene: null })}
          className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:text-[var(--color-signal-lime)]"
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
        setErroredOut(false);
        dispatch({ type: "SCENE_CHANGED", scene: "atlas" });
      }}
      onPointerEnter={armPrefetch}
      onFocus={armPrefetch}
      onTouchStart={armPrefetch}
      className="mt-4 inline-flex items-center gap-2 rounded border border-[var(--line)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
    >
      <Boxes size={13} aria-hidden />
      Enter 3D view
    </button>
  );
}
