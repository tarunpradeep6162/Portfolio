"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Captions,
  BatteryLow,
  Compass,
  TerminalSquare,
  Bell,
  Minus,
  ChevronUp,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import {
  scripts,
  tours,
  accentForProjectSlug,
  type CompanionScript,
  type CompanionTourId,
  type ConsoleCommand,
} from "@/content/companion";
import { useCompanionSpeech } from "@/lib/companion/useCompanionSpeech";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useActiveSection } from "@/lib/companion/useActiveSection";
import { useCompanionSound } from "@/lib/companion/useCompanionSound";
import { dispatchObservatoryHighlight } from "@/lib/companion/observatoryHighlight";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { qualityPresets, resolveQualityTier, type CompanionState } from "@/lib/companion/state";
import { useExperienceDispatch } from "@/lib/v6/ExperienceProvider";
import { CompanionCanvas } from "./CompanionCanvas";
import { CompanionPortrait } from "./CompanionPortrait";
import { CompanionTourPanel } from "./CompanionTourPanel";
import { CompanionConsole } from "./CompanionConsole";
import { cn } from "@/lib/cn";

const SENTENCE_FALLBACK_MS = 3200;
const INACTIVITY_SLEEP_MS = 3 * 60 * 1000;
const SECTION_IDS = ["work", "spine", "contact"];
const SECTION_LABELS: Record<string, string> = {
  work: "Selected systems",
  spine: "Reliability protocol",
  contact: "Final route",
};

type Subpanel = "none" | "tours" | "console";

interface CompanionExperienceProps {
  onDeactivate: () => void;
}

