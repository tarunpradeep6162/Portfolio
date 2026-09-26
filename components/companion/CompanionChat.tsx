"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Bot, Check, Copy, Mic, Square, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { parseBlocks, type RichSegment } from "@/lib/rc01/text";
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

function Inline({ segments }: { segments: RichSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "link":
            return (
              <Link
                key={index}
                href={segment.href}
                className="mx-0.5 inline-flex items-center rounded border border-[var(--color-packet-blue)]/40 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-packet-blue)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-signal-lime)]"
              >
                {segment.label}
              </Link>
            );
          case "external":
            return (
              <a
                key={index}
                href={segment.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-[var(--color-packet-blue)] underline underline-offset-2 hover:text-[var(--color-signal-lime)]"
              >
                {segment.label}
                <span aria-hidden> ↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            );
          case "strong":
            return (
              <strong key={index} className="font-semibold text-[var(--color-cloud-linen)]">
                {segment.text}
              </strong>
            );
          case "code":
            return (
              <code key={index} className="rounded bg-white/10 px-1 py-px font-mono text-[11px] text-[var(--color-signal-lime)]">
                {segment.text}
              </code>
            );
          default:
            return <span key={index}>{segment.text}</span>;
        }
      })}
    </>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-black/60">
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-telemetry-steel)]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-telemetry-steel)] hover:text-[var(--color-signal-lime)]"
        >
          {copied ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-2 font-mono text-[11px] leading-[1.55] text-[var(--color-cloud-linen)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parseBlocks(text).map((block, index) => {
        if (block.type === "code") return <CodeBlock key={index} language={block.language} code={block.code} />;
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={cn("space-y-1 pl-4", block.ordered ? "list-decimal" : "list-disc", "marker:text-[var(--color-telemetry-steel)]")}
            >
              {block.items.map((item, i) => (
                <li key={i}>
                  <Inline segments={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={index}>
            <Inline segments={block.segments} />
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="RC-01 is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-signal-lime)] motion-reduce:animate-none"
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * RC-01's chat window: a general-purpose AI assistant that is also the
 * expert on Tarun's portfolio. Presentation and accessibility live here:
 * - the visual log is not a live region (token streaming would flood a
 *   screen reader); each *completed* answer is announced once instead;
 * - markdown is parsed into React elements - HTML is never interpreted;
 * - citations to portfolio pages render as chips, https links open in a
 *   new tab, anything else degrades to text;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = activity !== "idle";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages]);

  // Auto-grow the composer up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [value]);

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
          Chat with RC-01
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--color-telemetry-steel)]">
          RC-01&apos;s AI chat is offline right now. The guided tours and the command console still work.
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
        <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-telemetry-steel)]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              availability === "online" ? "bg-[var(--color-signal-lime)]" : "bg-[var(--color-telemetry-steel)]",
            )}
          />
          Chat with RC-01
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
        className="mt-2 max-h-[min(22rem,45vh)] min-h-[7rem] space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-white/10 bg-black/30 p-2.5"
      >
        {messages.length === 0 && (
          <div className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-signal-lime)]/15 text-[var(--color-signal-lime)]">
              <Bot size={13} aria-hidden />
            </span>
            <p className="rounded-lg rounded-tl-sm bg-white/[0.06] px-2.5 py-2 text-[12px] leading-5 text-[var(--color-cloud-linen)]">
              Hi, I&apos;m RC-01. Ask me anything - cloud, DevOps, code, careers, or Tarun&apos;s projects and
              experience. I&apos;ll link the page whenever an answer comes from his portfolio.
            </p>
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-tr-sm bg-[var(--color-packet-blue)]/20 px-2.5 py-1.5 text-[12px] leading-5 text-[var(--color-cloud-linen)]">
                <span className="sr-only">You: </span>
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-signal-lime)]/15 text-[var(--color-signal-lime)]">
                <Bot size={13} aria-hidden />
              </span>
              <div
                className={cn(
                  "min-w-0 max-w-[90%] rounded-lg rounded-tl-sm px-2.5 py-2 text-[12px] leading-5",
                  message.status === "error"
                    ? "bg-[var(--color-signal-coral)]/10 text-[var(--color-signal-coral)]"
                    : "bg-white/[0.06] text-[var(--color-cloud-linen)]",
                )}
              >
                {message.actionNotes.map((note, index) => (
                  <p
                    key={index}
                    className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-signal-lime)]"
                  >
                    ▸ {note}
                  </p>
                ))}
                {message.text ? (
                  message.status === "error" ? (
                    <p>{message.text}</p>
                  ) : (
                    <Markdown text={message.text} />
                  )
                ) : (
                  message.status === "streaming" && <TypingDots />
                )}
              </div>
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
        className="mt-2 flex items-end gap-1.5 rounded-lg border border-white/15 bg-black/40 p-1.5 focus-within:border-[var(--color-signal-lime)]"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask RC-01 a question
        </label>
        <textarea
          id={inputId}
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit(value);
            }
          }}
          maxLength={LIMITS.maxMessageChars}
          placeholder={availability === "checking" ? "Connecting…" : "Ask me anything…"}
          disabled={availability === "checking"}
          autoComplete="off"
          className="max-h-[110px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-[12px] leading-5 text-[var(--color-cloud-linen)] outline-none placeholder:text-[var(--color-telemetry-steel)]/70 focus-visible:outline-none disabled:opacity-50"
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
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[var(--color-cloud-linen)] disabled:opacity-40",
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-coral)] hover:text-[var(--color-signal-coral)]"
          >
            <Square size={13} aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim() || availability !== "online"}
            aria-label="Send question"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-signal-lime)] text-[var(--color-control-black)] hover:brightness-110 disabled:bg-white/10 disabled:text-[var(--color-telemetry-steel)]"
          >
            <ArrowUp size={15} aria-hidden />
          </button>
        )}
      </form>

      <p className="mt-2 text-[10px] leading-4 text-[var(--color-telemetry-steel)]">
        AI-generated answers can be wrong - portfolio facts link to their source page.
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
