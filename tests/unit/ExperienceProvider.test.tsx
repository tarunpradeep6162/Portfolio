import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  ExperienceProvider,
  useExperienceState,
  useExperienceDispatch,
} from "@/lib/v6/ExperienceProvider";

const STORAGE_KEY = "v6-visitor-path";

function renderProvider() {
  return renderHook(
    () => ({ state: useExperienceState(), dispatch: useExperienceDispatch() }),
    { wrapper: ExperienceProvider },
  );
}

describe("ExperienceProvider: visitor-path persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with no visitor path when localStorage is empty", () => {
    const { result } = renderProvider();
    expect(result.current.state.visitorPath).toBeNull();
  });

  it("restores a previously persisted visitor path on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "engineer");
    const { result } = renderProvider();
    expect(result.current.state.visitorPath).toBe("engineer");
  });

  it("ignores a corrupted/invalid stored value rather than crashing", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-real-path");
    const { result } = renderProvider();
    expect(result.current.state.visitorPath).toBeNull();
  });

  it("writes a selected path to localStorage only - no other storage keys touched", () => {
    const { result } = renderProvider();
    act(() => {
      result.current.dispatch({ type: "VISITOR_PATH_SET", path: "explorer" });
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("explorer");
    expect(window.localStorage.length).toBe(1);
  });

  it("removes the storage key when the path is reset to null", () => {
    window.localStorage.setItem(STORAGE_KEY, "recruiter");
    const { result } = renderProvider();
    act(() => {
      result.current.dispatch({ type: "VISITOR_PATH_SET", path: null });
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
