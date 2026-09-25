import { projects } from "@/content/projects";
import type { Audience } from "@/lib/rc01/actions";

/**
 * What RC-01 remembers between visits - on this device only (localStorage),
 * never sent anywhere except as a single "returning visitor" boolean in the
 * chat context. Nothing is recorded until the visitor has opened RC-01 at
 * least once, and "Forget me" wipes it entirely.
 */
export interface VisitorMemory {
  visits: number;
  lastVisitAt: number;
  /** Most recent first, capped. */
  recentProjects: string[];
  audience: Audience | null;
}

const KEY = "rc01-memory";
const SESSION_KEY = "rc01-session-counted";
const MAX_PROJECTS = 5;

export function readMemory(): VisitorMemory | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitorMemory>;
    return {
      visits: Number(parsed.visits) || 0,
      lastVisitAt: Number(parsed.lastVisitAt) || 0,
      recentProjects: Array.isArray(parsed.recentProjects)
        ? parsed.recentProjects.filter((slug): slug is string => typeof slug === "string")
        : [],
      audience:
        parsed.audience === "recruiter" || parsed.audience === "engineer" || parsed.audience === "explorer"
          ? parsed.audience
          : null,
    };
  } catch {
    return null;
  }
}

function write(memory: VisitorMemory) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Storage unavailable - memory simply doesn't persist.
  }
}

/** Starts remembering (called when the visitor first activates RC-01). */
export function ensureMemory(): VisitorMemory {
  const existing = readMemory();
  if (existing) return existing;
  const fresh: VisitorMemory = { visits: 1, lastVisitAt: Date.now(), recentProjects: [], audience: null };
  write(fresh);
  markSessionCounted();
  return fresh;
}

function markSessionCounted() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

/** Counts a new browsing session once, if memory is active. */
export function recordSession(): void {
  const memory = readMemory();
  if (!memory) return;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
  } catch {
    return;
  }
  markSessionCounted();
  write({ ...memory, visits: memory.visits + 1, lastVisitAt: Date.now() });
}

export function recordPath(pathname: string): void {
  const memory = readMemory();
  if (!memory) return;
  const match = /^\/work\/([\w-]+)$/.exec(pathname);
  if (!match || !projects.some((project) => project.slug === match[1])) return;
  const recentProjects = [match[1], ...memory.recentProjects.filter((slug) => slug !== match[1])].slice(
    0,
    MAX_PROJECTS,
  );
  write({ ...memory, recentProjects });
}

export function recordAudience(audience: Audience): void {
  const memory = readMemory();
  if (memory) write({ ...memory, audience });
}

export function forgetMemory(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/** A local, non-AI greeting for returning visitors - or null for first visits. */
export function returningGreeting(memory: VisitorMemory | null): string | null {
  if (!memory || memory.visits < 2) return null;
  const lastSlug = memory.recentProjects[0];
  const last = lastSlug ? projects.find((project) => project.slug === lastSlug) : undefined;
  return last
    ? `Welcome back. Last time you were looking at ${last.title} - want to pick up there, or see something new?`
    : "Welcome back. What would you like to look at this time?";
}
