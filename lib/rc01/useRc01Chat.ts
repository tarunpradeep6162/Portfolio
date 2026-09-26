"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeAction, type Rc01Action } from "./actions";
import { createEventParser, LIMITS, type ChatTurn, type VisitorContext } from "./protocol";
import { speakablePart, takeSentences, toSpeech } from "./text";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Visitor-facing notes for actions RC-01 took during this answer. */
  actionNotes: string[];
  status: "streaming" | "done" | "error" | "local";
}

/** "checking" until the GET probe answers; "offline" means use the console. */
export type ChatAvailability = "checking" | "online" | "offline";
export type ChatActivity = "idle" | "thinking" | "streaming";
/** Which brain the server is using (see app/api/rc01/route.ts). */
export type BrainMode = "claude" | "free" | "local";

export interface ChatCallbacks {
  onStart?: () => void;
  onSentence?: (sentence: string) => void;
  onAction?: (action: Rc01Action) => void;
  onComplete?: (outcome: "complete" | "error" | "stopped") => void;
}

const MAX_SPOKEN_SENTENCES = 6;

let nextId = 0;
const id = () => `m${++nextId}`;

/**
 * Client for /api/rc01: owns the transcript, streams answers, splits them
 * into sentences for live speech, and relays validated page actions.
 * Only completed text turns are sent back as history - failed or locally
 * generated messages (greetings, errors) never reach the model.
 */
export function useRc01Chat(callbacks: ChatCallbacks) {
  const [availability, setAvailability] = useState<ChatAvailability>("checking");
  const [mode, setMode] = useState<BrainMode>("local");
  const [activity, setActivity] = useState<ChatActivity>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rc01", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled?: boolean; mode?: string }) => {
        if (cancelled) return;
        setAvailability(data.enabled ? "online" : "offline");
        if (data.mode === "claude" || data.mode === "free") setMode(data.mode);
      })
      .catch(() => {
        if (!cancelled) setAvailability("offline");
      });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const patchMessage = useCallback((messageId: string, patch: (m: ChatMessage) => ChatMessage) => {
    setMessages((previous) => previous.map((m) => (m.id === messageId ? patch(m) : m)));
  }, []);

  const addLocalMessage = useCallback((text: string) => {
    setMessages((previous) => [
      ...previous,
      { id: id(), role: "assistant", text, actionNotes: [], status: "local" },
    ]);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (question: string, context: VisitorContext) => {
      const text = question.trim().slice(0, LIMITS.maxMessageChars);
      if (!text || abortRef.current) return;

      const history: ChatTurn[] = [];
      for (const message of messages) {
        if (message.status !== "done") continue;
        // Keep strict user/assistant alternation even if a turn failed.
        const expected = history.length % 2 === 0 ? "user" : "assistant";
        if (message.role === expected) history.push({ role: message.role, content: message.text });
      }
      if (history.length % 2 === 1) history.pop();
      history.push({ role: "user", content: text });

      const userMessage: ChatMessage = { id: id(), role: "user", text, actionNotes: [], status: "streaming" };
      const reply: ChatMessage = { id: id(), role: "assistant", text: "", actionNotes: [], status: "streaming" };
      setMessages((previous) => [...previous, userMessage, reply]);
      setActivity("thinking");
      callbacksRef.current.onStart?.();

      const controller = new AbortController();
      abortRef.current = controller;
      let answer = "";
      let failed = false;
      // Speech cursor over the speakable part of the answer (code excluded).
      // Long answers are read only up to MAX_SPOKEN_SENTENCES - the rest is
      // on screen, and nobody wants a robot reading a tutorial aloud.
      let spokenChars = 0;
      let spokenSentences = 0;
      const speak = (sentence: string) => {
        if (spokenSentences >= MAX_SPOKEN_SENTENCES) return;
        const text = toSpeech(sentence);
        if (!text) return;
        spokenSentences++;
        callbacksRef.current.onSentence?.(text);
      };
      const flushSpeech = (final: boolean) => {
        const pending = speakablePart(answer).slice(spokenChars);
        const { sentences, rest } = takeSentences(pending);
        spokenChars += pending.length - rest.length;
        sentences.forEach(speak);
        if (final && rest.trim()) {
          spokenChars += rest.length;
          speak(rest);
        }
      };

      try {
        const res = await fetch("/api/rc01", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-LIMITS.maxTurns), context }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 503) setAvailability("offline");
          throw new Error(data.error ?? "RC-01 couldn't answer right now.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const parser = createEventParser();

        for (;;) {
          const { value, done } = await reader.read();
          const events = done ? parser.flush() : parser.push(decoder.decode(value, { stream: true }));
          for (const event of events) {
            if (event.type === "text") {
              if (!answer) setActivity("streaming");
              answer += event.text;
              flushSpeech(false);
              patchMessage(reply.id, (m) => ({ ...m, text: answer }));
            } else if (event.type === "action") {
              const note = describeAction(event.action);
              if (note) patchMessage(reply.id, (m) => ({ ...m, actionNotes: [...m.actionNotes, note] }));
              callbacksRef.current.onAction?.(event.action);
            } else if (event.type === "error") {
              failed = true;
              patchMessage(reply.id, (m) => ({ ...m, text: m.text || event.message, status: "error" }));
            }
          }
          if (done) break;
        }
        flushSpeech(true);
        if (!failed) {
          patchMessage(reply.id, (m) => ({
            ...m,
            text: m.text || "I don't have anything to add there.",
            status: "done",
          }));
        }
        setMessages((previous) =>
          previous.map((m) => (m.id === userMessage.id ? { ...m, status: failed ? "error" : "done" } : m)),
        );
        callbacksRef.current.onComplete?.(failed ? "error" : "complete");
      } catch (error) {
        const stopped = controller.signal.aborted;
        flushSpeech(true);
        patchMessage(reply.id, (m) => ({
          ...m,
          text: stopped ? m.text || "Stopped." : error instanceof Error ? error.message : "RC-01 couldn't answer.",
          status: stopped && m.text ? "done" : "error",
        }));
        setMessages((previous) =>
          previous.map((m) =>
            m.id === userMessage.id ? { ...m, status: stopped && answer ? "done" : "error" } : m,
          ),
        );
        callbacksRef.current.onComplete?.(stopped ? "stopped" : "error");
      } finally {
        abortRef.current = null;
        setActivity("idle");
      }
    },
    [messages, patchMessage],
  );

  return { availability, mode, activity, messages, send, stop, addLocalMessage };
}
