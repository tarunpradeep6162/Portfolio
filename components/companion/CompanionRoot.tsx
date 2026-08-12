"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { CompanionPortrait } from "./CompanionPortrait";

const CompanionExperience = dynamic(
  () => import("./CompanionExperience").then((mod) => mod.CompanionExperience),
  {
    ssr: false,
    loading: () => <CompanionLoadingSkeleton />,
  },
);

function CompanionLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="RC-01 is starting up"
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-white/10 bg-[var(--color-control-black)]/97 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[23rem]"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-signal-lime)] motion-reduce:animate-none" />
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)]">
          RC-01 initializing…
        </p>
      </div>
      {/* A dimmed static portrait plus a scan line, never an empty box - the
          3D bundle is still loading, but the boot sequence is already
          visible rather than a blank rectangle. */}
      <div className="relative mt-3 h-40 w-full overflow-hidden rounded-xl border border-white/10 sm:h-44">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 38%, #141d27 0%, #0a0f14 62%, #06090d 100%)",
          }}
        />
        <div className="relative flex h-full items-center justify-center opacity-60">
          <CompanionPortrait variant="sleep" className="h-28 w-28" />
        </div>
        <div className="absolute inset-x-0 top-0 h-px rc01-scan bg-[var(--color-signal-lime)]/70 motion-reduce:hidden" />
      </div>
    </div>
  );
}

/**
 * The only companion module imported by app/layout.tsx. Contains no
 * Three.js / R3F - just a floating button and the trigger logic for
 * loading the heavy CompanionExperience bundle, so every route keeps its
 * existing render/bundle cost until RC-01 is actually requested.
 */
export function CompanionRoot() {
  const [active, setActive] = useState(false);
  const [prefetchArmed, setPrefetchArmed] = useState(false);
  const reducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    if (reducedMotion) return; // Reduced-motion users get the static portrait only on demand - no need to prefetch the 3D bundle.
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const runPrefetch = () => {
      setPrefetchArmed(true);
      void import("./CompanionExperience");
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(runPrefetch);
      return () => win.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(runPrefetch, 2000);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (!active && wasActive.current) {
      buttonRef.current?.focus();
    }
    wasActive.current = active;
  }, [active]);

  if (active) {
    return (
      <Suspense fallback={<CompanionLoadingSkeleton />}>
        <CompanionExperience onDeactivate={() => setActive(false)} />
      </Suspense>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => setActive(true)}
      className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[var(--color-control-black)]/95 px-4 text-[var(--color-cloud-linen)] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] sm:h-11"
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span
          className={
            prefetchArmed
              ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-signal-lime)] opacity-40 motion-reduce:animate-none"
              : ""
          }
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-signal-lime)]" />
      </span>
      <Bot size={16} aria-hidden />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
        Activate RC-01
      </span>
    </button>
  );
}
