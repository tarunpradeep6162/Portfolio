/**
 * Field<T> makes "we don't have this fact yet" a type-level state instead of
 * an empty string or an omitted key. Every genuinely-missing fact from the
 * spec (Stackly bullets, credential IDs, screenshots, the resume file) is
 * wrapped here so the UI is forced to render an explicit "Needs input" state
 * rather than a blank space or a fabricated value.
 */
export type Field<T> =
  { status: "ready"; value: T } | { status: "needs-input"; note: string };

export function isReady<T>(
  field: Field<T>,
): field is { status: "ready"; value: T } {
  return field.status === "ready";
}

export type SpineStageId =
  | "commit"
  | "build"
  | "test"
  | "container"
  | "network"
  | "cloud"
  | "observe"
  | "recover";

export interface SpineStage {
  id: SpineStageId;
  label: string;
  description: string;
}

export type ProjectCategory =
  "Cloud" | "DevOps" | "Systems" | "Creative Engineering";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface FlagshipProject {
  kind: "flagship";
  slug: string;
  title: string;
  categories: ProjectCategory[];
  spineStages: SpineStageId[];
  summary: string;
  context: string;
  responsibility: string;
  flow: string;
  implementationDecisions: string[];
  toolsAndServices: string[];
  challengeAndResolution: string;
  outcome: string;
  links: ProjectLink[];
  screenshot: Field<{ src: string; alt: string }>;
  labelNote?: string;
}

export interface LabProject {
  kind: "lab";
  slug: string;
  title: string;
  categories: ProjectCategory[];
  summary: string;
  toolsAndServices: string[];
  links: Field<ProjectLink[]>;
}

export type Project = FlagshipProject | LabProject;

export interface ExperienceRole {
  role: string;
  org: string;
  dates: string;
  location?: string;
  achievements: Field<string[]>;
}

export interface EducationEntry {
  credential: string;
  institution: string;
  date: string;
}

export interface Certification {
  name: string;
  completed?: string;
  issuerLink: Field<string>;
  credentialId: Field<string>;
}
