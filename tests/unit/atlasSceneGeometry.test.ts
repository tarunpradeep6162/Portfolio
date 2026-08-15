import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { computeAtlasSceneGeometry, ATLAS_SCALE } from "@/lib/v8/atlasSceneGeometry";
import { computeTopologyLayout } from "@/lib/v7/topologyLayout";
import { parseFlowEdges, parseFlowNodes } from "@/lib/v6/flowParser";
import { projects } from "@/content/projects";

function flowFor(slug: string): string {
  const project = projects.find((p) => p.slug === slug);
  if (project?.kind !== "flagship") throw new Error(`no flagship project ${slug}`);
  return project.flow;
}

/**
 * Reproduces AtlasSpatialScene.tsx's original inline computation exactly,
 * to prove computeAtlasSceneGeometry (extracted for Phase 2) is a real
 * behavioral no-op, not just a plausible-looking rewrite.
 */
function originalComputation(flow: string) {
  const SCALE = 1 / 55;
  const nodes = parseFlowNodes(flow);
  const edges = parseFlowEdges(nodes);
  const layout = computeTopologyLayout(nodes);
  const positioned = layout.map((point) => ({
    ...point,
    position: [point.x * SCALE, -point.y * SCALE, 0] as [number, number, number],
  }));
  const centerX =
    positioned.reduce((sum, p) => sum + p.position[0], 0) / (positioned.length || 1);
  const edgeSegments = edges
    .map((edge) => {
      const from = positioned.find((p) => p.nodeId === edge.from);
      const to = positioned.find((p) => p.nodeId === edge.to);
      if (!from || !to) return null;
      return [new THREE.Vector3(...from.position), new THREE.Vector3(...to.position)] as [
        THREE.Vector3,
        THREE.Vector3,
      ];
    })
    .filter((s): s is [THREE.Vector3, THREE.Vector3] => s !== null);
  return { positioned, centerX, edgeSegments };
}

const FLAGSHIP_SLUGS = [
  "project-aurora",
  "distributed-jenkins-controller",
  "secure-aws-production-architecture",
  "nodejs-auth-mysql-rds",
];

describe("computeAtlasSceneGeometry", () => {
  it("uses the same 1/55 scale AtlasSpatialScene.tsx used", () => {
    expect(ATLAS_SCALE).toBe(1 / 55);
  });

  for (const slug of FLAGSHIP_SLUGS) {
    it(`matches the original inline computation exactly for ${slug} (node positions, centerX, edges)`, () => {
      const flow = flowFor(slug);
      const geometry = computeAtlasSceneGeometry(flow);
      const original = originalComputation(flow);

      expect(geometry.nodes.map((n) => n.position)).toEqual(
        original.positioned.map((p) => p.position),
      );
      expect(geometry.centerX).toBeCloseTo(original.centerX, 10);
      expect(geometry.edges.length).toBe(original.edgeSegments.length);
      geometry.edges.forEach((segment, i) => {
        const [a, b] = segment;
        const [origA, origB] = original.edgeSegments[i];
        expect(a).toEqual([origA.x, origA.y, origA.z]);
        expect(b).toEqual([origB.x, origB.y, origB.z]);
      });
    });
  }
});
