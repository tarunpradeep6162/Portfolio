import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";

describe("useCompanionPreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to unmuted, captions on, and low-power off", () => {
    const { result } = renderHook(() => useCompanionPreferences());
    expect(result.current.preferences).toEqual({
      muted: false,
      captionsOn: true,
      lowPowerMode: false,
      soundOn: false,
    });
  });

  it("persists an update to localStorage and reflects it immediately", () => {
    const { result } = renderHook(() => useCompanionPreferences());
    act(() => {
      result.current.update({ lowPowerMode: true });
    });
    expect(result.current.preferences.lowPowerMode).toBe(true);
    expect(JSON.parse(window.localStorage.getItem("rc01-preferences")!)).toMatchObject({
      lowPowerMode: true,
    });
  });

  it("reads a previously stored preference back on a fresh mount", () => {
    window.localStorage.setItem(
      "rc01-preferences",
      JSON.stringify({ muted: true, captionsOn: false, lowPowerMode: false, soundOn: true }),
    );
    const { result } = renderHook(() => useCompanionPreferences());
    expect(result.current.preferences).toEqual({
      muted: true,
      captionsOn: false,
      lowPowerMode: false,
      soundOn: true,
    });
  });

  it("falls back to defaults when stored JSON is corrupt", () => {
    window.localStorage.setItem("rc01-preferences", "{not json");
    const { result } = renderHook(() => useCompanionPreferences());
    expect(result.current.preferences.muted).toBe(false);
  });
});
