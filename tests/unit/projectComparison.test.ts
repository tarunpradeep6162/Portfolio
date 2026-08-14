import { describe, it, expect } from "vitest";
import { compareProjects } from "@/lib/v7/projectComparison";
import { projects } from "@/content/projects";
import type { FlagshipProject } from "@/content/types";

function flagship(slug: string): FlagshipProject {
  const project = projects.find((p) => p.slug === slug);
  if (project?.kind !== "flagship") throw new Error(`no flagship ${slug}`);
  return project;
}

describe("compareProjects", () => {
  const aurora = flagship("project-aurora");
  const secureAws = flagship("secure-aws-production-architecture");

  it("returns one row per comparison dimension, both sides populated", () => {
    const rows = compareProjects(aurora, secureAws);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.left.length).toBeGreaterThan(0);
      expect(row.right.length).toBeGreaterThan(0);
    }
  });

  it("surfaces Secure AWS's real IAM/security-group decisions in the security row, not an invented summary", () => {
    const rows = compareProjects(aurora, secureAws);
    const securityRow = rows.find((r) => r.dimension === "Security-related decisions")!;
    expect(securityRow.right.toLowerCase()).toContain("iam");
  });

  it("honestly reports 'not documented' when a project has no matching security-related text", () => {
    const jenkins = flagship("distributed-jenkins-controller");
    const rows = compareProjects(jenkins, secureAws);
    const securityRow = rows.find((r) => r.dimension === "Security-related decisions")!;
    // Jenkins' real implementation decisions don't mention IAM/VPC/encryption/etc.
    expect(securityRow.left).toBe("Not documented for this project.");
  });

  it("shows genuinely different architecture shapes for projects with different topology", () => {
    const jenkins = flagship("distributed-jenkins-controller");
    const rows = compareProjects(aurora, jenkins);
    const shapeRow = rows.find((r) => r.dimension === "Architecture shape")!;
    expect(shapeRow.left).not.toBe(shapeRow.right);
  });

  it("evidence-available row reflects Aurora's real link and the other projects' real absence of one", () => {
    const jenkins = flagship("distributed-jenkins-controller");
    const rows = compareProjects(aurora, jenkins);
    const evidenceRow = rows.find((r) => r.dimension === "Evidence available")!;
    expect(evidenceRow.left).toContain("verified link");
    expect(evidenceRow.right).toContain("No verified link");
  });
});
