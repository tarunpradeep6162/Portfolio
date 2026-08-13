"use client";

import { useCallback, useState } from "react";

export interface CompanionPreferences {
  muted: boolean;
  captionsOn: boolean;
  lowPowerMode: boolean;
  soundOn: boolean;
}

const STORAGE_KEY = "rc01-preferences";

const defaults: CompanionPreferences = {
  muted: false,
  captionsOn: true,
  lowPowerMode: false,
  soundOn: false,
};

function readStoredPreferences(): CompanionPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

/**
 * User-controlled, persisted companion preferences - not a device
 * benchmark. Low-power mode in particular is an honest manual switch, not
 * inferred from hardware. This hook only ever mounts client-side (via the
 * ssr:false dynamic import in CompanionRoot), so reading localStorage in a
 * lazy useState initializer is safe and avoids an effect-driven rerender.
 */
export function useCompanionPreferences() {
  const [preferences, setPreferences] = useState<CompanionPreferences>(readStoredPreferences);

  const update = useCallback((patch: Partial<CompanionPreferences>) => {
    setPreferences((previous) => {
      const next = { ...previous, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode, quota) - preference just won't persist.
      }
      return next;
    });
  }, []);

  return { preferences, update };
}
