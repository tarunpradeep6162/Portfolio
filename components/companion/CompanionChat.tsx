"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Mic, Square, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { parseRichText } from "@/lib/rc01/text";
import type { ChatActivity, ChatAvailability, ChatMessage } from "@/lib/rc01/useRc01Chat";
import type { VoiceInputState } from "@/lib/companion/useVoiceInput";
import { LIMITS } from "@/lib/rc01/protocol";

interface CompanionChatProps {
  availability: ChatAvailability;
  activity: ChatActivity;
  messages: ChatMessage[];
  suggestions: string[];
  onSubmit: (text: string) => void;
  onStop: () => void;
  onClose: () => void;
  onOpenConsole: () => void;
  voice: {
    supported: boolean;
    state: VoiceInputState;
    transcript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
  };
  memoryActive: boolean;
  onForget: () => void;
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {parseRichText(text).map((segment, index) =>
        segment.type === "link" ? (
          <Link
            key={index}
            href={segment.href}
            className="mx-0.5 inline-flex items-center rounded border border-[var(--color-packet-blue)]/40 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-packet-blue)] underline-offset-2 hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-signal-lime)]"
          >
            {segment.label}
          </Link>
        ) : segment.type === "strong" ? (
          <strong key={index} className="font-semibold text-[var(--color-cloud-linen)]">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/**
 * RC-01's conversational mode. Answers are grounded server-side in the
 * portfolio's own content; this component's job is presentation and
 * accessibility:
 * - the visual log is not a live region (token streaming would flood a
 *   screen reader); each *completed* answer is announced once instead;
 * - citations render as internal link chips, never raw HTML;
 * - voice input is hold-to-talk with the transcript shown as it's heard.
 */
export function CompanionChat({
  availability,
  activity,
  messages,
  suggestions,
  onSubmit,
  onStop,
  onClose,
  onOpenConsole,
  voice,
  memoryActive,
  onForget,
}: CompanionChatProps) {
  const [value, setValue] = useState("");
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = activity !== "idle";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  const lastComplete = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && (m.status === "done" || m.status === "error" || m.status === "local"));

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
    setValue("");
  }

  if (availability === "offline") {
    return (
      <div className="border-t border-white/10 pt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-telemetry-steel)]">
          Ask RC-01
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--color-telemetry-steel)]">
          Conversational mode is offline right now. The guided tours and the command console still work
          fully offline.
        </p>
        <button
          type="button"
          onClick={onOpenConsole}
          className="mt-2 flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <TerminalSquare size={13} aria-hidden /> Open console
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-telemetry-steel)]">
          Ask RC-01
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)] hover:text-[var(--color-signal-lime)]"
        >
          Close
        </button>
      </div>

      <div aria-live="polite" className="sr-only">
        {lastComplete ? `RC-01: ${lastComplete.text}` : ""}
      </div>

      <div
        ref={logRef}
        role="log"
        aria-live="off"
        aria-label="Conversation with RC-01"
        className="mt-2 max-h-56 space-y-2.5 overflow-y-auto rounded border border-white/10 bg-black/30 p-2.5"
      >
        {messages.length === 0 && (
          <p className="text-[12px] leading-5 text-[var(--color-telemetry-steel)]">
            Ask me anything about Tarun&apos;s work - I answer only from this portfolio and link the page
            each answer comes from.
          </p>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <p key={message.id} className="text-right text-[12px] leading-5 text-[var(--color-packet-blue)]">
              <span className="sr-only">You: </span>
              {message.text}
            </p>
          ) : (
            <div key={message.id} className="text-[12px] leading-5 text-[var(--color-cloud-linen)]">
              {message.actionNotes.map((note, index) => (
                <p
                  key={index}
                  className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-signal-lime)]"
                >
                  ▸ {note}
                </p>
              ))}
              {message.text ? (
                <p className={cn(message.status === "error" && "text-[var(--color-signal-coral)]")}>
                  <RichText text={message.text} />
                  {message.status === "streaming" && (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-[var(--color-signal-lime)] motion-reduce:animate-none"
                    />
                  )}
                </p>
              ) : (
                message.status === "streaming" && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-telemetry-steel)]">
                    Thinking…
                  </p>
                )
              )}
            </div>
          ),
        )}
      </div>

      {!busy && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full border border-white/15 px-2.5 py-1 text-left text-[11px] leading-4 text-[var(--color-telemetry-steel)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-cloud-linen)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {voice.state === "listening" && (
        <p className="mt-2 font-mono text-[10px] text-[var(--color-signal-lime)]" aria-live="polite">
          Listening… {voice.transcript}
        </p>
      )}
      {voice.error && <p className="mt-2 text-[11px] text-[var(--color-signal-coral)]">{voice.error}</p>}

      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask RC-01 a question about Tarun&apos;s work
        </label>
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={LIMITS.maxMessageChars}
          placeholder={availability === "checking" ? "Connecting…" : "Ask about projects, skills, experience…"}
          disabled={availability === "checking"}
          autoComplete="off"
          className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[12px] text-[var(--color-cloud-linen)] outline-none placeholder:text-[var(--color-telemetry-steel)]/70 focus-visible:border-[var(--color-signal-lime)] disabled:opacity-50"
        />
        {voice.supported && (
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              voice.start();
            }}
            onPointerUp={voice.stop}
            onPointerLeave={() => voice.state === "listening" && voice.stop()}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                event.preventDefault();
                if (voice.state === "listening") voice.stop();
                else voice.start();
              }
            }}
            disabled={busy || availability !== "online"}
            aria-pressed={voice.state === "listening"}
            aria-label={voice.state === "listening" ? "Stop listening" : "Hold to talk"}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[var(--color-cloud-linen)] disabled:opacity-40",
              voice.state === "listening"
                ? "border-[var(--color-signal-lime)] text-[var(--color-signal-lime)]"
                : "border-white/15 hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]",
            )}
          >
            <Mic size={14} aria-hidden />
          </button>
        )}
        {busy ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop the answer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-coral)] hover:text-[var(--color-signal-coral)]"
          >
            <Square size={13} aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim() || availability !== "online"}
            aria-label="Send question"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] disabled:opacity-40"
          >
            <ArrowUp size={14} aria-hidden />
          </button>
        )}
      </form>

      <p className="mt-2 text-[10px] leading-4 text-[var(--color-telemetry-steel)]">
        AI answers from this portfolio only; check the linked page for the source.
        {memoryActive && (
          <>
            {" "}
            RC-01 remembers your visits on this device.{" "}
            <button
              type="button"
              onClick={onForget}
              className="underline underline-offset-2 hover:text-[var(--color-signal-lime)]"
            >
              Forget me
            </button>
          </>
        )}
      </p>
    </div>
  );
}
