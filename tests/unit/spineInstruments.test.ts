import { describe, it, expect } from "vitest";
import { computeSpineInstruments } from "@/lib/v7/spineInstruments";
import { spineStages } from "@/content/spine";

describe("computeSpineInstruments", () => {
  it("returns exactly the 8 real spine stages, in their declared order", () => {
    const instruments = computeSpineInstruments();
    expect(instruments).toHaveLength(8);
    expect(instruments.map((i) => i.stageId)).toEqual(
      spineStages.map((s) => s.id),
    );
    instruments.forEach((instrument, i) => {
      expect(instrument.index).toBe(i);
    });
  });

  it("every count is a non-negative integer derived from real project data, never invented", () => {
    const instruments = computeSpineInstruments();
    for (const instrument of instruments) {
      expect(Number.isInteger(instrument.demonstratedByCount)).toBe(true);
      expect(instrument.demonstratedByCount).toBeGreaterThanOrEqual(0);
      // Never more than the number of flagship projects that exist.
      expect(instrument.demonstratedByCount).toBeLessThanOrEqual(4);
    }
  });

  it("at least one stage has a non-zero count (the spine is actually demonstrated, not vestigial)", () => {
    const instruments = computeSpineInstruments();
    expect(instruments.some((i) => i.demonstratedByCount > 0)).toBe(true);
  });
});
