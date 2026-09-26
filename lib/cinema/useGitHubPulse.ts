"use client";

import { useEffect, useState } from "react";

export interface GitHubPulse {
  /** Public events in the last 7 days, or null if unknown. */
  weekEvents: number | null;
  /** 0.4 (quiet) .. 2 (busy): multiplies packet traffic in the Atlas. */
  rate: number;
}

const CACHE_KEY = "tp-gh-pulse";

/**
 * Phase 18 - the world reacts to real activity. Reads Tarun's public
 * GitHub event feed (unauthenticated, cached for the session) and turns
 * "events this week" into a traffic multiplier for Atlas packets. Fails
 * quietly to a neutral rate - the scene never depends on the network.
 */
export function useGitHubPulse(profileUrl: string, enabled: boolean): GitHubPulse {
  const [pulse, setPulse] = useState<GitHubPulse>({ weekEvents: null, rate: 1 });

  useEffect(() => {
    if (!enabled) return;
    const user = profileUrl.replace(/\/+$/, "").split("/").pop();
    if (!user) return;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const value = JSON.parse(cached) as GitHubPulse;
        void Promise.resolve().then(() => setPulse(value));
        return;
      }
    } catch {
      // storage blocked: fetch instead
    }
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events/public?per_page=100`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((events: { created_at?: string }[]) => {
        const weekAgo = Date.now() - 7 * 864e5;
        const week = events.filter((e) => e.created_at && Date.parse(e.created_at) > weekAgo).length;
        const next = { weekEvents: week, rate: Math.min(2, 0.4 + week / 20) };
        setPulse(next);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [profileUrl, enabled]);

  return pulse;
}
