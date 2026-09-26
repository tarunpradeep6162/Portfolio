"use client";

import { useRef } from "react";
import { Play, X } from "lucide-react";

/**
 * Phase 20 - the site's trailer: a ~50 s screen recording of the site
 * itself (cold open, stage, spine run, a case study), played in a native
 * <dialog> so focus, Escape-to-close and the backdrop come for free.
 */
export function TrailerButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = () => {
    video.current?.pause();
    dialog.current?.close();
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialog.current?.showModal();
          void video.current?.play().catch(() => undefined);
        }}
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal-lime)] hover:text-[var(--color-cloud-linen)]"
      >
        <Play size={12} aria-hidden /> Watch the trailer
      </button>
      <dialog
        ref={dialog}
        aria-label="Site trailer"
        onClose={() => video.current?.pause()}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
        className="trailer-dialog m-auto w-[min(92vw,70rem)] bg-transparent p-0 backdrop:bg-black/85"
      >
        <div className="relative border border-white/15 bg-black">
          <video
            ref={video}
            src="/trailer/tarun-portfolio-trailer.webm"
            poster="/trailer/poster.webp"
            controls
            playsInline
            preload="none"
            className="block aspect-video w-full"
          >
            Your browser cannot play this WebM video.
          </video>
          <button
            type="button"
            onClick={close}
            aria-label="Close trailer"
            className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center border border-white/20 text-[var(--color-cloud-linen)] hover:border-[var(--color-signal-lime)]"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </dialog>
    </>
  );
}
