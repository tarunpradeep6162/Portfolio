import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompanionSpeech } from "@/lib/companion/useCompanionSpeech";

class FakeUtterance {
  text: string;
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installFakeSpeechSynthesis() {
  const spoken: FakeUtterance[] = [];
  const fakeSynth = {
    speak: vi.fn((utterance: FakeUtterance) => spoken.push(utterance)),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", fakeSynth);
  return { spoken, fakeSynth };
}

describe("useCompanionSpeech", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unsupported when the browser has no speechSynthesis", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    const { result } = renderHook(() => useCompanionSpeech());
    expect(result.current.supported).toBe(false);
  });

  it("never creates an utterance until speak() is explicitly called", () => {
    const { fakeSynth } = installFakeSpeechSynthesis();
    renderHook(() => useCompanionSpeech());
    expect(fakeSynth.speak).not.toHaveBeenCalled();
  });

  it("speaks each line in order, advancing on the previous utterance's onend", () => {
    const { spoken } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());

    act(() => {
      result.current.speak(["First.", "Second.", "Third."]);
    });

    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe("First.");
    expect(result.current.activeLineIndex).toBe(0);

    act(() => {
      spoken[0].onend?.();
    });
    expect(spoken).toHaveLength(2);
    expect(spoken[1].text).toBe("Second.");

    act(() => {
      spoken[1].onend?.();
    });
    act(() => {
      spoken[2].onend?.();
    });
    expect(result.current.activeLineIndex).toBe(-1);
  });

  it("calls the onDone callback once the whole script finishes", () => {
    const { spoken } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());
    const onDone = vi.fn();

    act(() => {
      result.current.speak(["Only line."], onDone);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      spoken[0].onend?.();
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("stop() cancels synthesis and resets playback state", () => {
    const { fakeSynth } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());

    act(() => {
      result.current.speak(["Hello."]);
    });
    act(() => {
      result.current.stop();
    });

    expect(fakeSynth.cancel).toHaveBeenCalled();
    expect(result.current.playbackState).toBe("idle");
    expect(result.current.activeLineIndex).toBe(-1);
  });

  it("muting mid-speech cancels synthesis and blocks further speak() calls", () => {
    const { fakeSynth, spoken } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());

    act(() => {
      result.current.speak(["Hello."]);
    });
    act(() => {
      result.current.setMuted(true);
    });
    expect(fakeSynth.cancel).toHaveBeenCalled();
    expect(result.current.muted).toBe(true);

    act(() => {
      result.current.speak(["Should not speak."]);
    });
    // Only the first, pre-mute utterance was ever created.
    expect(spoken).toHaveLength(1);
  });
});
