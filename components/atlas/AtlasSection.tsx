"use client";

import { useState } from "react";
import { parseFlowNodes } from "@/lib/v6/flowParser";
import { AtlasDiagram } from "./AtlasDiagram";
import { AtlasCanvasHost } from "./AtlasCanvasHost";

/**
 * A self-contained, server-renderable-shell client island: node-selection
 * state stays local (not the shared ExperienceProvider) so the 2D diagram
 * keeps working exactly as before with zero dependency on any spatial
 * system - the same local selection is passed to AtlasCanvasHost so the
 * intent-loaded 3D view (when active) reflects and updates the same
 * selection, without requiring 3D code to exist for 2D selection to work.
 */
export function AtlasSection({ flow, projectLabel }: { flow: string; projectLabel: string }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const nodes = parseFlowNodes(flow);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
        Living Infrastructure Atlas
      </p>
      <AtlasDiagram
        flow={flow}
        projectLabel={projectLabel}
        selectedNodeId={selectedNodeId}
        onSelectNode={(nodeId) => setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)}
      />
      <AtlasCanvasHost
        flow={flow}
        projectLabel={projectLabel}
        selectedNodeId={selectedNodeId}
        onSelectNode={(nodeId) => setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)}
      />
      {selectedNode && (
        <p
          role="status"
          className="mt-4 border border-[var(--color-gold-primary)]/30 bg-[var(--color-gold-primary)]/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink)]"
        >
          Node {selectedNode.index + 1} of {nodes.length}: {selectedNode.label}
        </p>
      )}
    </div>
  );
}
