import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";

describe("useWebGLSupport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false in an environment with no real WebGL context (jsdom)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });

  it("returns true when a WebGL context is available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (kind: string) => (kind === "webgl2" ? ({} as unknown as RenderingContext) : null),
    );
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(true);
  });

  it("never throws even if getContext itself throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("no webgl here");
    });
    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });
});
