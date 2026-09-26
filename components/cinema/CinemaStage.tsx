"use client";

import { Component, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useWebGLSupport } from "@/lib/companion/useWebGLSupport";
import { useCompanionPreferences } from "@/lib/companion/useCompanionPreferences";
import { useExperienceState } from "@/lib/v6/ExperienceProvider";
import { setStageStatus, useStage } from "@/lib/cinema/stageStore";
import { BOOT_END_EVENT } from "@/components/shared/BootSequence";

const StageCanvas = dynamic(() => import("./StageCanvas"), { ssr: false });

class StageBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Automation gets the static site unless a test opts in with ?cinema=1. */
function automationAllowed() {
  if (typeof navigator === "undefined") return false;
  if (!navigator.webdriver) return true;
  return new URLSearchParams(window.location.search).get("cinema") === "1";
}

/**
 * Shell for the persistent 3D stage (see StageCanvas). Decides whether the
 * stage may run at all - never for reduced motion, low-power mode, missing
 * WebGL or automation - and loads it only once the page is idle, so it
 * never competes with first paint. While another 3D scene (RC-01's panel,
 * an Atlas view) owns the GPU, the stage pauses its render loop and fades
 * out, keeping the site's one-running-canvas rule.
 */
export function CinemaStage() {
  const reducedMotion = useReducedMotion();
  const webgl = useWebGLSupport();
  const { preferences } = useCompanionPreferences();
  const { activeScene } = useExperienceState();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const { quality, status } = useStage();
  // Quality 3 means this device couldn't hold ~45 fps even at the cheapest
  // settings: the stage retires for the session and the still takes over.
  const eligible = !reducedMotion && webgl && !preferences.lowPowerMode && !failed && quality < 3;

  useEffect(() => {
    if (!eligible || !automationAllowed()) {
      setStageStatus("off");
      return;
    }
    const idle =
      window.requestIdleCallback?.bind(window) ??
      ((cb: () => void) => window.setTimeout(cb, 600) as unknown as number);
    const cancel = window.cancelIdleCallback?.bind(window) ?? window.clearTimeout;
    let id: number | null = null;
    const schedule = () => {
      id = idle(() => {
        setStageStatus("loading");
        setReady(true);
      }, { timeout: 2500 } as never);
    };
    // Never compile shaders during the cold open: wait for it to finish.
    const booting = document.documentElement.dataset.boot === "play";
    if (booting) window.addEventListener(BOOT_END_EVENT, schedule, { once: true });
    else schedule();
    return () => {
      window.removeEventListener(BOOT_END_EVENT, schedule);
      if (id !== null) cancel(id);
    };
  }, [eligible]);

  const paused = activeScene !== null;

  useEffect(() => {
    if (!ready || !eligible) return;
    // Give the canvas a beat to draw its first frame before opening the windows.
    const id = window.setTimeout(() => setStageStatus(paused ? "paused" : "live"), paused ? 0 : 400);
    return () => window.clearTimeout(id);
  }, [ready, eligible, paused]);

  if (!ready || !eligible) return null;

  return (
    <div
      aria-hidden
      data-testid="cinema-stage"
      className="cinema-stage"
      data-state={status}
    >
      <StageBoundary
        onError={() => {
          setFailed(true);
          setStageStatus("off");
        }}
      >
        <StageCanvas paused={paused} />
      </StageBoundary>
    </div>
  );
}
