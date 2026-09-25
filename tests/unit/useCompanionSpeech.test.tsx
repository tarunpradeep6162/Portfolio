import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { pickVoice, useCompanionSpeech } from "@/lib/companion/useCompanionSpeech";

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

  it("streams: speaks the first sentence immediately and queues the rest as they arrive", () => {
    const { spoken } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());
    const onDone = vi.fn();

    act(() => result.current.beginStream());
    act(() => result.current.enqueue("First."));
    expect(spoken.map((u) => u.text)).toEqual(["First."]);

    act(() => result.current.enqueue("Second."));
    // Still speaking the first - the second waits its turn.
    expect(spoken).toHaveLength(1);

    act(() => spoken[0].onend?.());
    expect(spoken[1].text).toBe("Second.");

    // Ran out of sentences while the stream is open: parks, doesn't finish.
    act(() => spoken[1].onend?.());
    expect(onDone).not.toHaveBeenCalled();
    expect(result.current.playbackState).toBe("speaking");

    // A late sentence resumes from where it parked.
    act(() => result.current.enqueue("Third."));
    expect(spoken[2].text).toBe("Third.");

    act(() => result.current.endStream(onDone));
    expect(onDone).not.toHaveBeenCalled(); // "Third." still playing
    act(() => spoken[2].onend?.());
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.playbackState).toBe("idle");
  });

  it("endStream on an empty or already-drained stream completes immediately", () => {
    installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());
    const onDone = vi.fn();
    act(() => result.current.beginStream());
    act(() => result.current.endStream(onDone));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("stays silent in streaming mode while muted", () => {
    const { spoken } = installFakeSpeechSynthesis();
    const { result } = renderHook(() => useCompanionSpeech());
    act(() => result.current.setMuted(true));
    act(() => result.current.beginStream());
    act(() => result.current.enqueue("Nope."));
    expect(spoken).toHaveLength(0);
  });
});

describe("pickVoice", () => {
  const voice = (name: string, lang: string, isDefault = false) =>
    ({ name, lang, default: isDefault }) as SpeechSynthesisVoice;

  it("prefers a natural/neural English voice", () => {
    expect(
      pickVoice([voice("Robot Basic", "en-US", true), voice("Microsoft Aria Online (Natural)", "en-US")])?.name,
    ).toBe("Microsoft Aria Online (Natural)");
  });

  it("falls back to the default English voice, ignoring other languages", () => {
    expect(pickVoice([voice("Thomas", "fr-FR", true), voice("Fred", "en-US", true)])?.name).toBe("Fred");
    expect(pickVoice([voice("Thomas", "fr-FR")])).toBeNull();
  });
});
