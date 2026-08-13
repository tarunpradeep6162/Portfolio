import { describe, it, expect } from "vitest";
import { computeAtlasLayout, layoutBounds } from "@/lib/v6/atlasLayout";
import { parseFlowNodes } from "@/lib/v6/flowParser";

describe("computeAtlasLayout", () => {
  it("is a pure, deterministic function of node order - same input, same output every time", () => {
    const nodes = parseFlowNodes("Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2");
    const first = computeAtlasLayout(nodes);
    const second = computeAtlasLayout(nodes);
    expect(first).toEqual(second);
  });

  it("produces one layout point per node, in node order", () => {
    const nodes = parseFlowNodes("Commit -> Build (on agent) -> Test");
    const layout = computeAtlasLayout(nodes);
    expect(layout).toHaveLength(3);
    expect(layout.map((p) => p.nodeId)).toEqual(nodes.map((n) => n.id));
  });

  it("handles a 3-node project (shortest, Jenkins) and a 7-node project (longest, Aurora) with the same rule, no per-project special-casing", () => {
    const jenkins = computeAtlasLayout(parseFlowNodes("Commit -> Build (on agent) -> Test"));
    const aurora = computeAtlasLayout(
      parseFlowNodes("Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2"),
    );
    expect(jenkins).toHaveLength(3);
    expect(aurora).toHaveLength(7);
    // x strictly increases with node order in both, regardless of count.
    expect(jenkins[1].x).toBeGreaterThan(jenkins[0].x);
    expect(aurora[6].x).toBeGreaterThan(aurora[0].x);
  });

  it("returns an empty layout for an empty node list", () => {
    expect(computeAtlasLayout([])).toEqual([]);
  });
});

describe("layoutBounds", () => {
  it("returns zero width for an empty layout", () => {
    expect(layoutBounds([])).toEqual({ width: 0, height: expect.any(Number) });
  });

  it("grows width with more nodes", () => {
    const short = layoutBounds(computeAtlasLayout(parseFlowNodes("Commit -> Build (on agent) -> Test")));
    const long = layoutBounds(
      computeAtlasLayout(
        parseFlowNodes("Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2"),
      ),
    );
    expect(long.width).toBeGreaterThan(short.width);
  });
});
