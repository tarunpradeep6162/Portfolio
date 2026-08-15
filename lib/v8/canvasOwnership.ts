/**
 * Runtime, testable enforcement of the site-wide "at most one mounted
 * canvas" invariant. Before V8, this invariant held only because three
 * independently-written scene hosts (Atlas, Operational Twin, RC-01) each
 * happened to gate their own <Canvas> on the same shared `activeScene`
 * reducer field the same way - correct, but nothing stopped a future
 * fourth scene (or a bug in one of the three) from mounting without going
 * through that check. This module makes the invariant structural: every
 * canvas-owning scene claims ownership under its own key on mount and
 * releases it on unmount: a second claim while one is already held is a
 * real, detectable bug, not just something the type system happens not to
 * catch.
 */
export interface CanvasOwnershipViolation {
  attempted: string;
  currentOwner: string;
}

let currentOwner: string | null = null;

/**
 * Returns null on a successful claim. Returns the conflict details (never
 * throws) when another scene already holds ownership, so the caller can
 * decide how to surface it (dispatch a scene error, log, etc.) rather than
 * this module dictating a specific recovery path.
 */
export function claimCanvasOwnership(scene: string): CanvasOwnershipViolation | null {
  if (currentOwner !== null && currentOwner !== scene) {
    return { attempted: scene, currentOwner };
  }
  currentOwner = scene;
  return null;
}

export function releaseCanvasOwnership(scene: string): void {
  if (currentOwner === scene) currentOwner = null;
}

export function getCanvasOwner(): string | null {
  return currentOwner;
}

/** Test-only - production code never needs this since ownership is always
 * released on unmount. */
export function __resetCanvasOwnershipForTests(): void {
  currentOwner = null;
}
