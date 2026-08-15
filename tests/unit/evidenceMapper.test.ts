import { describe, it, expect } from "vitest";
import { computeEvidenceRecords } from "@/lib/v7/evidenceMapper";
import { projects } from "@/content/projects";

describe("computeEvidenceRecords", () => {
  const records = computeEvidenceRecords();

  it("produces at least one record for every real project", () => {
    for (const project of projects) {
      expect(records.some((r) => r.projectSlug === project.slug)).toBe(true);
    }
  });

  it("every record has a valid status and non-empty claim", () => {
    for (const record of records) {
      expect(["verified", "explained", "missing"]).toContain(record.status);
      expect(record.claim.length).toBeGreaterThan(0);
    }
  });

  it("every 'missing' record carries a real limitation explaining what's absent", () => {
    for (const record of records.filter((r) => r.status === "missing")) {
      expect(record.limitation).toBeTruthy();
    }
  });

  it("every 'verified' link record's sourceUrl matches a real href from content/projects.ts - never invented", () => {
    const realHrefs = new Set<string>();
    for (const project of projects) {
      if (project.kind === "flagship") {
        project.links.forEach((l) => realHrefs.add(l.href));
      } else if (project.links.status === "ready") {
        project.links.value.forEach((l) => realHrefs.add(l.href));
      }
    }
    for (const record of records.filter((r) => r.status === "verified" && r.sourceUrl)) {
      expect(realHrefs.has(record.sourceUrl!)).toBe(true);
    }
  });

  it("Project Aurora (the only flagship project with a real link) has at least one verified link record", () => {
    const auroraLinks = records.filter(
      (r) => r.projectSlug === "project-aurora" && r.status === "verified" && r.sourceUrl,
    );
    expect(auroraLinks.length).toBeGreaterThan(0);
  });

  it("the other three flagship projects (no real links) each have a missing-link record", () => {
    for (const slug of [
      "distributed-jenkins-controller",
      "secure-aws-production-architecture",
      "nodejs-auth-mysql-rds",
    ]) {
      expect(
        records.some(
          (r) => r.projectSlug === slug && r.status === "missing" && r.claim.includes("repository"),
        ),
      ).toBe(true);
    }
  });

  it("Secure AWS's learning-implementation disclosure appears as an 'explained' record, never hidden", () => {
    const disclosure = records.find(
      (r) => r.projectSlug === "secure-aws-production-architecture" && r.claim.includes("learning implementation"),
    );
    expect(disclosure?.status).toBe("explained");
  });
});
