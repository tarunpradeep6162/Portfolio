"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pulseVoice, setSpeaking } from "./robotSignals";

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
  /**
   * Streaming mode for live answers: open a session, append sentences as
   * they arrive, then close it. Speech starts on the first sentence rather
   * than after the whole answer has generated.
   */
  beginStream: () => void;
  enqueue: (line: string) => void;
  endStream: (onDone?: () => void) => void;
}

/**
 * Picks one consistent, natural-sounding English voice so RC-01 sounds like
 * the same character on every visit. Engines expose their neural/cloud
 * voices under recognisable names; the first match wins, falling back to the
 * platform default English voice.
 */
const PREFERRED_VOICE = /(natural|neural|online|premium|enhanced|google (uk|us) english|samantha|daniel|aria|guy|jenny)/i;

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => /^en(-|_|$)/i.test(voice.lang));
  return (
    english.find((voice) => PREFERRED_VOICE.test(voice.name)) ??
    english.find((voice) => voice.default) ??
    english[0] ??
    null
  );
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
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Streaming session: while open, running out of lines means "wait for the
  // next sentence", not "finished".
  const streamOpenRef = useRef(false);
  const waitingRef = useRef(false);

  useEffect(() => {
    if (!supported || typeof window.speechSynthesis.getVoices !== "function") return;
    const synth = window.speechSynthesis;
    const load = () => {
      voiceRef.current = pickVoice(synth.getVoices());
    };
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, [supported]);

  useEffect(() => {
    return () => {
      // Optional chaining here (rather than the `supported` flag alone)
      // guards against a browser/test environment where the global is torn
      // down between the effect running and its cleanup firing.
      window.speechSynthesis?.cancel();
    };
  }, [supported]);

  const speakNextRef = useRef<((index: number) => void) | null>(null);

  const speakFromIndex = useCallback(
    (startIndex: number) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const speakNext = (index: number) => {
        if (index >= linesRef.current.length) {
          if (streamOpenRef.current) {
            // More sentences are still being generated - park here.
            indexRef.current = index;
            waitingRef.current = true;
            return;
          }
          setSpeaking(false);
          setPlaybackState("idle");
          setActiveLineIndex(-1);
          onDoneRef.current?.();
          return;
        }
        waitingRef.current = false;
        indexRef.current = index;
        setActiveLineIndex(index);
        const utterance = new SpeechSynthesisUtterance(linesRef.current[index]);
        utterance.rate = 1.03;
        utterance.pitch = 0.92;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.onstart = () => setSpeaking(true);
        // Word boundaries drive the visor's "mouth" pulse. Engines that
        // don't emit them still get a synthetic pulse from the model while
        // `speaking` is true.
        utterance.onboundary = (event) => {
          if (event.name === "word") pulseVoice();
        };
        utterance.onend = () => {
          if (indexRef.current === index) speakNext(index + 1);
        };
        utterance.onerror = () => {
          setSpeaking(false);
          setPlaybackState("idle");
          setActiveLineIndex(-1);
        };
        synth.speak(utterance);
      };
      speakNextRef.current = speakNext;

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
    streamOpenRef.current = false;
    waitingRef.current = false;
    setSpeaking(false);
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

  const beginStream = useCallback(() => {
    if (!supported || muted) return;
    window.speechSynthesis.cancel();
    linesRef.current = [];
    onDoneRef.current = undefined;
    streamOpenRef.current = true;
    waitingRef.current = false;
    indexRef.current = -1;
    setPlaybackState("speaking");
  }, [supported, muted]);

  const enqueue = useCallback(
    (line: string) => {
      if (!streamOpenRef.current || !line.trim()) return;
      linesRef.current = [...linesRef.current, line.trim()];
      if (indexRef.current === -1) {
        speakFromIndex(0);
      } else if (waitingRef.current) {
        speakNextRef.current?.(indexRef.current);
      }
    },
    [speakFromIndex],
  );

  const endStream = useCallback((onDone?: () => void) => {
    if (!streamOpenRef.current) {
      onDone?.();
      return;
    }
    streamOpenRef.current = false;
    onDoneRef.current = onDone;
    if (waitingRef.current || indexRef.current === -1) {
      waitingRef.current = false;
      setSpeaking(false);
      setPlaybackState("idle");
      setActiveLineIndex(-1);
      onDone?.();
    }
  }, []);

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
    beginStream,
    enqueue,
    endStream,
  };
}
