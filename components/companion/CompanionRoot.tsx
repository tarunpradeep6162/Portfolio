"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { CompanionPortrait } from "./CompanionPortrait";

const CompanionExperience = dynamic(
  () => import("./CompanionExperience").then((mod) => mod.CompanionExperience),
  {
    ssr: false,
    loading: () => <CompanionLoadingSkeleton />,
  },
);

/**
 * An allowlist, not a denylist: RC-01 is only present on routes that are
 * genuinely appropriate for a guided tour to land on. This is the only
 * mechanism needed to satisfy "no RC-01 on /resume" AND "no RC-01 on the
 * 404 page" at once - a 404 is, by definition, any pathname not in this
 * list, so it never needs special detection.
 */
const ALLOWED_ROUTE_PREFIXES = ["/work", "/about", "/contact"];

function isCompanionAllowedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  return ALLOWED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function CompanionLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="RC-01 is starting up"
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-white/10 bg-[var(--color-control-black)]/97 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.55)] print:hidden sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[23rem]"
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
 *
 * v5.1: renders nothing at all on a disallowed route (print media, or a
 * pathname outside the allowlist), and the heavy bundle is never prefetched
 * automatically - only on real visitor intent (hover, focus, touch, or the
 * click itself).
 *
 * V6: "active" is derived from the shared `activeScene` field
 * (lib/v6/ExperienceProvider) rather than owned locally - this is what
 * enforces the site-wide "at most 1 mounted canvas" invariant across
 * RC-01/Atlas/Time-Machine. If the Atlas or Time Machine scene activates
 * while RC-01 is open, `activeScene` changes away from "rc01", this
 * component's derived `active` flips to false on the very next render, and
 * CompanionExperience (and its Canvas) unmounts - no coordination code
 * needed inside CompanionExperience/CompanionCanvas/RC01Model themselves.
 */
export function CompanionRoot() {
  const experienceState = useExperienceState();
  const dispatch = useExperienceDispatch();
  const [prefetchArmed, setPrefetchArmed] = useState(false);
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasActive = useRef(false);
  const allowed = isCompanionAllowedRoute(pathname);
  const active = experienceState.activeScene === "rc01";

  const armPrefetch = () => {
    if (prefetchArmed || reducedMotion) return;
    setPrefetchArmed(true);
    void import("./CompanionExperience");
  };

  useEffect(() => {
    // Navigating to a disallowed route (e.g. the Reliability Spine Tour's
    // own suggested-route confirmation taking the visitor to /resume) must
    // fully deactivate RC-01, not just hide its reopen control - the brief
    // requires RC-01 absent on that route, not merely unreachable, and
    // requires the Activate control to be used again on return rather than
    // silently resuming. Deferred one tick so the state update happens
    // inside a callback rather than the effect body itself.
    if (!allowed && active) {
      const id = window.setTimeout(
        () => dispatch({ type: "SCENE_CHANGED", scene: null }),
        0,
      );
      return () => window.clearTimeout(id);
    }
  }, [allowed, active, dispatch]);

  useEffect(() => {
    if (!active && wasActive.current) {
      buttonRef.current?.focus();
    }
    wasActive.current = active;
  }, [active]);

  if (!allowed) return null;

  if (active) {
    return (
      <Suspense fallback={<CompanionLoadingSkeleton />}>
        <CompanionExperience
          onDeactivate={() => dispatch({ type: "SCENE_CHANGED", scene: null })}
        />
      </Suspense>
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => dispatch({ type: "SCENE_CHANGED", scene: "rc01" })}
      onPointerEnter={armPrefetch}
      onFocus={armPrefetch}
      onTouchStart={armPrefetch}
      className="fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-white/15 bg-[var(--color-control-black)]/95 px-4 text-[var(--color-cloud-linen)] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors print:hidden hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] sm:h-11"
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
