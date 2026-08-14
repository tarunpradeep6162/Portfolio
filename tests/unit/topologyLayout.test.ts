import { describe, it, expect } from "vitest";
import { computeTopologyLayout } from "@/lib/v7/topologyLayout";
import { computeAtlasLayout } from "@/lib/v6/atlasLayout";
import { parseFlowNodes } from "@/lib/v6/flowParser";
import { projects } from "@/content/projects";

function nodesFor(slug: string) {
  const project = projects.find((p) => p.slug === slug);
  if (project?.kind !== "flagship") throw new Error(`no flagship project ${slug}`);
  return parseFlowNodes(project.flow);
}

describe("computeTopologyLayout", () => {
  it("matches the original linear zigzag exactly for Project Aurora (linear kind)", () => {
    const nodes = nodesFor("project-aurora");
    expect(computeTopologyLayout(nodes)).toEqual(computeAtlasLayout(nodes));
  });

  it("gives Jenkins' agent-branch node a distinctly larger vertical offset than its neighbors", () => {
    const nodes = nodesFor("distributed-jenkins-controller");
    const layout = computeTopologyLayout(nodes);
    const branchNode = nodes.find((n) => n.label.includes("on agent"))!;
    const branchPoint = layout.find((p) => p.nodeId === branchNode.id)!;
    const otherOffsets = layout
      .filter((p) => p.nodeId !== branchNode.id)
      .map((p) => Math.abs(p.y));
    expect(Math.abs(branchPoint.y)).toBeGreaterThan(Math.max(...otherOffsets));
  });

  it("compresses Node.js Auth's neighbors around the service-fork node instead of even spacing", () => {
    const nodes = nodesFor("nodejs-auth-mysql-rds");
    const linear = computeAtlasLayout(nodes);
    const topology = computeTopologyLayout(nodes);
    // At least one node's x position differs from the plain even-spacing
    // layout - proof the fork actually changed the shape, not just labels.
    const anyXDiffers = nodes.some((node, i) => linear[i].x !== topology[i].x);
    expect(anyXDiffers).toBe(true);
  });

  it("keeps x positions strictly increasing around the service-fork node (no line crossover)", () => {
    // Regression test: an earlier version compressed each node's x
    // independently by index, which could put the fork node's neighbor
    // at a smaller x than the fork node itself, drawing the connector
    // line backward across itself - only caught by looking at the
    // rendered screenshot, not the raw numbers, so this test exists to
    // make that specific mistake fail loudly next time.
    const nodes = nodesFor("nodejs-auth-mysql-rds");
    const layout = computeTopologyLayout(nodes);
    for (let i = 1; i < layout.length; i++) {
      expect(layout[i].x).toBeGreaterThan(layout[i - 1].x);
    }
  });

  it("arranges Secure AWS along a curved arc (perimeter), not a straight line", () => {
    const nodes = nodesFor("secure-aws-production-architecture");
    const layout = computeTopologyLayout(nodes);
    // A straight line has y as a simple function of x with no curvature;
    // an arc's points do not all satisfy that same linear relationship.
    const first = layout[0];
    const last = layout[layout.length - 1];
    const slope = (last.y - first.y) / (last.x - first.x || 1);
    const midpoint = layout[Math.floor(layout.length / 2)];
    const expectedYOnLine = first.y + slope * (midpoint.x - first.x);
    expect(Math.abs(midpoint.y - expectedYOnLine)).toBeGreaterThan(5);
  });

  it("produces finite, non-NaN coordinates for every real flagship project", () => {
    for (const slug of [
      "project-aurora",
      "distributed-jenkins-controller",
      "secure-aws-production-architecture",
      "nodejs-auth-mysql-rds",
    ]) {
      const layout = computeTopologyLayout(nodesFor(slug));
      for (const point of layout) {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
      }
    }
  });
});
