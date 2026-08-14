import type { ArchitectureNode } from "@/lib/v6/types";
import type { LayoutPoint } from "@/lib/v6/atlasLayout";
import { classifyTopology } from "./topologyClassifier";

export interface TopologyBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/**
 * Real bounds derived from actual coordinates, not lib/v6/atlasLayout.ts's
 * layoutBounds() assumption that every layout starts at x=0/y>=-40 - true
 * for the original zigzag line, not true for the branch/fork/perimeter
 * shapes below (a branch node can go well above y=-40, a perimeter arc
 * can go negative on x). AtlasDiagram.tsx's SVG viewBox must be computed
 * from these, not the old hardcoded "-20 -60" offset, or off-template
 * shapes render clipped.
 */
export function computeTopologyBounds(points: LayoutPoint[]): TopologyBounds {
  if (points.length === 0) return { minX: 0, minY: 0, width: STEP_X, height: 96 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, width: maxX - minX + STEP_X, height: maxY - minY + 96 };
}

const STEP_X = 160;
const ZIGZAG_OFFSET = 40;
const BRANCH_OFFSET = 140;
const FORK_OFFSET = 110;
const FORK_COMPRESSION = 0.55;

/**
 * Four genuinely different node silhouettes, one per real topology kind
 * from lib/v7/topologyClassifier.ts - not a shared template with
 * different labels. Returns the same LayoutPoint[] shape
 * lib/v6/atlasLayout.ts's computeAtlasLayout already produces, so both
 * AtlasDiagram.tsx (2D SVG) and AtlasSpatialScene.tsx (3D) pick this up
 * through their existing single call site with no rendering-component
 * changes - the topology difference lives entirely in the coordinates.
 */
export function computeTopologyLayout(nodes: ArchitectureNode[]): LayoutPoint[] {
  const classification = classifyTopology(nodes);

  switch (classification.kind) {
    case "agent-branch":
      return nodes.map((node, i) => ({
        nodeId: node.id,
        x: i * STEP_X,
        y:
          node.id === classification.markedNodeId
            ? -BRANCH_OFFSET
            : i % 2 === 0
              ? 0
              : -ZIGZAG_OFFSET,
      }));

    case "service-fork": {
      const markedIndex = nodes.findIndex((n) => n.id === classification.markedNodeId);
      // Cumulative, strictly increasing x - compressing the spacing
      // immediately either side of the fork node (not the node's own
      // index-based position independently) is what avoids an x-axis
      // crossover between the fork node and its compressed neighbor,
      // which an earlier version of this function had (caught by
      // actually looking at the rendered screenshot, not just the
      // numbers - see commit history).
      const xs: number[] = [0];
      for (let i = 1; i < nodes.length; i++) {
        const isAdjacentToFork = i === markedIndex || i - 1 === markedIndex;
        xs.push(xs[i - 1] + (isAdjacentToFork ? STEP_X * FORK_COMPRESSION : STEP_X));
      }
      return nodes.map((node, i) => ({
        nodeId: node.id,
        x: xs[i],
        y: i === markedIndex ? FORK_OFFSET : i % 2 === 0 ? 0 : -ZIGZAG_OFFSET,
      }));
    }

    case "perimeter": {
      // An arc, not a line - Secure AWS's real content leads with
      // "Network" as a perimeter concept, not a pipeline step, so this
      // reads as a boundary the later stages sit inside/behind rather
      // than a left-to-right build sequence.
      const radius = (nodes.length - 1) * (STEP_X / 1.7) || STEP_X;
      const arcSpan = Math.PI * 0.65;
      const startAngle = Math.PI / 2 + arcSpan / 2;
      return nodes.map((node, i) => {
        const t = nodes.length > 1 ? i / (nodes.length - 1) : 0;
        const angle = startAngle - t * arcSpan;
        return {
          nodeId: node.id,
          x: Math.cos(angle) * radius,
          y: (Math.sin(angle) - 1) * radius,
        };
      });
    }

    case "linear":
    default:
      return nodes.map((node, i) => ({
        nodeId: node.id,
        x: i * STEP_X,
        y: i % 2 === 0 ? 0 : -ZIGZAG_OFFSET,
      }));
  }
}
