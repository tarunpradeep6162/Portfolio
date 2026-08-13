import { describe, it, expect } from "vitest";
import { scripts, tours, consoleCommands, consoleHelpText } from "@/content/companion";
import { projects } from "@/content/projects";

describe("companion content", () => {
  it("every tour step references a script that actually exists", () => {
    for (const tour of tours) {
      for (const step of tour.steps) {
        expect(scripts[step.scriptId], `${tour.id} references missing script ${step.scriptId}`)
          .toBeDefined();
      }
    }
  });

  it("every tour's suggestedRoute points at a real flagship or top-level route", () => {
    const flagshipSlugs = new Set(
      projects.filter((p) => p.kind === "flagship").map((p) => p.slug),
    );
    const knownTopLevel = new Set(["/work", "/about", "/resume", "/contact"]);
    for (const tour of tours) {
      for (const step of tour.steps) {
        if (!step.suggestedRoute) continue;
        const href = step.suggestedRoute.href;
        const isFlagship = [...flagshipSlugs].some((slug) => href === `/work/${slug}`);
        expect(
          isFlagship || knownTopLevel.has(href),
          `${tour.id} suggests navigating to an unknown route: ${href}`,
        ).toBe(true);
      }
    }
  });

  it("no script line contains raw content-gap markers ('needs-input')", () => {
    for (const script of Object.values(scripts)) {
      for (const line of script.lines) {
        expect(line).not.toMatch(/needs-input/i);
      }
    }
  });

  it("the project briefing script only exists for real flagship slugs", () => {
    const flagshipSlugs = new Set(
      projects.filter((p) => p.kind === "flagship").map((p) => p.slug),
    );
    for (const key of Object.keys(scripts)) {
      if (!key.startsWith("project:")) continue;
      const slug = key.slice("project:".length);
      expect(flagshipSlugs.has(slug)).toBe(true);
    }
  });

  it("the console's documented command list matches what the help text advertises", () => {
    for (const command of consoleCommands) {
      expect(consoleHelpText).toContain(command);
    }
  });
});
