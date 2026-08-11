import { describe, it, expect } from "vitest";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { isReady } from "@/content/types";

describe("Reliability Spine data", () => {
  it("has exactly the eight stages the spec defines, in order", () => {
    expect(spineStages.map((s) => s.id)).toEqual([
      "commit",
      "build",
      "test",
      "container",
      "network",
      "cloud",
      "observe",
      "recover",
    ]);
  });

  it("every stage has a non-empty label and description", () => {
    for (const stage of spineStages) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.description.length).toBeGreaterThan(0);
    }
  });
});

describe("Project -> spine stage mapping", () => {
  it("every flagship project maps only to real spine stage ids", () => {
    const validIds = new Set(spineStages.map((s) => s.id));
    const flagships = projects.filter((p) => p.kind === "flagship");
    expect(flagships.length).toBeGreaterThan(0);
    for (const project of flagships) {
      for (const stageId of project.spineStages) {
        expect(validIds.has(stageId)).toBe(true);
      }
    }
  });
});

describe("isReady (Field<T> discriminator)", () => {
  it("narrows a ready field", () => {
    const field = { status: "ready" as const, value: "hello" };
    expect(isReady(field)).toBe(true);
    if (isReady(field)) {
      expect(field.value).toBe("hello");
    }
  });

  it("does not treat a needs-input field as ready", () => {
    const field = { status: "needs-input" as const, note: "missing" };
    expect(isReady(field)).toBe(false);
  });
});
