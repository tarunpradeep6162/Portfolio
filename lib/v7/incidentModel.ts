export interface IncidentStep {
  label: string;
  detail: string;
}

export interface Incident {
  slug: string;
  title: string;
  /** Which real project/system this happened in - "portfolio" for
   * incidents in the site's own engineering, not a specific case-study
   * project. Never a fabricated project. */
  system: string;
  observedSymptom: IncidentStep;
  evidenceCollected: IncidentStep;
  rootCause: IncidentStep;
  correction: IncidentStep;
  verification: IncidentStep;
  preventionOrAutomation: IncidentStep;
  /** Always present, even when the honest answer is "none identified" -
   * spec Section 10.5 requires this field on every incident; omitting it
   * when there genuinely isn't one would be hiding the model's own
   * honesty requirement, not satisfying it. */
  knownLimitation: IncidentStep;
}

export const incidentStepOrder: (keyof Pick<
  Incident,
  | "observedSymptom"
  | "evidenceCollected"
  | "rootCause"
  | "correction"
  | "verification"
  | "preventionOrAutomation"
  | "knownLimitation"
>)[] = [
  "observedSymptom",
  "evidenceCollected",
  "rootCause",
  "correction",
  "verification",
  "preventionOrAutomation",
  "knownLimitation",
];
