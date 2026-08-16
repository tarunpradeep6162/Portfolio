import { describe, it, expect } from "vitest";
import { scenarios } from "@/content/v9/scenarios";
import { skillDomains } from "@/content/skills";
import { projects } from "@/content/projects";
import { spineStages } from "@/content/spine";

const realSkillLabels = new Set(skillDomains.flatMap((domain) => domain.items));
const realFlagshipSlugs = new Set(
  projects.filter((p) => p.kind === "flagship").map((p) => p.slug),
);
const realSpineStageIds = new Set(spineStages.map((s) => s.id));

/**
 * This is the safety net for the highest-risk V9 pillar
 * (docs/PORTFOLIO_V9_DISCOVERY.md flags the Scenario Simulator as the
 * item most likely to accidentally violate "never fake live
 * infrastructure"). Every one of these assertions checks that the
 * simulator's content stays anchored to real, verifiable facts about
 * this codebase - not that the simulator is merely well-formed.
 */
describe("Scenario Simulator content integrity", () => {
  it("covers exactly the 5 scenario categories named in the V9 brief, no more, no fewer", () => {
    const categories = scenarios.map((s) => s.category).sort();
    expect(categories).toEqual(
      [
        "compromised-credentials",
        "database-latency",
        "deployment-failure",
        "recovery-decision",
        "traffic-spike",
      ].sort(),
    );
  });

  it("every scenario has a unique slug", () => {
    const slugs = scenarios.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every scenario's spineStageId is a real Reliability Spine stage", () => {
    for (const scenario of scenarios) {
      expect(realSpineStageIds.has(scenario.spineStageId)).toBe(true);
    }
  });

  it("every choice's skillLabel is a real, verbatim skill from content/skills.ts - never invented", () => {
    for (const scenario of scenarios) {
      for (const choice of scenario.choices) {
        expect(realSkillLabels.has(choice.skillLabel)).toBe(true);
      }
    }
  });

  it("every choice's relatedProjectSlug is a real flagship project - never a lab project or invented slug", () => {
    for (const scenario of scenarios) {
      for (const choice of scenario.choices) {
        expect(realFlagshipSlugs.has(choice.relatedProjectSlug)).toBe(true);
      }
    }
  });

  it("every scenario has exactly one recommended choice - never zero, never more than one", () => {
    for (const scenario of scenarios) {
      const recommendedCount = scenario.choices.filter((c) => c.recommended).length;
      expect(recommendedCount).toBe(1);
    }
  });

  it("every scenario has at least 2 choices - a real decision, not a single forced path", () => {
    for (const scenario of scenarios) {
      expect(scenario.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("no scenario setup or outcome text contains a suspiciously precise fabricated metric (e.g. Nms, N%, N req/s)", () => {
    const suspiciousMetric = /\b\d+(\.\d+)?\s?(ms|%|req\/s|rps|qps)\b/i;
    for (const scenario of scenarios) {
      expect(scenario.setup).not.toMatch(suspiciousMetric);
      for (const choice of scenario.choices) {
        expect(choice.outcome).not.toMatch(suspiciousMetric);
      }
    }
  });

  it("no scenario or choice text claims a live/real-time connection to actual infrastructure", () => {
    const liveClaim = /\blive (data|infrastructure|system|feed)\b|\breal-?time (data|feed|monitoring)\b/i;
    for (const scenario of scenarios) {
      expect(scenario.setup).not.toMatch(liveClaim);
      for (const choice of scenario.choices) {
        expect(choice.outcome).not.toMatch(liveClaim);
      }
    }
  });
});
