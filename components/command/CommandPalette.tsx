"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Search } from "lucide-react";
import { useExperienceDispatch, useExperienceState } from "@/lib/v6/ExperienceProvider";
import { buildCommandIndex, filterCommandIndex, type CommandEntry } from "@/lib/v9/commandIndex";
import { cn } from "@/lib/cn";

/**
 * V9 Global Command Interface (docs/PORTFOLIO_V9_ARCHITECTURE.md). A
 * client-side-only overlay over data that already exists (routes, the 4
 * flagship project pages, the 3 existing VisitorPath values) - no new
 * content model, no backend, no network request. Mounted once in
 * SiteHeader (present on every route via the root layout), and globally
 * keyboard-reachable via Ctrl/Cmd+K from anywhere on the page regardless
 * of where it's mounted in the DOM, since the overlay itself is a
 * viewport-fixed layer.
 *
 * Deliberately not built on a persistent-3D-scene shell (Direction A was
 * rejected in docs/PORTFOLIO_V9_DESIGN_DIRECTIONS.md) - this is plain
 * HTML/CSS, so it works identically with reduced motion on, WebGL
 * unsupported, or any canvas already active elsewhere. It never touches
 * lib/v8/canvasOwnership.ts because it never mounts a canvas.
 *
 * Renders its own visible trigger button (not just the Cmd/Ctrl+K
 * shortcut) so it's reachable without keyboard-shortcut knowledge - by
 * touch, and by screen reader. Mounted inside SiteHeader rather than a
 * fixed corner of the viewport specifically to avoid overlapping RC-01's
 * own fixed bottom-right "Activate" control (CompanionRoot) - the exact
 * class of "covers key content" bug V8 Phase 6 already tests for
 * elsewhere (components/companion, "does not cover the primary CTA").
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const router = useRouter();
  const dispatch = useExperienceDispatch();
  const { visitorPath } = useExperienceState();

  const index = useMemo(() => buildCommandIndex(), []);
  const results = useMemo(() => filterCommandIndex(index, query), [index, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    previouslyFocused.current?.focus();
  }, []);

  const runEntry = useCallback(
    (entry: CommandEntry) => {
      if (entry.kind === "path" && entry.path) {
        dispatch({ type: "VISITOR_PATH_SET", path: entry.path });
      } else if (entry.href) {
        router.push(entry.href);
      }
      close();
    },
    [close, dispatch, router],
  );

  // Global open shortcut - Cmd/Ctrl+K, mirroring the convention used by
  // most command palettes so it's discoverable without documentation.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        previouslyFocused.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  // Escape closes; Tab is trapped inside the dialog while open, matching
  // standard modal-dialog keyboard behavior (the mobile nav's Escape-only
  // pattern is not sufficient here since this is a true modal overlay,
  // not an in-flow panel).
  function onDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const entry = results[activeIndex];
      if (entry) runEntry(entry);
      return;
    }
    if (event.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          previouslyFocused.current = document.activeElement as HTMLElement | null;
          setOpen(true);
        }}
        aria-label="Open command palette"
        title="Search routes, projects, and reading paths (Ctrl/Cmd+K)"
        className="flex h-9 w-9 items-center justify-center border border-white/15 text-[var(--ink-muted)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
      >
        <Command size={16} aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onKeyDown={onDialogKeyDown}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded border border-[var(--color-signal-lime)]/30 bg-[var(--color-control-black)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search size={16} aria-hidden className="text-[var(--ink-muted)]" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  results[activeIndex] ? `${listboxId}-${results[activeIndex].id}` : undefined
                }
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search routes, projects, or set how you read this site..."
                className="w-full min-w-0 bg-transparent font-mono text-sm text-[var(--color-cloud-linen)] outline-none placeholder:text-[var(--ink-muted)]"
              />
              <kbd className="hidden shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9px] text-[var(--ink-muted)] sm:inline">
                Esc
              </kbd>
            </div>

            <ul id={listboxId} role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto py-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  No matches
                </li>
              )}
              {results.map((entry, i) => (
                <li key={entry.id} id={`${listboxId}-${entry.id}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => runEntry(entry)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                      i === activeIndex ? "bg-white/5" : "",
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="font-mono text-[13px] text-[var(--color-cloud-linen)]">{entry.label}</span>
                      {entry.hint && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                          {entry.hint}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[8px] uppercase tracking-[0.14em]",
                        entry.kind === "path" && entry.path === visitorPath
                          ? "text-[var(--color-signal-lime)]"
                          : "text-[var(--ink-muted)]",
                      )}
                    >
                      {entry.kind === "path" && entry.path === visitorPath ? "current" : entry.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
