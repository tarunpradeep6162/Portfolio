import { describe, it, expect } from "vitest";
import { buildKnowledgeBase } from "@/lib/rc01/knowledge";
import { SYSTEM_PROMPT, contextPreamble } from "@/lib/rc01/prompt";
import { RC01_TOOLS } from "@/lib/rc01/tools";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";
import { certifications } from "@/content/certifications";
import { resumeFile } from "@/content/site";
import { resolveInternalHref } from "@/lib/rc01/routes";
import golden from "@/tests/rc01-eval/golden.json";

describe("RC-01 knowledge base", () => {
  const kb = buildKnowledgeBase();

  it("is deterministic, so the cached prompt prefix is byte-identical across requests", () => {
    expect(buildKnowledgeBase()).toBe(kb);
    expect(SYSTEM_PROMPT).toContain(kb);
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
  });

  it("covers every flagship case study with its source page", () => {
    for (const project of projects.filter((p) => p.kind === "flagship")) {
      expect(kb).toContain(`Flagship case study: ${project.title} (source: /work/${project.slug})`);
      expect(kb).toContain(project.outcome);
    }
  });

  it("lists every lab project and every role", () => {
    for (const project of projects.filter((p) => p.kind === "lab")) expect(kb).toContain(project.title);
    for (const role of experience) expect(kb).toContain(role.org);
    for (const cert of certifications) expect(kb).toContain(cert.name);
  });

  it("states missing facts as unknown instead of dropping them", () => {
    const missing = experience.filter((role) => role.achievements.status === "needs-input");
    expect(missing.length).toBeGreaterThan(0);
    expect(kb).toMatch(/Achievements: NOT PUBLISHED YET/);
    if (resumeFile.status === "needs-input") expect(kb).toContain("Résumé PDF: NOT PUBLISHED YET");
  });

  it("never serialises an undefined or [object Object] value", () => {
    expect(kb).not.toMatch(/undefined|\[object Object\]/);
  });

  it("frames blog posts as articles, not production experience", () => {
    expect(kb).toMatch(/not claims of specific production work/);
  });
});

describe("RC-01 prompt and tools", () => {
  it("keeps per-request context out of the system prompt", () => {
    const preamble = contextPreamble({
      path: "/work/project-aurora",
      section: null,
      audience: "engineer",
      dwellSeconds: 42,
      returningVisitor: true,
    });
    expect(preamble).toContain("/work/project-aurora");
    expect(preamble).toContain("42 seconds");
    expect(SYSTEM_PROMPT).not.toContain("visitor_context>\nPage");
  });

  it("omits dwell time until the visitor has actually been reading", () => {
    const preamble = contextPreamble({
      path: "/",
      section: "spine",
      audience: null,
      dwellSeconds: 5,
      returningVisitor: false,
    });
    expect(preamble).not.toContain("seconds");
    expect(preamble).toContain("Audience: not yet known");
  });

  it("declares a closed, schema-constrained tool set", () => {
    expect(RC01_TOOLS.map((tool) => tool.name)).toEqual([
      "navigate",
      "scroll_to_section",
      "highlight_spine_stage",
      "gesture",
      "set_audience",
      "copy_email",
    ]);
    for (const tool of RC01_TOOLS) {
      expect(tool.input_schema.additionalProperties).toBe(false);
    }
    const navigate = RC01_TOOLS[0].input_schema.properties as { path: { enum: string[] } };
    expect(navigate.path.enum).toContain("/work/project-aurora");
    expect(navigate.path.enum.every((path) => path.startsWith("/"))).toBe(true);
  });
});

describe("RC-01 golden eval set", () => {
  it("only expects citations and navigation to pages that really exist", () => {
    for (const testCase of golden.cases as Array<{ id: string; cite?: string[]; actionTargets?: string[] }>) {
      for (const want of testCase.cite ?? []) {
        for (const option of want.split("|")) {
          expect(resolveInternalHref(option), `${testCase.id}: ${option}`).not.toBeNull();
        }
      }
      for (const target of testCase.actionTargets ?? []) {
        expect(resolveInternalHref(target), `${testCase.id}: ${target}`).toBe(target);
      }
    }
  });

  it("has unique ids and covers refusals", () => {
    const ids = golden.cases.map((c: { id: string }) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(golden.cases.filter((c: { refuse?: boolean }) => c.refuse).length).toBeGreaterThanOrEqual(3);
  });
});
