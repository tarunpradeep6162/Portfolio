"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechPlaybackState = "idle" | "speaking" | "paused";

interface SpeechController {
  supported: boolean;
  playbackState: SpeechPlaybackState;
  activeLineIndex: number;
  /** Starts speaking `lines` from the beginning. Must be called from a user gesture. */
  speak: (lines: string[], onDone?: () => void) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

function detectSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

/**
 * Thin wrapper around window.speechSynthesis. Speaks one sentence per
 * SpeechSynthesisUtterance so captions can advance on `onend` - word-level
 * `boundary` events are not consistently supported across engines, sentence
 * sync is. Never called except from an explicit user gesture handler; this
 * hook itself never auto-starts anything. This module is only ever loaded
 * client-side (via the ssr:false dynamic import in CompanionRoot), so a
 * lazy useState initializer is a safe one-time browser check rather than an
 * effect-driven synchronization.
 */
export function useCompanionSpeech(): SpeechController {
  const [supported] = useState(detectSupport);
  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>("idle");
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [muted, setMutedState] = useState(false);

  const linesRef = useRef<string[]>([]);
  const indexRef = useRef(-1);
  const onDoneRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    return () => {
      // Optional chaining here (rather than the `supported` flag alone)
      // guards against a browser/test environment where the global is torn
      // down between the effect running and its cleanup firing.
      window.speechSynthesis?.cancel();
    };
  }, [supported]);

  const speakFromIndex = useCallback(
    (startIndex: number) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const speakNext = (index: number) => {
        if (index >= linesRef.current.length) {
          setPlaybackState("idle");
          setActiveLineIndex(-1);
          onDoneRef.current?.();
          return;
        }
        indexRef.current = index;
        setActiveLineIndex(index);
        const utterance = new SpeechSynthesisUtterance(linesRef.current[index]);
        utterance.rate = 1;
        utterance.onend = () => {
          if (indexRef.current === index) speakNext(index + 1);
        };
        utterance.onerror = () => {
          setPlaybackState("idle");
          setActiveLineIndex(-1);
        };
        synth.speak(utterance);
      };

      setPlaybackState("speaking");
      speakNext(startIndex);
    },
    [supported],
  );

  const speak = useCallback(
    (lines: string[], onDone?: () => void) => {
      if (muted) return;
      linesRef.current = lines;
      onDoneRef.current = onDone;
      speakFromIndex(0);
    },
    [speakFromIndex, muted],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPlaybackState("paused");
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPlaybackState("speaking");
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    indexRef.current = -1;
    onDoneRef.current = undefined;
    setPlaybackState("idle");
    setActiveLineIndex(-1);
  }, [supported]);

  const replay = useCallback(() => {
    if (linesRef.current.length === 0) return;
    speakFromIndex(0);
  }, [speakFromIndex]);

  const setMuted = useCallback(
    (value: boolean) => {
      if (value && supported) {
        window.speechSynthesis.cancel();
        indexRef.current = -1;
        onDoneRef.current = undefined;
        setPlaybackState("idle");
        setActiveLineIndex(-1);
      }
      setMutedState(value);
    },
    [supported],
  );

  return {
    supported,
    playbackState,
    activeLineIndex,
    speak,
    pause,
    resume,
    stop,
    replay,
    muted,
    setMuted,
  };
}
