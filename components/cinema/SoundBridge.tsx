"use client";

import { useEffect } from "react";
import { onCue } from "@/lib/cinema/cues";
import { playSound, resumeSoundOnGesture } from "@/lib/cinema/sound";

/**
 * Wires the sound engine to the page: a tick when the pointer lands on a
 * link or button (throttled, one per element), a whoosh on route
 * transitions, an impact on chapter slates. Renders nothing; every call is
 * a no-op unless the visitor has turned sound on.
 */
export function SoundBridge() {
  useEffect(() => {
    let lastTarget: Element | null = null;
    let lastAt = 0;
    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.("a, button, [role='button']") ?? null;
      if (!el || el === lastTarget) return;
      lastTarget = el;
      const now = performance.now();
      if (now - lastAt < 60) return;
      lastAt = now;
      playSound("tick");
    };
    const onOut = (event: PointerEvent) => {
      if (!(event.relatedTarget as Element | null)?.closest?.("a, button, [role='button']")) lastTarget = null;
    };
    const onGesture = () => resumeSoundOnGesture();
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    const off = onCue((cue) => {
      if (cue.type === "transition") playSound("whoosh");
      else if (cue.type === "slate") playSound("impact");
      else if (cue.type === "director" && cue.on) playSound("servo");
    });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      off();
    };
  }, []);
  return null;
}
