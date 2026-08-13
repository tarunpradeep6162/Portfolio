import { describe, it, expect } from "vitest";
import { parseFlowNodes, parseFlowEdges } from "@/lib/v6/flowParser";
import { projects } from "@/content/projects";

// The four real flow strings from content/projects.ts, transcribed exactly -
// these are the actual fixtures the parser must handle correctly, not
// synthetic examples.
const AURORA_FLOW = "Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2";
const JENKINS_FLOW = "Commit -> Build (on agent) -> Test";
const SECURE_AWS_FLOW = "Network -> Cloud -> Observe -> Recover";
const NODEJS_AUTH_FLOW = "Build -> Container-free deploy -> Cloud (EC2 + RDS) -> Observe";

describe("parseFlowNodes", () => {
  it("splits Project Aurora's flow into exactly 7 nodes, preserving the App/MySQL compound label", () => {
    const nodes = parseFlowNodes(AURORA_FLOW);
    expect(nodes).toHaveLength(7);
    expect(nodes.map((n) => n.label)).toEqual([
      "Git",
      "Build",
      "Image",
      "Compose Network",
      "App/MySQL",
      "Nginx",
      "EC2",
    ]);
  });

  it("splits the Jenkins flow into exactly 3 nodes, preserving the 'Build (on agent)' compound label whole", () => {
    const nodes = parseFlowNodes(JENKINS_FLOW);
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.label)).toEqual(["Commit", "Build (on agent)", "Test"]);
  });

  it("splits the Secure AWS flow into exactly 4 nodes", () => {
    const nodes = parseFlowNodes(SECURE_AWS_FLOW);
    expect(nodes).toHaveLength(4);
    expect(nodes.map((n) => n.label)).toEqual(["Network", "Cloud", "Observe", "Recover"]);
  });

  it("splits the Node.js Auth flow into exactly 4 nodes, preserving both 'Container-free deploy' and 'Cloud (EC2 + RDS)' whole", () => {
    const nodes = parseFlowNodes(NODEJS_AUTH_FLOW);
    expect(nodes).toHaveLength(4);
    expect(nodes.map((n) => n.label)).toEqual([
      "Build",
      "Container-free deploy",
      "Cloud (EC2 + RDS)",
      "Observe",
    ]);
  });

  it("never splits on '/' or '(' - only on the '->' delimiter", () => {
    const nodes = parseFlowNodes(AURORA_FLOW);
    const appMysql = nodes.find((n) => n.label === "App/MySQL");
    expect(appMysql).toBeDefined();
    const jenkinsNodes = parseFlowNodes(JENKINS_FLOW);
    const buildOnAgent = jenkinsNodes.find((n) => n.label === "Build (on agent)");
    expect(buildOnAgent).toBeDefined();
  });

  it("assigns stable, unique ids per node", () => {
    const nodes = parseFlowNodes(AURORA_FLOW);
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Explicitly NOT asserting node count equals stage count anywhere in this
  // suite - the two are unrelated models per the content matrix, and a test
  // coupling them would be a real regression risk if either changes
  // independently for a legitimate reason.
});

describe("parseFlowEdges", () => {
  it("produces exactly nodeCount - 1 edges, connecting each node to the next in sequence", () => {
    const nodes = parseFlowNodes(SECURE_AWS_FLOW);
    const edges = parseFlowEdges(nodes);
    expect(edges).toHaveLength(3);
    expect(edges).toEqual([
      { from: nodes[0].id, to: nodes[1].id },
      { from: nodes[1].id, to: nodes[2].id },
      { from: nodes[2].id, to: nodes[3].id },
    ]);
  });

  it("produces zero edges for a single-node flow", () => {
    const nodes = parseFlowNodes("Solo");
    expect(parseFlowEdges(nodes)).toHaveLength(0);
  });
});

describe("parseFlowNodes against the real content/projects.ts data", () => {
  it("parses every flagship project's real flow field without throwing and produces at least one node", () => {
    for (const project of projects) {
      if (project.kind !== "flagship") continue;
      const nodes = parseFlowNodes(project.flow);
      expect(nodes.length).toBeGreaterThan(0);
    }
  });
});
