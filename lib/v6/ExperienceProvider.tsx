"use client";

import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { experienceReducer } from "./experienceReducer";
import { initialExperienceState, type ExperienceAction, type ExperienceState } from "./types";

const ExperienceStateContext = createContext<ExperienceState | null>(null);
const ExperienceDispatchContext = createContext<Dispatch<ExperienceAction> | null>(null);

const VISITOR_PATH_STORAGE_KEY = "v6-visitor-path";
const VALID_PATHS = new Set(["recruiter", "engineer", "explorer"]);

/**
 * Reads the persisted visitor path once, synchronously, before first
 * render - matching useCompanionPreferences' existing lazy-useState
 * pattern so there's no flash from "no path" to "restored path" on
 * mount. This is the only field in ExperienceState that's ever persisted;
 * everything else is deliberately session-only (scene/selection state
 * resetting on reload is correct, not a bug to fix).
 */
function initState(): ExperienceState {
  if (typeof window === "undefined") return initialExperienceState;
  try {
    const stored = window.localStorage.getItem(VISITOR_PATH_STORAGE_KEY);
    if (stored && VALID_PATHS.has(stored)) {
      return { ...initialExperienceState, visitorPath: stored as ExperienceState["visitorPath"] };
    }
  } catch {
    // Storage unavailable (private mode, quota) - falls through to the default, unpersisted state.
  }
  return initialExperienceState;
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(experienceReducer, undefined, initState);

  // Persists only the visitor-path preference, only to localStorage - no
  // analytics, no network request, matching the exact pattern already
  // verified for the low-power toggle (useCompanionPreferences).
  useEffect(() => {
    try {
      if (state.visitorPath) {
        window.localStorage.setItem(VISITOR_PATH_STORAGE_KEY, state.visitorPath);
      } else {
        window.localStorage.removeItem(VISITOR_PATH_STORAGE_KEY);
      }
    } catch {
      // Storage unavailable - preference just won't persist across reloads.
    }
  }, [state.visitorPath]);

  return (
    <ExperienceStateContext.Provider value={state}>
      <ExperienceDispatchContext.Provider value={dispatch}>
        {children}
      </ExperienceDispatchContext.Provider>
    </ExperienceStateContext.Provider>
  );
}

export function useExperienceState(): ExperienceState {
  const state = useContext(ExperienceStateContext);
  if (!state) {
    throw new Error("useExperienceState must be used within an ExperienceProvider");
  }
  return state;
}

export function useExperienceDispatch(): Dispatch<ExperienceAction> {
  const dispatch = useContext(ExperienceDispatchContext);
  if (!dispatch) {
    throw new Error("useExperienceDispatch must be used within an ExperienceProvider");
  }
  return dispatch;
}
