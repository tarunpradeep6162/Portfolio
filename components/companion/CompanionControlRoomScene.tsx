"use client";

import { ControlRoomScene } from "@/components/v8/ControlRoomScene";
import { RC01Model } from "./RC01Model";
import { qualityPresets, type CompanionState } from "@/lib/companion/state";

/**
 * The entire dynamic-import boundary for RC-01's optional 3D portrait -
 * same shape as AtlasControlRoomScene.tsx and
 * OperationalTwinControlRoomScene.tsx (V8 Phases 2-3). RC01Model.tsx was
 * already pure content with no Canvas of its own (unlike the old
 * AtlasSpatialScene.tsx/OperationalTwinScene.tsx, which each owned a
 * <Canvas>), so no separate extraction step was needed here - this
 * wrapper is the only new file RC-01's migration requires.
 *
 * Per the approved V8 product decision: RC-01's controls, captions, and
 * portrait (CompanionPortrait.tsx, the always-accessible DOM/SVG
 * fallback) stay exactly as they are in CompanionExperience.tsx - this
 * wrapper only replaces the old CompanionCanvas.tsx's Canvas-owning
 * lifecycle, it does not touch RC-01's DOM UI, console, or tours.
 */
export function CompanionControlRoomScene({
  state,
  accentColor,
  onError,
  className,
}: {
  state: CompanionState;
  accentColor?: string | null;
  onError: () => void;
  className?: string;
}) {
  return (
    <ControlRoomScene
      scene="rc01"
      errorReason="rc01-canvas-error"
      ariaLabel="RC-01, the Reliability Companion's animated 3D portrait"
      className={className}
      cameraPosition={[0, 0.05, 3.3]}
      cameraFov={30}
      onError={onError}
      // Unlike Atlas/Operational Twin, RC-01's outer panel (owned by
      // CompanionRoot.tsx) reads the same `activeScene` field to decide
      // whether the whole panel is open - not just this 3D portrait. A
      // canvas failure here must fall back to CompanionPortrait.tsx, not
      // close RC-01 entirely (the original CompanionCanvas.tsx never
      // dispatched SCENE_ERROR for exactly this reason).
      deactivateOnError={false}
    >
      {(ctx) => (
        <RC01Model
          state={state}
          fullEmissiveDetail={qualityPresets[ctx.qualityTier].fullEmissiveDetail}
          accentColor={accentColor ?? undefined}
        />
      )}
    </ControlRoomScene>
  );
}
