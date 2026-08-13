"use client";

import { useEffect } from "react";
import type { SpineStageId } from "@/content/types";

/**
 * A typed, shared event model for "RC-01 is pointing at a real Reliability
 * Spine stage" - replaces the untyped, parameterless
 * `new CustomEvent("rc01:observatory-highlight")` from the first pass of
 * this integration. Both InfrastructureObservatory.tsx and
 * ReliabilitySpine.tsx listen via the same hook below, so there is exactly
 * one add/removeEventListener pair per mounted listener component and no
 * risk of the event name or payload shape drifting between dispatcher and
 * listeners.
 */
export const OBSERVATORY_HIGHLIGHT_EVENT = "rc01:observatory-highlight";

export interface ObservatoryHighlightDetail {
  /** A single real stage id, or "all" for a general (non-per-stage) flash. */
  stageId: SpineStageId | "all";
}

export function dispatchObservatoryHighlight(stageId: SpineStageId | "all") {
  window.dispatchEvent(
    new CustomEvent<ObservatoryHighlightDetail>(OBSERVATORY_HIGHLIGHT_EVENT, {
      detail: { stageId },
    }),
  );
}

/**
 * Subscribes to the highlight event for the lifetime of the calling
 * component and cleans up on unmount - the one place this add/remove pair
 * is written, rather than duplicated in every listener.
 */
export function useObservatoryHighlightListener(
  onHighlight: (stageId: SpineStageId | "all") => void,
) {
  useEffect(() => {
    function handleHighlight(event: Event) {
      const custom = event as CustomEvent<ObservatoryHighlightDetail>;
      onHighlight(custom.detail.stageId);
    }
    window.addEventListener(OBSERVATORY_HIGHLIGHT_EVENT, handleHighlight);
    return () => window.removeEventListener(OBSERVATORY_HIGHLIGHT_EVENT, handleHighlight);
    // Correctly depends on onHighlight (not an empty array) so the listener
    // never closes over a stale callback - re-subscribing on every change is
    // negligible cost for an event this infrequent.
  }, [onHighlight]);
}
