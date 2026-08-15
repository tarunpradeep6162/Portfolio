import type { ArchitectureNode } from "@/lib/v6/types";

export type TopologyKind = "linear" | "agent-branch" | "service-fork" | "perimeter";

export interface TopologyClassification {
  kind: TopologyKind;
  /** For "agent-branch"/"service-fork": which node id carries the real
   * annotation the classification is based on - never a guess, always
   * traceable back to the node's own label text. */
  markedNodeId: string | null;
}

/**
 * Classifies a project's real architecture-node sequence into one of a
 * few genuinely different topology shapes, using structural cues already
 * present in the project's own `flow` content - never invented. Verified
 * against all four real flagship flow strings in
 * topologyClassifier.test.ts, not assumed to generalize.
 *
 * - "agent-branch": a node's label contains "(on <something>)" - e.g.
 *   "Build (on agent)" - a real signal that stage runs on separate
 *   compute from its neighbors (Jenkins controller/agent separation).
 * - "service-fork": a node's label contains "+" inside parentheses -
 *   e.g. "Cloud (EC2 + RDS)" - a real signal that stage is actually two
 *   parallel services, not one.
 * - "perimeter": the flow's first node is literally "Network" - the
 *   project's own content leads with a network-perimeter concept rather
 *   than a build step, matching Secure AWS's real network/cloud/observe/
 *   recover shape.
 * - "linear": none of the above apply - the honest default for a
 *   genuinely sequential pipeline (Project Aurora).
 */
export function classifyTopology(nodes: ArchitectureNode[]): TopologyClassification {
  const forkNode = nodes.find((node) => /\([^)]*\+[^)]*\)/.test(node.label));
  if (forkNode) {
    return { kind: "service-fork", markedNodeId: forkNode.id };
  }

  const branchNode = nodes.find((node) => /\(on [^)]+\)/i.test(node.label));
  if (branchNode) {
    return { kind: "agent-branch", markedNodeId: branchNode.id };
  }

  if (nodes[0]?.label.trim().toLowerCase() === "network") {
    return { kind: "perimeter", markedNodeId: nodes[0].id };
  }

  return { kind: "linear", markedNodeId: null };
}