export function CompanionExperience({ onDeactivate }: CompanionExperienceProps) {
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebGLSupport();
  const speech = useCompanionSpeech();
  const { preferences, update } = useCompanionPreferences();
  const experienceDispatch = useExperienceDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [companionState, setCompanionState] = useState<CompanionState>("boot");
  const [subpanel, setSubpanel] = useState<Subpanel>("none");
  const [activeTourId, setActiveTourId] = useState<CompanionTourId | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [currentScript, setCurrentScript] = useState<CompanionScript | null>(null);
  const [fallbackCaptionIndex, setFallbackCaptionIndex] = useState(-1);
  const [canvasErrored, setCanvasErrored] = useState(false);
  const [announcement, setAnnouncement] = useState("RC-01 activated.");
  const [paused, setPaused] = useState(false);
  // Collapsed peek is the required default state on activation below the
  // desktop-dock breakpoint (1024px) - "minimised" already covers exactly
  // that behavior (header-only, hero/CTA/Observatory left fully visible),
  // so mobile reuses it as its starting state rather than inventing a
  // parallel concept. Desktop always starts fully open (the dock).
  const [minimised, setMinimised] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
  );
  // Mobile-only medium/expanded distinction (irrelevant on the desktop
  // dock, which always shows full content once un-minimised).
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const fallbackTimerRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const usingRealSpeech = speech.supported && !preferences.muted;
  const sound = useCompanionSound(preferences.soundOn);

  // Boot -> greeting -> idle, once per activation. Purely visual, no speech.
  // The activation chime (if enabled) fires here because this effect runs
  // exactly once, as a direct consequence of the user's own Activate click.
  useEffect(() => {
    sound.play("activate");
    const t1 = window.setTimeout(() => setCompanionState("greeting"), 900);
    const t2 = window.setTimeout(() => setCompanionState("idle"), 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per activation only
  }, []);

  // Guard values read by the scroll-linked section watcher's onChange
  // callback, kept fresh via a ref written during render rather than a
  // separate synchronizing effect (the callback fires later, asynchronously,
  // from a real IntersectionObserver event).
  const guardRef = useRef({ activeTourId, subpanel, companionState });
  useEffect(() => {
    guardRef.current = { activeTourId, subpanel, companionState };
  }, [activeTourId, subpanel, companionState]);

  const activeSection = useActiveSection(SECTION_IDS, pathname === "/", () => {
    const guard = guardRef.current;
    if (guard.activeTourId || guard.subpanel !== "none") return;
    if (guard.companionState === "boot" || guard.companionState === "sleep") return;
    setCompanionState("pointing");
    window.setTimeout(() => {
      setCompanionState((previous) => (previous === "pointing" ? "idle" : previous));
    }, 900);
  });

  // Derived at render time, not synced via effect: when real speech is the
  // active driver, the caption index IS speech.activeLineIndex - no
  // separate state to keep in sync. The timer-driven fallback path (speech
  // unsupported or muted) owns its own independent state.
  const captionIndex = usingRealSpeech ? speech.activeLineIndex : fallbackCaptionIndex;

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) window.clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(() => {
      setCompanionState("sleep");
    }, INACTIVITY_SLEEP_MS);
  }, []);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current !== null) window.clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  const playScript = useCallback(
    (script: CompanionScript, gestureState: CompanionState = "briefing") => {
      resetInactivityTimer();
      clearFallbackTimer();
      speech.stop();
      setCurrentScript(script);
      setPaused(false);
      setCompanionState((previous) => (previous === "sleep" ? "idle" : gestureState));

      if (speech.supported && !preferences.muted) {
        speech.speak(script.lines, () => {
          setCompanionState((previous) => (previous === "briefing" ? "idle" : previous));
        });
      } else {
        let index = 0;
        setFallbackCaptionIndex(0);
        const step = () => {
          index += 1;
          if (index >= script.lines.length) {
            setFallbackCaptionIndex(-1);
            setCompanionState("idle");
            return;
          }
          setFallbackCaptionIndex(index);
          fallbackTimerRef.current = window.setTimeout(step, SENTENCE_FALLBACK_MS);
        };
        fallbackTimerRef.current = window.setTimeout(step, SENTENCE_FALLBACK_MS);
      }
    },
    [speech, preferences.muted, clearFallbackTimer, resetInactivityTimer],
  );

  const handleSpeak = useCallback(() => {
    playScript(currentScript ?? scripts.welcome);
  }, [currentScript, playScript]);

  const handlePauseResume = useCallback(() => {
    resetInactivityTimer();
    if (usingRealSpeech) {
      if (speech.playbackState === "speaking") {
        speech.pause();
      } else if (speech.playbackState === "paused") {
        speech.resume();
      }
      return;
    }
    // Timer-driven fallback: pause just halts advancement, caption stays put.
    if (!paused) {
      clearFallbackTimer();
      setPaused(true);
    } else {
      setPaused(false);
    }
  }, [usingRealSpeech, speech, paused, clearFallbackTimer, resetInactivityTimer]);

  const handleStop = useCallback(() => {
    resetInactivityTimer();
    clearFallbackTimer();
    speech.stop();
    setPaused(false);
    setFallbackCaptionIndex(-1);
    setCompanionState("idle");
  }, [speech, clearFallbackTimer, resetInactivityTimer]);

  const handleReplay = useCallback(() => {
    if (!currentScript) return;
    playScript(currentScript, "briefing");
  }, [currentScript, playScript]);

  const closeSubpanel = useCallback(() => {
    setSubpanel("none");
  }, []);

  const exitTour = useCallback(() => {
    setActiveTourId(null);
    setTourStepIndex(0);
    handleStop();
  }, [handleStop]);

  const runTourStep = useCallback(
    (tourId: CompanionTourId, index: number) => {
      const tour = tours.find((item) => item.id === tourId);
      const step = tour?.steps[index];
      if (!tour || !step) return;

      if (step.anchor && pathname === "/") {
        document
          .getElementById(step.anchor)
          ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      }

      const script = scripts[step.scriptId];
      if (!script) return;

      if (step.anchor) {
        setCompanionState("pointing");
        const settleDelay = reducedMotion ? 0 : 650;
        window.setTimeout(() => {
          // Dispatched only once smooth-scroll has had time to settle, so
          // the flash is actually visible on whichever real component the
          // scroll landed on - not fired the instant scrolling starts,
          // where it would fade out before the section is even in view.
          // RC-01 "pointing" at the Reliability Spine should visibly affect
          // the real Observatory/spine list, not just play an isolated arm
          // gesture in its own panel (v5.0 audit: "robot does not clearly
          // interact with real Observatory stages"). Both
          // InfrastructureObservatory.tsx and ReliabilitySpine.tsx listen
          // for this typed event; whichever is actually on screen reacts.
          // v5.1: dispatches the one specific stage this step is about
          // (step.stageId) rather than a generic "highlight everything"
          // flash, so RC-01's pointing corresponds to the exact stage being
          // narrated.
          if (step.anchor === "spine") {
            dispatchObservatoryHighlight(step.stageId ?? "all");
          }
          playScript(script, "briefing");
        }, settleDelay);
      } else {
        playScript(script, "briefing");
      }

      if (index === tour.steps.length - 1) {
        setAnnouncement(`${tour.label} complete.`);
      }
    },
    [pathname, reducedMotion, playScript],
  );

  const selectTour = useCallback(
    (tourId: CompanionTourId) => {
      setActiveTourId(tourId);
      setTourStepIndex(0);
      setAnnouncement(`${tours.find((t) => t.id === tourId)?.label ?? "Tour"} started.`);
      runTourStep(tourId, 0);
    },
    [runTourStep],
  );

  const advanceTour = useCallback(
    (direction: 1 | -1) => {
      if (!activeTourId) return;
      const tour = tours.find((item) => item.id === activeTourId);
      if (!tour) return;
      const nextIndex = tourStepIndex + direction;
      if (nextIndex < 0 || nextIndex >= tour.steps.length) return;
      setTourStepIndex(nextIndex);
      runTourStep(activeTourId, nextIndex);
      if (nextIndex === tour.steps.length - 1 && direction === 1) {
        window.setTimeout(() => {
          setCompanionState("success");
          sound.play("success");
        }, 400);
      }
    },
    [activeTourId, tourStepIndex, runTourStep, sound],
  );

  const handleUnknownCommand = useCallback(() => {
    sound.play("error");
    setCompanionState("error");
    window.setTimeout(() => {
      setCompanionState((previous) => (previous === "error" ? "idle" : previous));
    }, 700);
  }, [sound]);

  const confirmNavigate = useCallback(
    (href: string) => {
      resetInactivityTimer();
      router.push(href);
    },
    [router, resetInactivityTimer],
  );

  const handleConsoleCommand = useCallback(
    (command: ConsoleCommand): string => {
      resetInactivityTimer();
      setCompanionState("thinking");
      const run = () => {
        switch (command) {
          case "help":
            setCompanionState("idle");
            break;
          case "projects":
            playScript(scripts.projects);
            break;
          case "spine":
            // V7: also traces every real stage across every surface that
            // reads selectedStageId/traceScope (System Trace,
            // ReliabilitySpine, ProjectCard, Proof Ledger, the
            // Operational Twin's instrument highlighting) - a real
            // dispatch, not just narration. traceScope alone has no
            // visible effect while selectedStageId is null (see
            // ReliabilitySpine.tsx), so both are set together.
            experienceDispatch({ type: "STAGE_SELECTED", stageId: "commit" });
            experienceDispatch({ type: "TRACE_SCOPE_SET", scope: "all" });
            playScript(scripts.spine);
            break;
          case "skills":
            playScript(scripts.skills);
            break;
          case "resume":
            playScript(scripts.contact);
            break;
          case "contact":
            playScript(scripts.contact);
            break;
          case "mute":
            update({ muted: !preferences.muted });
            setCompanionState("idle");
            break;
          case "stop":
            handleStop();
            break;
          case "atlas":
            // V7: real scene activation on a case-study page (Atlas
            // exists there); dispatching this from the homepage, where
            // Atlas isn't mounted, has no visible target but is not a
            // fabricated effect either - the shared state genuinely
            // changes, nothing simulates a response that isn't real.
            experienceDispatch({ type: "SCENE_CHANGED", scene: "atlas" });
            setCompanionState("idle");
            break;
          case "proof":
            experienceDispatch({ type: "STAGE_SELECTED", stageId: "commit" });
            experienceDispatch({ type: "TRACE_SCOPE_SET", scope: "all" });
            setCompanionState("idle");
            break;
          case "twin":
            experienceDispatch({ type: "SCENE_CHANGED", scene: "operational-twin" });
            setCompanionState("idle");
            break;
          case "reset":
            experienceDispatch({ type: "RESET" });
            setCompanionState("idle");
            break;
          case "pipeline":
            playScript(scripts.pipeline);
            break;
          case "recruiter":
            experienceDispatch({ type: "VISITOR_PATH_SET", path: "recruiter" });
            setCompanionState("idle");
            break;
          case "engineer":
            experienceDispatch({ type: "VISITOR_PATH_SET", path: "engineer" });
            setCompanionState("idle");
            break;
          case "explorer":
            experienceDispatch({ type: "VISITOR_PATH_SET", path: "explorer" });
            setCompanionState("idle");
            break;
        }
      };
      window.setTimeout(run, 260);

      switch (command) {
        case "help":
          return "Documented commands only: help, projects, spine, skills, resume, contact, mute, stop, atlas, proof, twin, reset, pipeline, recruiter, engineer, explorer.";
        case "projects":
          return "Speaking flagship project summaries — see captions below.";
        case "spine":
          return "Speaking the eight-stage Reliability Spine, and tracing every stage across System Trace, the Spine, project cards, and the Proof Ledger — see captions below.";
        case "skills":
          return "Speaking the capability matrix — see captions below.";
        case "resume":
          return "Résumé: open /resume from the header nav for the full operating history.";
        case "contact":
          return "Speaking verified contact methods — see captions below.";
        case "mute":
          return preferences.muted ? "Unmuted." : "Muted. Captions continue regardless.";
        case "stop":
          return "Stopped current playback.";
        case "atlas":
          return "Opening the Living Infrastructure Atlas on this page, if it's a case study — real nodes and stages derived from that project's own verified data, no invented ones.";
        case "proof":
          return "Tracing every stage so the Proof Ledger below shows every real claim across every project, not filtered to one.";
        case "twin":
          return "Activating the Operational Twin — closes this panel first, one canvas at a time.";
        case "reset":
          return "Resetting to a clean state — every trace, selection, and open scene, including this panel.";
        case "pipeline":
          return "Speaking the real automation pipeline this site ships through — see captions below, and the Automation Fabric section for the full record.";
        case "recruiter":
          return "Visitor path set to Recruiter — fast, outcome-first framing. Reset any time from the /work index.";
        case "engineer":
          return "Visitor path set to Engineer — full implementation detail. Reset any time from the /work index.";
        case "explorer":
          return "Visitor path set to Explorer — a slower, guided walk. Reset any time from the /work index.";
        default:
          return "Unrecognized.";
      }
    },
    [playScript, update, preferences.muted, handleStop, resetInactivityTimer, experienceDispatch],
  );

  const handleEscape = useCallback(() => {
    if (subpanel !== "none") {
      setSubpanel("none");
      return;
    }
    if (activeTourId) {
      exitTour();
      return;
    }
    handleStop();
    onDeactivate();
  }, [subpanel, activeTourId, exitTour, handleStop, onDeactivate]);

  // A document-level listener, not a handler scoped to this panel's DOM
  // subtree: after keyboard activation the previously-focused Activate
  // button is unmounted, which moves focus to document.body - outside any
  // panel-scoped onKeyDown's bubble path. Escape must work regardless of
  // where focus currently sits.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleEscape();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleEscape]);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Real docking, not just an overlay with a height cap: on desktop
  // (>=1024px, matched by the [data-rc01-docked] rule in globals.css) this
  // reserves body padding-right for the dock's own width, so the header,
  // hero, and every other section actually reflow into a narrower content
  // column instead of the panel floating on top of them. Below 1024px this
  // is a no-op (mobile keeps the bottom-sheet treatment from Phase B) and
  // nothing shifts.
  useEffect(() => {
    document.body.dataset.rc01Docked = "true";
    return () => {
      delete document.body.dataset.rc01Docked;
    };
  }, []);

  const show3D =
    webglSupported === true && !reducedMotion && !preferences.lowPowerMode && !canvasErrored;
  const qualityTier = resolveQualityTier(preferences.lowPowerMode);
  // v5.1: project briefings use a project-specific accent color (by real
  // category, see PROJECT_ACCENT_BY_CATEGORY) instead of the standard lime
  // status color, so RC-01 visibly differentiates "narrating a project"
  // from its other states.
  const projectAccent =
    companionState === "briefing" && currentScript?.id.startsWith("project:")
      ? accentForProjectSlug(currentScript.id.slice("project:".length))
      : null;
  const portraitVariant =
    companionState === "error" ? "error" : companionState === "sleep" ? "sleep" : "idle";

  const activeTour = activeTourId ? tours.find((t) => t.id === activeTourId) : null;
  const activeStep = activeTour?.steps[tourStepIndex];

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="RC-01 Reliability Companion panel"
      // Mobile (<1024px) has three explicit states: collapsed peek
      // (minimised, header-only - the default on activation, leaves the
      // hero/CTA/Observatory fully visible), medium (default once
      // restored - a moderate bottom sheet), and expanded (mobileExpanded -
      // near-full height with a safe-area-aware bottom inset, entered
      // automatically when Tours/Console need the room, or manually).
      // Desktop (>=1024px) ignores both mobile states entirely and is
      // always the full docked panel from Phase A, running from just below
      // the sticky header to the viewport bottom in the space the
      // [data-rc01-docked] rule in globals.css reserves - structurally
      // unable to cover the header, hero, CTA, or Observatory.
      className={cn(
        "fixed inset-x-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-lg border border-[var(--color-signal-lime)]/15 bg-[var(--color-control-black)]/96 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl print:hidden sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[22rem]",
        mobileExpanded
          ? "max-h-[calc(100dvh-1.5rem)] pb-[env(safe-area-inset-bottom)]"
          : "max-h-[min(calc(100vh-6.5rem),34rem)]",
        "lg:inset-x-auto lg:top-[4.5rem] lg:right-0 lg:bottom-0 lg:left-auto lg:w-[22rem] lg:max-h-none lg:rounded-none lg:rounded-tl-lg lg:border-y-0 lg:border-r-0 lg:pb-0",
      )}
    >
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Sticky header row: Minimise and Close/Deactivate must always be
          reachable, even when the scrollable body below is mid-scroll or
          hidden by Minimise. */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-cloud-linen)]">
            RC-01
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-telemetry-steel)]">
            Reliability Companion / Interactive Systems Guide
          </p>
          <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-packet-blue)]">
            {pathname === "/" && activeSection
              ? `Observing · ${SECTION_LABELS[activeSection] ?? activeSection}`
              : `Route · ${pathname}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-white/10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-signal-lime)]">
            {companionState}
          </span>
          <button
            type="button"
            onClick={() => {
              setMinimised((value) => !value);
              setMobileExpanded(false);
            }}
            aria-pressed={minimised}
            aria-label={minimised ? "Restore RC-01" : "Minimise RC-01"}
            className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
          >
            {minimised ? <ChevronUp size={16} aria-hidden /> : <Minus size={16} aria-hidden />}
          </button>
          {!minimised && (
            <button
              type="button"
              onClick={() => setMobileExpanded((value) => !value)}
              aria-pressed={mobileExpanded}
              aria-label={mobileExpanded ? "Collapse RC-01 to medium size" : "Expand RC-01"}
              className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)] lg:hidden"
            >
              {mobileExpanded ? (
                <Minimize2 size={14} aria-hidden />
              ) : (
                <Maximize2 size={14} aria-hidden />
              )}
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              handleStop();
              onDeactivate();
            }}
            aria-label="Deactivate RC-01"
            className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-coral)] hover:text-[var(--color-signal-coral)]"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>

      {minimised && (
        <p className="p-4 pt-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-telemetry-steel)] lg:pt-4">
          Minimised — select Restore to reopen.
        </p>
      )}

      {!minimised && (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-0">
      <div
        className="mt-3 h-40 w-full overflow-hidden rounded-xl border border-white/10 sm:h-44"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, #141d27 0%, #0a0f14 62%, #06090d 100%)",
        }}
      >
        {show3D ? (
          <CompanionCanvas
            state={companionState}
            quality={qualityPresets[qualityTier]}
            accentColor={projectAccent}
            onError={() => setCanvasErrored(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CompanionPortrait variant={portraitVariant} className="h-32 w-32" />
          </div>
        )}
        <span className="sr-only">RC-01 is currently in the {companionState} state.</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleSpeak}
          className="flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <Mic size={13} aria-hidden /> Speak
        </button>
        <button
          type="button"
          onClick={handlePauseResume}
          aria-label={
            usingRealSpeech
              ? speech.playbackState === "speaking"
                ? "Pause RC-01"
                : "Resume RC-01"
              : paused
                ? "Resume captions"
                : "Pause captions"
          }
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          {(usingRealSpeech ? speech.playbackState === "speaking" : !paused) ? (
            <Pause size={14} aria-hidden />
          ) : (
            <Play size={14} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop RC-01"
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-coral)] hover:text-[var(--color-signal-coral)]"
        >
          <Square size={13} aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleReplay}
          aria-label="Replay current script"
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <RotateCcw size={13} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => update({ muted: !preferences.muted })}
          aria-pressed={preferences.muted}
          aria-label={preferences.muted ? "Unmute RC-01" : "Mute RC-01"}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          {preferences.muted ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => update({ captionsOn: !preferences.captionsOn })}
          aria-pressed={preferences.captionsOn}
          aria-label={preferences.captionsOn ? "Turn captions off" : "Turn captions on"}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <Captions size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            update({ lowPowerMode: !preferences.lowPowerMode });
            setCanvasErrored(false);
          }}
          aria-pressed={preferences.lowPowerMode}
          aria-label={preferences.lowPowerMode ? "Turn off low-power mode" : "Turn on low-power mode"}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <BatteryLow size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => update({ soundOn: !preferences.soundOn })}
          aria-pressed={preferences.soundOn}
          aria-label={preferences.soundOn ? "Turn off interface sounds" : "Turn on interface sounds"}
          className="flex h-8 w-8 items-center justify-center rounded border border-white/15 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <Bell size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            setSubpanel(subpanel === "tours" ? "none" : "tours");
            setMobileExpanded(true); // Tours need the room - move straight to expanded on mobile.
          }}
          aria-pressed={subpanel === "tours"}
          className="flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <Compass size={13} aria-hidden /> Tours
        </button>
        <button
          type="button"
          onClick={() => {
            setSubpanel(subpanel === "console" ? "none" : "console");
            setMobileExpanded(true);
          }}
          aria-pressed={subpanel === "console"}
          className="flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <TerminalSquare size={13} aria-hidden /> Console
        </button>
      </div>

      {!speech.supported && (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-telemetry-steel)]">
          Voice synthesis unavailable in this browser — captions continue below.
        </p>
      )}

      {preferences.captionsOn && currentScript && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-packet-blue)]">
            {currentScript.title}
          </p>
          <p aria-live="polite" className="sr-only">
            {captionIndex >= 0 ? currentScript.lines[captionIndex] : ""}
          </p>
          <ul className="mt-1.5 space-y-1">
            {currentScript.lines.map((line, index) => (
              <li
                key={index}
                className={cn(
                  "text-[12px] leading-5",
                  index === captionIndex
                    ? "text-[var(--color-cloud-linen)]"
                    : "text-[var(--color-telemetry-steel)]",
                )}
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTour && activeStep && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-telemetry-steel)]">
            {activeTour.label} — step {tourStepIndex + 1} / {activeTour.steps.length}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => advanceTour(-1)}
              disabled={tourStepIndex === 0}
              className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => advanceTour(1)}
              disabled={tourStepIndex === activeTour.steps.length - 1}
              className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] disabled:opacity-30"
            >
              Next
            </button>
            <button
              type="button"
              onClick={exitTour}
              className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-coral)]"
            >
              Exit
            </button>
          </div>
        </div>
      )}
      {activeStep?.suggestedRoute && (
        <button
          type="button"
          onClick={() => confirmNavigate(activeStep.suggestedRoute!.href)}
          className="mt-2 w-full rounded border border-[var(--color-signal-lime)]/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-signal-lime)] hover:bg-[var(--color-signal-lime)]/10"
        >
          {activeStep.suggestedRoute.label} →
        </button>
      )}

      {subpanel === "tours" && (
        <CompanionTourPanel
          activeTourId={activeTourId}
          onSelect={selectTour}
          onClose={closeSubpanel}
        />
      )}
      {subpanel === "console" && (
        <CompanionConsole
          onCommand={handleConsoleCommand}
          onUnknownCommand={handleUnknownCommand}
          onClose={closeSubpanel}
        />
      )}
      </div>
      )}
    </div>
  );
}
