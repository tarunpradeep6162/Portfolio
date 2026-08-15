"use client";

import { ControlRoomScene } from "@/components/v8/ControlRoomScene";
import { AtlasSceneContent } from "./AtlasSceneContent";

/**
 * The entire dynamic-import boundary for Atlas's 3D presence: this module
 * (and everything it imports - components/v8/ControlRoomScene.tsx,
 * @react-three/fiber, three, AtlasSceneContent) must load as one unit,
 * only on real user intent. AtlasCanvasHost.tsx dynamically imports this
 * file, not ControlRoomScene directly - ControlRoomScene imports
 * `{ Canvas } from "@react-three/fiber"` at module scope, so an earlier
 * version of this migration that had AtlasCanvasHost import
 * ControlRoomScene statically pulled Three.js into every /work/[slug]
 * page's initial bundle regardless of whether "Enter 3D view" was ever
 * clicked - a real regression against the "zero 3D bytes before intent"
 * requirement, caught by scripts/measure-v8-baseline.mjs (idle /work JS
 * jumped from ~752KB to ~1.68MB) before it shipped. This wrapper is the
 * fix: one dynamic import per scene that bundles the shared host together
 * with that scene's own content, so nothing Three.js-related is ever
 * reachable from an eagerly-loaded module again.
 */
export function AtlasControlRoomScene({
  flow,
  projectLabel,
  selectedNodeId,
  onSelectNode,
  cameraPosition,
  onError,
  className,
}: {
  flow: string;
  projectLabel: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  cameraPosition: [number, number, number];
  onError: () => void;
  className?: string;
}) {
  return (
    <ControlRoomScene
      scene="atlas"
      errorReason="atlas-canvas-error"
      ariaLabel={`Interactive 3D rendering of ${projectLabel}'s architecture - the same nodes as the diagram above, selectable in 3D`}
      className={className}
      cameraPosition={cameraPosition}
      cameraFov={34}
      onError={onError}
    >
      {() => (
        <AtlasSceneContent flow={flow} selectedNodeId={selectedNodeId} onSelectNode={onSelectNode} />
      )}
    </ControlRoomScene>
  );
}
