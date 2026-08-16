import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "@/lib/v9/evidenceGraph";
import { projects } from "@/content/projects";
import { isReady } from "@/content/types";

describe("evidenceGraph", () => {
  it("produces exactly one chain per flagship project, never for a lab project", () => {
    const chains = buildEvidenceGraph();
    const flagshipSlugs = projects.filter((p) => p.kind === "flagship").map((p) => p.slug);
    expect(chains.map((c) => c.projectSlug).sort()).toEqual(flagshipSlugs.sort());
  });

  it("Project Aurora's repository node is verified with its real GitHub URL", () => {
    const chains = buildEvidenceGraph();
    const aurora = chains.find((c) => c.projectSlug === "project-aurora")!;
    const repoNode = aurora.nodes.find((n) => n.label === "Repository")!;
    expect(repoNode.status).toBe("verified");
    expect(repoNode.href).toBe("https://github.com/tarunpradeep6162/ProjectAurora/");
  });

  it("every other flagship project's repository node is needs-input - none has a fabricated link", () => {
    const chains = buildEvidenceGraph();
    for (const chain of chains) {
      if (chain.projectSlug === "project-aurora") continue;
      const repoNode = chain.nodes.find((n) => n.label === "Repository")!;
      expect(repoNode.status).toBe("needs-input");
      expect(repoNode.href).toBeUndefined();
    }
  });

  it("every flagship project's screenshot node is needs-input - matches CONTENT_GAPS.md (0 screenshots supplied)", () => {
    const chains = buildEvidenceGraph();
    for (const chain of chains) {
      const screenshotNode = chain.nodes.find((n) => n.label === "Screenshot")!;
      expect(screenshotNode.status).toBe("needs-input");
    }
  });

  it("a needs-input node always carries a real, non-empty detail string - never a blank placeholder", () => {
    const chains = buildEvidenceGraph();
    for (const chain of chains) {
      for (const node of chain.nodes) {
        if (node.status === "needs-input") {
          expect(node.detail.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("spine stage labels are real labels from content/spine.ts, matching each project's own spineStages field", () => {
    const chains = buildEvidenceGraph();
    const aurora = chains.find((c) => c.projectSlug === "project-aurora")!;
    const project = projects.find((p) => p.slug === "project-aurora");
    if (project?.kind !== "flagship") throw new Error("expected flagship");
    expect(aurora.spineStageLabels).toHaveLength(project.spineStages.length);
    // Real labels, not raw ids (e.g. "Commit" not "commit").
    expect(aurora.spineStageLabels).toContain("Commit");
  });

  it("would flip a repository node to verified automatically if the real content field were ever supplied - not hardcoded per-slug", () => {
    // Confirms the logic reads project.links generically, not via a
    // per-slug allowlist - any flagship project with a real "Repository"
    // link would be picked up the same way Aurora's is.
    const chains = buildEvidenceGraph();
    const withRepo = chains.filter((c) => c.nodes.find((n) => n.label === "Repository")?.status === "verified");
    expect(withRepo).toHaveLength(
      projects.filter((p) => p.kind === "flagship" && p.links.some((l) => l.label === "Repository")).length,
    );
  });

  it("screenshot status matches isReady() on the project's own Field<T> - reuses the existing type guard", () => {
    const chains = buildEvidenceGraph();
    const flagships = projects.filter((p) => p.kind === "flagship");
    for (const project of flagships) {
      if (project.kind !== "flagship") continue;
      const chain = chains.find((c) => c.projectSlug === project.slug)!;
      const screenshotNode = chain.nodes.find((n) => n.label === "Screenshot")!;
      expect(screenshotNode.status).toBe(isReady(project.screenshot) ? "verified" : "needs-input");
    }
  });
});
