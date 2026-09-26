"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { Box, Download } from "lucide-react";
import { useExperienceDispatch, useExperienceState } from "@/lib/v6/ExperienceProvider";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

let webglCache: boolean | null = null;
function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    webglCache = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
const noopSubscribe = () => () => {};

/**
 * SSR-safe WebGL check: the server (and the hydration pass) report `false`,
 * then the real value applies - no hydration mismatch, unlike a lazy
 * useState initializer in a server-rendered component.
 */
function useWebGL(): boolean {
  return useSyncExternalStore(noopSubscribe, detectWebGL, () => false);
}

const AvatarCanvas = dynamic(() => import("./AvatarCanvas").then((m) => m.AvatarCanvas), {
  ssr: false,
  loading: () => null,
});

/**
 * Static render first (zero 3D cost for everyone), interactive model on
 * request. Uses the shared `activeScene` slot, so opening the avatar closes
 * RC-01 / Atlas and the site never runs two WebGL canvases at once.
 */
export function AvatarViewer() {
  const { activeScene } = useExperienceState();
  const dispatch = useExperienceDispatch();
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const live = activeScene === "avatar" && !failed;
  const canRender3D = webgl === true && !failed;

  return (
    <figure className="relative">
      <div className="relative aspect-[2/3] w-full overflow-hidden border border-white/10 bg-[#0b0f14]">
        {live ? (
          <AvatarCanvas onError={() => setFailed(true)} />
        ) : (
          <Image
            src="/avatar/renders/three-quarter.png"
            alt="Tarun's armoured avatar: black-chrome plated suit with lime light strips and his hologram face on the helmet visor."
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-contain"
            priority={false}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-telemetry-steel)]">
          <span>Digital twin / TP-01</span>
          <span>{live ? "Live · drag to rotate" : "Render"}</span>
        </div>
      </div>
      <figcaption className="mt-4 flex flex-wrap gap-3">
        {canRender3D && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SCENE_CHANGED", scene: live ? null : "avatar" })}
            aria-pressed={live}
            className="inline-flex items-center gap-2 border border-[var(--color-signal-lime)] bg-[var(--color-signal-lime)] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-control-black)] transition-colors hover:bg-transparent hover:text-[var(--color-signal-lime)]"
          >
            <Box size={14} aria-hidden /> {live ? "Close 3D" : reducedMotion ? "Explore in 3D (animated)" : "Explore in 3D"}
          </button>
        )}
        <a
          href="/avatar/tarun-armour.glb"
          download
          className="no-animation inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-cloud-linen)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
        >
          <Download size={14} aria-hidden /> Download .glb
        </a>
      </figcaption>
    </figure>
  );
}
