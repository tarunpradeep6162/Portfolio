"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech recognition API isn't in TypeScript's DOM lib yet; this is
// the minimal surface we use.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceInputState = "idle" | "listening" | "error";

/**
 * Hold-to-talk speech input. `start()` must be called from a user gesture
 * (browsers require it for microphone access). Interim text streams into
 * `transcript` so the visitor sees their words appear; `onFinal` fires once
 * with the settled sentence.
 */
export function useVoiceInput(onFinal: (text: string) => void) {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [state, setState] = useState<VoiceInputState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    finalRef.current = "";
    setTranscript("");
    setError(null);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalRef.current += result[0].transcript;
        else interim += result[0].transcript;
      }
      setTranscript((finalRef.current + interim).trim());
    };
    recognition.onerror = (event) => {
      setState("error");
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone access was blocked. You can still type."
          : event.error === "no-speech"
            ? "I didn't catch anything. Try again, or type instead."
            : "Voice input stopped unexpectedly. You can still type.",
      );
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      const text = finalRef.current.trim();
      setState((previous) => (previous === "error" ? "error" : "idle"));
      if (text) onFinalRef.current(text);
    };

    recognitionRef.current = recognition;
    setState("listening");
    recognition.start();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, state, transcript, error, start, stop };
}
