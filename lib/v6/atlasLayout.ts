import type { ArchitectureNode } from "./types";

export interface LayoutPoint {
  nodeId: string;
  x: number;
  y: number;
}

/**
 * Deterministic layout only - no per-project hand-authored coordinates.
 * Nodes are placed along a gentle zig-zag path (alternating y-offset every
 * other node) purely as a function of node count/order, so any project's
 * real flow - 3 nodes or 7 - lays out consistently without per-project
 * special-casing. Visual *identity* differences between projects (Aurora's
 * build/image/container path, Jenkins' controller/agent split, etc.) are a
 * presentation-layer concern applied on top of this layout, not encoded
 * into the coordinates themselves.
 */
const STEP_X = 160;
const ROW_HEIGHT = 96;
const ZIGZAG_OFFSET = 40;

export function computeAtlasLayout(nodes: ArchitectureNode[]): LayoutPoint[] {
  return nodes.map((node, i) => ({
    nodeId: node.id,
    x: i * STEP_X,
    y: i % 2 === 0 ? 0 : -ZIGZAG_OFFSET,
  }));
}

export function layoutBounds(points: LayoutPoint[]): { width: number; height: number } {
  if (points.length === 0) return { width: 0, height: ROW_HEIGHT };
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  return { width: maxX + STEP_X, height: maxY - minY + ROW_HEIGHT };
}
