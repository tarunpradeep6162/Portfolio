import type { ArchitectureEdge, ArchitectureNode } from "./types";

/**
 * Every flagship project's `flow` field uses " -> " as its ONLY node
 * delimiter - never "/" or "()", both of which appear *inside* real
 * compound node labels ("App/MySQL", "Build (on agent)", "Cloud (EC2 +
 * RDS)", "Container-free deploy"). Splitting on those characters would
 * silently corrupt every one of those labels. Splitting only on " -> "
 * cannot do that, because none of the four real flow strings contain an
 * arrow inside a compound label - verified against all four below in
 * flowParser.test.ts, not assumed.
 */
const NODE_DELIMITER = "->";

function slugifyLabel(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${index}-${slug}`;
}

export function parseFlowNodes(flow: string): ArchitectureNode[] {
  return flow
    .split(NODE_DELIMITER)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((label, index) => ({
      id: slugifyLabel(label, index),
      label,
      index,
    }));
}

export function parseFlowEdges(nodes: ArchitectureNode[]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }
  return edges;
}
