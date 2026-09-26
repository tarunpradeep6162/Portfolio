"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { emitCue } from "@/lib/cinema/cues";

export const BOOT_SESSION_KEY = "tp-boot-seen";
/** Total runtime of the CSS timeline in globals.css (.cold-*), in ms. */
export const BOOT_DURATION_MS = 4600;
/** When the letterbox starts to open and the hero copy should begin its reveal. */
export const BOOT_REVEAL_MS = 3700;
/** Fired on window when the cold open ends (naturally or skipped). */
export const BOOT_END_EVENT = "tp:boot-end";

/**
 * Runs before first paint (inlined in <body>, ahead of the overlay):
 * decides whether the cold open plays, so returning visitors, reduced-
 * motion visitors and automation never see even one frame of it.
 */
export const bootGateScript = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("${BOOT_SESSION_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches||navigator.webdriver){d.dataset.boot="skip"}else{d.dataset.boot="play";sessionStorage.setItem("${BOOT_SESSION_KEY}","1")}}catch(e){document.documentElement.dataset.boot="skip"}})();`;

/**
 * Phase 5 - the cold open. A ~4.5 s title sequence, once per session:
 *
 *   black -> a lime visor line draws across the frame -> it opens into
 *   RC-01's visor, Tarun's hologram flickering on inside -> identity
 *   readout -> the visor snaps shut -> title card (name tracks in, role
 *   under it) -> letterbox bars part to reveal the site.
 *
 * The whole timeline is CSS (globals.css .cold-*), so it plays - and,
 * crucially, clears - even before hydration. This component only adds
 * click/key-to-skip, the end event, and the title-card sound cue.
 */
export function BootSequence() {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.boot !== "play") return;
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      window.dispatchEvent(new Event(BOOT_END_EVENT));
    };
    const skip = () => {
      setSkipped(true);
      document.documentElement.dataset.boot = "skip";
      end();
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    const slate = window.setTimeout(() => emitCue({ type: "slate", label: site.name }), 2300);
    const reveal = window.setTimeout(end, BOOT_REVEAL_MS);
    const done = window.setTimeout(() => {
      document.documentElement.dataset.boot = "done";
    }, BOOT_DURATION_MS);
    return () => {
      window.clearTimeout(slate);
      window.clearTimeout(reveal);
      window.clearTimeout(done);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (skipped) return null;

  const [first, ...rest] = site.name.replace(/\s+B$/, "").split(" ");
  return (
    <div className="boot-overlay cold-open" aria-hidden>
      <div className="cold-bar cold-bar-top" />
      <div className="cold-bar cold-bar-bottom" />

      <div className="cold-visor">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/rc01/face-holo.webp" alt="" className="cold-face" />
        <div className="cold-scan" />
      </div>
      <div className="cold-line" />
      <p className="cold-readout font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-signal-lime)]">
        RC-01 · identity verified · operator online
      </p>

      <div className="cold-title">
        <p className="font-display text-[clamp(2.6rem,9vw,8.5rem)] font-bold uppercase leading-[0.8] tracking-[-0.06em] text-[var(--color-cloud-linen)]">
          <span className="cold-title-word">{first}</span>{" "}
          <span className="cold-title-word text-[var(--color-signal-lime)]">{rest.join(" ")}</span>
        </p>
        <p className="cold-subtitle mt-6 font-mono text-[10px] uppercase tracking-[0.34em] text-[var(--color-telemetry-steel)]">
          Reliability, engineered · a portfolio in motion
        </p>
      </div>

      <p className="cold-skip font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--color-telemetry-steel)]">
        Press any key to skip
      </p>
    </div>
  );
}
