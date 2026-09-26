"use client";

import { useEffect, useState } from "react";
import { onCue } from "@/lib/cinema/cues";

/**
 * Global letterbox bars (Phases 12 + 14). Any part of the site can call
 * for widescreen framing through the cue bus; RC-01's director mode uses
 * it during guided tours, with a slate naming the current shot.
 */
export function Letterbox() {
  const [sources, setSources] = useState<Set<string>>(new Set());
  const [label, setLabel] = useState<string | null>(null);

  useEffect(
    () =>
      onCue((cue) => {
        if (cue.type === "letterbox" || cue.type === "director") {
          const source = cue.type === "director" ? "director" : cue.source;
          setSources((prev) => {
            const next = new Set(prev);
            if (cue.on) next.add(source);
            else next.delete(source);
            return next;
          });
          if (cue.type === "director") setLabel(cue.on ? (cue.label ?? null) : null);
        }
      }),
    [],
  );

  const on = sources.size > 0;
  return (
    <div aria-hidden className="letterbox" data-on={on}>
      <div className="letterbox-bar letterbox-top">
        {label && (
          <span className="letterbox-label font-mono text-[9px] uppercase tracking-[0.24em]">
            <span className="letterbox-rec" /> Director mode · {label}
          </span>
        )}
      </div>
      <div className="letterbox-bar letterbox-bottom" />
    </div>
  );
}
