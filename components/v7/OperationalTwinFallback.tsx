"use client";

import { useMemo } from "react";
import { computeSpineInstruments } from "@/lib/v7/spineInstruments";
import { useExperienceState, useExperienceDispatch } from "@/lib/v6/ExperienceProvider";

/**
 * Complete static equivalent of the Instrument Deck - same real data
 * source (lib/v7/spineInstruments.ts), rendered as accessible SVG bars
 * instead of 3D boxes. Spec Section 11 fallback tier: "no WebGL canvas,
 * complete static SVG/HTML experience, all content and navigation
 * preserved." Every stage is a real <button>, not a decorative shape -
 * reduced-motion and no-WebGL visitors lose the 3D presentation, not the
 * functionality (stage selection still drives the same shared
 * selectedStageId the 3D scene would).
 */
const BAR_WIDTH = 64;
const BAR_GAP = 20;
const MAX_BAR_HEIGHT = 140;
const CHART_HEIGHT = 200;

export function OperationalTwinFallback({ reason }: { reason: string }) {
  const instruments = useMemo(() => computeSpineInstruments(), []);
  const experienceState = useExperienceState();
  const dispatch = useExperienceDispatch();
  const maxCount = Math.max(1, ...instruments.map((i) => i.demonstratedByCount));

  const width = instruments.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  return (
    <div className="mt-4" data-v7-scene="operational-twin-fallback" data-v7-ready="true">
      <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.08em] text-[var(--ink-muted)]">
        Operational Twin shown as a static deck ({reason}) - every stage below is
        real and selectable.
      </p>
      <svg
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Static instrument deck: eight Reliability Spine stages, bar height shows how many flagship projects demonstrate each stage"
        className="mt-3 h-auto w-full max-w-xl"
      >
        {instruments.map((instrument, i) => {
          const barHeight =
            (instrument.demonstratedByCount / maxCount) * MAX_BAR_HEIGHT + 20;
          const x = i * (BAR_WIDTH + BAR_GAP);
          const y = CHART_HEIGHT - barHeight - 20;
          const isActive = instrument.stageId === experienceState.selectedStageId;
          return (
            <g key={instrument.stageId}>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                fill={isActive ? "var(--color-signal-lime)" : "var(--color-telemetry-steel)"}
                opacity={isActive ? 1 : 0.45}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - 4}
                textAnchor="middle"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill="var(--ink-muted)"
              >
                {instrument.label.slice(0, 7).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-2">
        {instruments.map((instrument) => {
          const isActive = instrument.stageId === experienceState.selectedStageId;
          return (
            <button
              key={instrument.stageId}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                dispatch({ type: "STAGE_SELECTED", stageId: instrument.stageId })
              }
              className="rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors"
              style={{
                borderColor: isActive ? "var(--color-signal-lime)" : "var(--line)",
                color: isActive ? "var(--color-signal-lime)" : "var(--ink-muted)",
              }}
            >
              {instrument.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
