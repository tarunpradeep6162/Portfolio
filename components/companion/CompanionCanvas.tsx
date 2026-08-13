"use client";

import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
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
}

/**
 * Owns the Canvas lifecycle: pauses the render loop entirely when the tab is
 * hidden or the canvas leaves the viewport (spec: "pause when hidden" /
 * "pause or reduce when outside the viewport"), caps DPR per quality tier,
 * and recovers from a lost WebGL context or a render error by reporting up
 * to the parent, which swaps in the static CompanionPortrait - never a
 * blank canvas.
 */
export function CompanionCanvas({ state, quality, accentColor, onError }: CompanionCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
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
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
