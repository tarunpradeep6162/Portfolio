"use client";

import { useId } from "react";
import { parseFlowEdges, parseFlowNodes } from "@/lib/v6/flowParser";
import { computeTopologyLayout, computeTopologyBounds } from "@/lib/v7/topologyLayout";
import { cn } from "@/lib/cn";

/**
 * A real, server-renderable (no 3D dependency) architecture diagram with
 * keyboard- and pointer-selectable nodes - the 2D foundation "Living
 * Infrastructure Atlas" is built on. A future intent-loaded 3D enhancement
 * is additive on top of this, not a replacement for it: this component
 * works completely, including node selection, with zero spatial/3D code
 * ever loaded.
 *
 * Each project gets a distinct accent purely from its own real category
 * data (components/work/ArchitectureDiagram.tsx's existing numbered-grid
 * treatment is left untouched for the case-study page; this is a separate,
 * selectable view for the Atlas).
 */
export function AtlasDiagram({
  flow,
  projectLabel,
  selectedNodeId,
  onSelectNode,
}: {
  flow: string;
  projectLabel: string;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const nodes = parseFlowNodes(flow);
  const edges = parseFlowEdges(nodes);
  // V7: layout shape (linear/agent-branch/service-fork/perimeter) is
  // derived from this project's own real flow content - see
  // docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md and
  // lib/v7/topologyClassifier.ts. Same LayoutPoint[] shape V6's
  // computeAtlasLayout produced, so nothing downstream of `layout` here
  // changed except the numbers.
  const layout = computeTopologyLayout(nodes);
  const bounds = computeTopologyBounds(layout);
  const titleId = useId();

  const pointFor = (nodeId: string) => layout.find((p) => p.nodeId === nodeId);

  return (
    <figure>
      <svg
        role="group"
        aria-labelledby={titleId}
        viewBox={`${bounds.minX - 20} ${bounds.minY - 20} ${bounds.width + 40} ${bounds.height + 40}`}
        className="w-full overflow-visible"
      >
        <title id={titleId}>{`${projectLabel} architecture: ${nodes.map((n) => n.label).join(" then ")}`}</title>
        {edges.map((edge) => {
          const from = pointFor(edge.from);
          const to = pointFor(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--line)"
              strokeWidth={1}
              aria-hidden
            />
          );
        })}
      </svg>
      <ol
        aria-label={`${projectLabel} architecture nodes, selectable`}
        className="mt-3 flex flex-wrap gap-2"
      >
        {nodes.map((node) => {
          const active = node.id === selectedNodeId;
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                aria-pressed={active}
                aria-label={`${node.label}, architecture node ${node.index + 1} of ${nodes.length}`}
                className={cn(
                  "rounded border px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] transition-colors",
                  active
                    ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]",
                )}
              >
                {node.label}
              </button>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {nodes.length} verified architecture node{nodes.length === 1 ? "" : "s"} · select one to inspect
      </figcaption>
    </figure>
  );
}
