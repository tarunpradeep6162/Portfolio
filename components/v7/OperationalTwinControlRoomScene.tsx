"use client";

import { ControlRoomScene } from "@/components/v8/ControlRoomScene";
import { OperationalTwinSceneContent } from "./OperationalTwinSceneContent";
import type { SpineInstrument } from "@/lib/v7/spineInstruments";

/**
 * The entire dynamic-import boundary for the Operational Twin's 3D
 * presence - same shape as components/atlas/AtlasControlRoomScene.tsx
 * (V8 Phase 2), and for the same reason: ControlRoomScene imports
 * `{ Canvas } from "@react-three/fiber"` at module scope, so
 * OperationalTwinHost.tsx must dynamically import *this* wrapper, never
 * ControlRoomScene directly, or Three.js would load on every homepage
 * visit regardless of whether "Activate Operational Twin" is ever
 * clicked.
 */
export function OperationalTwinControlRoomScene({
  selectedStageId,
  onSelectStage,
  onError,
  className,
}: {
  selectedStageId: string | null;
  onSelectStage: (stageId: SpineInstrument["stageId"]) => void;
  onError: () => void;
  className?: string;
}) {
  return (
    <ControlRoomScene
      scene="operational-twin"
      errorReason="operational-twin-canvas-error"
      ariaLabel="The Operational Twin: an interactive instrument deck representing the real delivery pipeline from commit to recovery"
      className={className}
      cameraPosition={[0, 2.6, 8.6]}
      cameraFov={38}
      onError={onError}
    >
      {() => (
        <OperationalTwinSceneContent
          selectedStageId={selectedStageId}
          onSelectStage={onSelectStage}
        />
      )}
    </ControlRoomScene>
  );
}
