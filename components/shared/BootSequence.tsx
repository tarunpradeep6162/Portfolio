"use client";

import { useEffect, useState } from "react";
import { hero, site } from "@/content/site";

export const BOOT_SESSION_KEY = "tp-boot-seen";
/** Total runtime of the CSS timeline in globals.css (.boot-*), in ms. */
export const BOOT_DURATION_MS = 1900;

/**
 * Runs before first paint (inlined in <body>, ahead of the overlay):
 * decides whether the boot sequence plays, so returning visitors, reduced-
 * motion visitors and automation never see even one frame of it.
 */
export const bootGateScript = `(function(){try{var d=document.documentElement;if(sessionStorage.getItem("${BOOT_SESSION_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches||navigator.webdriver){d.dataset.boot="skip"}else{d.dataset.boot="play";sessionStorage.setItem("${BOOT_SESSION_KEY}","1")}}catch(e){document.documentElement.dataset.boot="skip"}})();`;

const LOG = [
  "init  control-plane ........ ok",
  "load  reliability-spine .... 8 stages",
  "mount case-studies ......... 4 systems",
  `route ${site.location.split(",")[0].toLowerCase()} → cloud ..... online`,
];

/**
 * First-visit "system boot": the site opens like an operations console
 * coming online, then the two halves of the screen part to reveal the hero.
 * The whole timeline is CSS (globals.css) so it plays - and, crucially,
 * clears - even before hydration; this component only adds the live
 * percentage counter and click/key-to-skip.
 */
export function BootSequence() {
  const [percent, setPercent] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.boot !== "play") return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = Math.min(100, Math.round(((now - start) / 1100) * 100));
      setPercent(p);
      if (p < 100) frame = requestAnimationFrame(tick);
    });
    const skip = () => {
      setSkipped(true);
      document.documentElement.dataset.boot = "skip";
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    const done = window.setTimeout(() => {
      document.documentElement.dataset.boot = "done";
    }, BOOT_DURATION_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);

  if (skipped) return null;

  return (
    <div className="boot-overlay" aria-hidden>
      <div className="boot-panel boot-panel-top control-grid" />
      <div className="boot-panel boot-panel-bottom control-grid" />
      <div className="boot-content">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-signal-lime)]">
          {site.name} / {hero.eyebrow}
        </p>
        <ul className="mt-6 space-y-1.5 font-mono text-[11px] text-[var(--color-telemetry-steel)]">
          {LOG.map((line, index) => (
            <li key={line} className="boot-line" style={{ animationDelay: `${120 + index * 190}ms` }}>
              <span className="text-[var(--color-signal-lime)]">›</span> {line}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-end justify-between gap-6">
          <div className="h-px flex-1 overflow-hidden bg-white/10">
            <div className="boot-progress h-full bg-[var(--color-signal-lime)]" />
          </div>
          <span className="font-display text-4xl font-bold tabular-nums tracking-[-0.04em] text-[var(--color-cloud-linen)]">
            {String(percent).padStart(3, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
