import { describe, it, expect } from "vitest";
import { classifyTopology } from "@/lib/v7/topologyClassifier";
import { parseFlowNodes } from "@/lib/v6/flowParser";
import { projects } from "@/content/projects";

function flowFor(slug: string): string {
  const project = projects.find((p) => p.slug === slug);
  if (project?.kind !== "flagship") throw new Error(`no flagship project ${slug}`);
  return project.flow;
}

describe("classifyTopology", () => {
  it("classifies Project Aurora's linear container pipeline as linear", () => {
    const nodes = parseFlowNodes(flowFor("project-aurora"));
    const result = classifyTopology(nodes);
    expect(result.kind).toBe("linear");
    expect(result.markedNodeId).toBeNull();
  });

  it("classifies Jenkins' 'Build (on agent)' as agent-branch, marking that exact node", () => {
    const nodes = parseFlowNodes(flowFor("distributed-jenkins-controller"));
    const result = classifyTopology(nodes);
    expect(result.kind).toBe("agent-branch");
    const markedNode = nodes.find((n) => n.id === result.markedNodeId);
    expect(markedNode?.label).toContain("on agent");
  });

  it("classifies Secure AWS (flow starts with 'Network') as perimeter", () => {
    const nodes = parseFlowNodes(flowFor("secure-aws-production-architecture"));
    const result = classifyTopology(nodes);
    expect(result.kind).toBe("perimeter");
    expect(nodes.find((n) => n.id === result.markedNodeId)?.label).toBe("Network");
  });

  it("classifies Node.js Auth's 'Cloud (EC2 + RDS)' as service-fork, marking that exact node", () => {
    const nodes = parseFlowNodes(flowFor("nodejs-auth-mysql-rds"));
    const result = classifyTopology(nodes);
    expect(result.kind).toBe("service-fork");
    const markedNode = nodes.find((n) => n.id === result.markedNodeId);
    expect(markedNode?.label).toContain("EC2 + RDS");
  });

  it("produces a genuinely different classification for at least three of the four real projects", () => {
    const kinds = new Set(
      ["project-aurora", "distributed-jenkins-controller", "secure-aws-production-architecture", "nodejs-auth-mysql-rds"].map(
        (slug) => classifyTopology(parseFlowNodes(flowFor(slug))).kind,
      ),
    );
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
});
