"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import { experienceReducer } from "./experienceReducer";
import { initialExperienceState, type ExperienceAction, type ExperienceState } from "./types";

const ExperienceStateContext = createContext<ExperienceState | null>(null);
const ExperienceDispatchContext = createContext<Dispatch<ExperienceAction> | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(experienceReducer, initialExperienceState);
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
