"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RC01Model } from "./RC01Model";
import type { CompanionState, QualitySettings } from "@/lib/companion/state";

class CanvasErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

interface CompanionCanvasProps {
  state: CompanionState;
  quality: QualitySettings;
  /** Project-specific visor accent during a project briefing (v5.1), null otherwise. */
  accentColor?: string | null;
  onError: () => void;
  /** Called once if the device cannot render the model smoothly. */
  onSlow?: () => void;
}

/** Below this sustained frame rate the 3D model makes the whole page sluggish. */
const MIN_FPS = 20;
const WARM_UP_S = 2.5;
const SAMPLE_S = 2;

/**
 * Frame-rate guard (same idea as the cinema stage's adaptive cutoff): after a
 * warm-up for shader compiles, average real frame times over a short window
 * and report once if the device sustains less than MIN_FPS. On devices
 * without fast graphics the model otherwise pins the main thread, so clicks
 * and scrolling lag across the entire page, not just in the panel.
 */
function FrameRateGuard({ onSlow }: { onSlow: () => void }) {
  const sample = useRef({ elapsed: 0, frames: 0, time: 0, reported: false });
  useFrame((_, delta) => {
    const s = sample.current;
    if (s.reported) return;
    s.elapsed += delta;
    if (s.elapsed < WARM_UP_S) return;
    s.frames += 1;
    s.time += delta;
    if (s.time < SAMPLE_S) return;
    if (s.frames / s.time < MIN_FPS) {
      s.reported = true;
      onSlow();
    } else {
      s.frames = 0;
      s.time = 0;
    }
  });
  return null;
}

/**
 * Owns the Canvas lifecycle: pauses the render loop entirely when the tab is
 * hidden or the canvas leaves the viewport (spec: "pause when hidden" /
 * "pause or reduce when outside the viewport"), caps DPR per quality tier,
 * and recovers from a lost WebGL context or a render error by reporting up
 * to the parent, which swaps in the static CompanionPortrait - never a
 * blank canvas.
 */
export function CompanionCanvas({ state, quality, accentColor, onError, onSlow }: CompanionCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // react-three-fiber calls forceContextLoss() when the Canvas unmounts, which
  // fires "webglcontextlost". That is a deliberate teardown, not a crash, so
  // it must not mark the canvas as failed (which would keep the portrait up
  // after low-power is turned off or "Show 3D anyway" is pressed).
  const unmounting = useRef(false);
  useEffect(
    () => () => {
      unmounting.current = true;
    },
    [],
  );
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleVisibility() {
      setPageVisible(!document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const running = inView && pageVisible;

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <CanvasErrorBoundary onError={onError}>
        <Canvas
          dpr={quality.dpr}
          frameloop={running ? "always" : "never"}
          gl={{ antialias: quality.antialias, alpha: true, powerPreference: "low-power" }}
          camera={{ position: [0, 0.05, 3.3], fov: 30 }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              (event) => {
                if (unmounting.current) return;
                event.preventDefault();
                onError();
              },
              { once: true },
            );
          }}
        >
          <RC01Model
            state={state}
            fullEmissiveDetail={quality.fullEmissiveDetail}
            accentColor={accentColor ?? undefined}
          />
          {onSlow && <FrameRateGuard onSlow={onSlow} />}
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
