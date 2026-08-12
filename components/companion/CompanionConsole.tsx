"use client";

import { useId, useRef, useState } from "react";
import { consoleCommands, consoleHelpText, type ConsoleCommand } from "@/content/companion";
import { cn } from "@/lib/cn";

interface LogEntry {
  kind: "input" | "output";
  text: string;
}

interface CompanionConsoleProps {
  onCommand: (command: ConsoleCommand) => string;
  onUnknownCommand: () => void;
  onClose: () => void;
}

/**
 * A small, documented, local-only command set - not free-form chat.
 * Unknown input always gets the same deterministic help response, never a
 * fabricated answer (spec: "Unknown commands must show a clear local-help
 * response. They must not produce fabricated answers.").
 */
export function CompanionConsole({ onCommand, onUnknownCommand, onClose }: CompanionConsoleProps) {
  const [value, setValue] = useState("");
  const [log, setLog] = useState<LogEntry[]>([
    { kind: "output", text: consoleHelpText },
  ]);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    const entries: LogEntry[] = [{ kind: "input", text: trimmed }];
    if ((consoleCommands as readonly string[]).includes(trimmed)) {
      entries.push({ kind: "output", text: onCommand(trimmed as ConsoleCommand) });
    } else {
      entries.push({ kind: "output", text: consoleHelpText });
      onUnknownCommand();
    }
    setLog((previous) => [...previous, ...entries].slice(-12));
    setValue("");
  }

  return (
    <div className="border-t border-white/10 pt-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-telemetry-steel)]">
          Command console
        </p>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)] hover:text-[var(--color-signal-lime)]"
        >
          Close
        </button>
      </div>

      <div
        role="log"
        aria-label="RC-01 console output"
        className="mt-2 max-h-28 overflow-y-auto rounded border border-white/10 bg-black/30 p-2 font-mono text-[10px] leading-5 text-[var(--color-cloud-linen)]"
      >
        {log.map((entry, index) => (
          <p
            key={index}
            className={cn(
              entry.kind === "input"
                ? "text-[var(--color-packet-blue)]"
                : "text-[var(--color-telemetry-steel)]",
            )}
          >
            {entry.kind === "input" ? "> " : ""}
            {entry.text}
          </p>
        ))}
      </div>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          RC-01 console command
        </label>
        <input
          id={inputId}
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="help"
          autoComplete="off"
          className="flex-1 rounded border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-[11px] text-[var(--color-cloud-linen)] outline-none focus-visible:border-[var(--color-signal-lime)]"
        />
        <button
          type="submit"
          className="rounded border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          Run
        </button>
      </form>
    </div>
  );
}
