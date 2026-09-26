"use client";

import { useEffect, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";
import { storyState } from "@/lib/cinema/stageStore";

export type RunState = "pending" | "live" | "done" | "alert";

/** Stage (0-7) where the simulated release raises an alarm before recovering. */
export const ALERT_STAGE = 6;

/**
 * Phase 9 - the Reliability Spine as a sequence. Scroll position through
 * the spine list scrubs a *simulated* release down the eight stages; at
 * "Observe" it raises an alert, and "Recover" resolves it. Progress is
 * shared with the 3D stage (storyState) so the light column moves in step.
 * Returns the current stage index (-1 before the run starts, 8 when done).
 */
export function useReleaseRun(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    registerGsap();
    let last = -2;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 45%",
      onUpdate: (self) => {
        const p = self.progress;
        storyState.spineProgress = p;
        const index = p >= 0.999 ? 8 : p <= 0 ? -1 : Math.min(7, Math.floor(p * 8));
        storyState.spineAlert = index === ALERT_STAGE ? ALERT_STAGE : -1;
        if (index !== last) {
          last = index;
          setStage(index);
        }
      },
    });
    return () => {
      trigger.kill();
      storyState.spineProgress = 0;
      storyState.spineAlert = -1;
      gsap.killTweensOf(el);
    };
  }, [ref, enabled]);

  return stage;
}

export function runStateFor(index: number, current: number): RunState {
  if (current < 0 || index > current) return "pending";
  if (index < current) return "done";
  return index === ALERT_STAGE ? "alert" : "live";
}
