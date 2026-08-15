import { parseFlowEdges, parseFlowNodes } from "@/lib/v6/flowParser";
import { computeTopologyLayout } from "@/lib/v7/topologyLayout";

/**
 * Pure geometry extracted from AtlasSpatialScene.tsx unchanged (same
 * SCALE, same computation) so it can be called from two places that need
 * the same answer for different reasons: AtlasCanvasHost needs `centerX`
 * alone to position ControlRoomScene's camera (fixed at Canvas-creation
 * time, before any Canvas content renders), and AtlasSceneContent needs
 * the full node/edge positions to actually render. Kept framework-free
 * (no React, no Three.js types) so it stays trivially unit-testable, same
 * as lib/v7/topologyLayout.ts.
 */
export const ATLAS_SCALE = 1 / 55;

export interface AtlasPositionedNode {
  nodeId: string;
  position: [number, number, number];
}

export type AtlasEdgeSegment = [[number, number, number], [number, number, number]];

export interface AtlasSceneGeometry {
  nodes: AtlasPositionedNode[];
  edges: AtlasEdgeSegment[];
  centerX: number;
}

export function computeAtlasSceneGeometry(flow: string): AtlasSceneGeometry {
  const nodes = parseFlowNodes(flow);
  const edges = parseFlowEdges(nodes);
  const layout = computeTopologyLayout(nodes);

  const positioned: AtlasPositionedNode[] = layout.map((point) => ({
    nodeId: point.nodeId,
    position: [point.x * ATLAS_SCALE, -point.y * ATLAS_SCALE, 0],
  }));

  const centerX =
    positioned.reduce((sum, p) => sum + p.position[0], 0) / (positioned.length || 1);

  const positionById = new Map(positioned.map((p) => [p.nodeId, p.position]));
  const edgeSegments: AtlasEdgeSegment[] = edges
    .map((edge): AtlasEdgeSegment | null => {
      const from = positionById.get(edge.from);
      const to = positionById.get(edge.to);
      if (!from || !to) return null;
      return [from, to];
    })
    .filter((segment): segment is AtlasEdgeSegment => segment !== null);

  return { nodes: positioned, edges: edgeSegments, centerX };
}
