/**
 * Shared-element transition memory (Phase 16). When a project card is
 * clicked, the card's cover rectangle is remembered; the case study's
 * cover shot then animates *from* that rectangle into its own place, so the
 * card appears to open into the page (FLIP: First, Last, Invert, Play).
 */
export interface FlipRecord {
  href: string;
  rect: { left: number; top: number; width: number; height: number };
  at: number;
}

let record: FlipRecord | null = null;

export function rememberFlip(next: FlipRecord) {
  record = next;
}

/** True if a fresh record targets this path (without consuming it). */
export function hasFlipFor(pathname: string): boolean {
  if (!record || Date.now() - record.at > 4000 || typeof window === "undefined") return false;
  return new URL(record.href, window.location.origin).pathname === pathname;
}

/** Returns (and consumes) the record if it is fresh and for this path. */
export function takeFlip(pathname: string): FlipRecord | null {
  const r = record;
  record = null;
  if (!r || Date.now() - r.at > 4000) return null;
  return new URL(r.href, window.location.origin).pathname === pathname ? r : null;
}
