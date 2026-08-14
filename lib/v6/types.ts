import type { ProjectCategory, SpineStageId } from "@/content/types";

/**
 * Architecture nodes and Reliability Spine stages are deliberately separate
 * models (per the V6 content matrix): a node comes from a project's own
 * `flow` string, a stage comes from the shared 8-stage spine vocabulary a
 * project's `spineStages` array opts into. A project's node count and stage
 * count are unrelated numbers that happen to both describe the same
 * project - nothing here assumes or asserts they are equal.
 */

export type ProjectSlug =
  | "project-aurora"
  | "distributed-jenkins-controller"
  | "secure-aws-production-architecture"
  | "nodejs-auth-mysql-rds";

export interface ArchitectureNode {
  /** Stable, URL/DOM-safe id derived from the node's position and label. */
  id: string;
  /** Verbatim label from the flow string - compound nodes ("Build (on
   * agent)", "App/MySQL") are preserved whole, never split on "/" or "(". */
  label: string;
  /** Position in the flow sequence, 0-indexed. */
  index: number;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
}

/** A verified sub-component of one primary node (e.g. Secure AWS's IAM,
 * VPC tiers, ALB, RDS decisions nested under its "Cloud" node) - derived
 * from `implementationDecisions`/`toolsAndServices`, not invented. */
export interface NestedComponent {
  parentNodeId: string;
  label: string;
}

export interface EvidenceItem {
  kind: "decision" | "tool" | "outcome" | "limitation" | "link";
  label: string;
  /** Only present for kind: "link", and only when the project's own
   * `links` field actually contains one - never a placeholder URL. */
  href?: string;
}

export type SceneKind =
  | "atlas"
  | "time-machine"
  | "rc01"
  | "operational-twin"
  | null;

export type VisitorPath = "recruiter" | "engineer" | "explorer" | null;

/** V7 addition. Reuses V6's existing high/balanced/fallback vocabulary
 * (master spec Section 11) rather than inventing new tier names. */
export type QualityTier = "high" | "balanced" | "fallback";

/** Detected once at mount via the existing WebGL-detection pattern
 * (useWebGLSupport's lazy useState initializer), not re-checked per
 * interaction - see Atlas's precedent for why this must be a one-time
 * check, not a reactive one. */
export type WebGLCapability = "unknown" | "supported" | "unsupported";

/** System Trace's "one stage, one project, or all stages" requirement
 * (spec Section 10.2) reuses selectedStageId/activeProject as its trace
 * state - no duplicate source of truth. This flag only distinguishes
 * "focus one stage" from "show the whole pipeline at once"; it does not
 * introduce a second place stage selection lives. */
export type TraceScope = "single" | "all";

/** Read-only from the app's point of view - mirrors `prefers-reduced-motion`
 * via the existing `useReducedMotion()` hook, not a second implementation. */
export type MotionPreference = "full" | "reduced";

/** User-controlled, mirrors the existing low-power toggle pattern
 * (`useCompanionPreferences`) - an honest switch, not a device benchmark. */
export type PowerPreference = "standard" | "low";

export type SpatialLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; reason: string };

export interface RC01Target {
  nodeId: string | null;
  stageId: SpineStageId | null;
}

export interface ExperienceState {
  activeRoute: string | null;
  activeProject: ProjectSlug | null;
  activeScene: SceneKind;
  selectedNodeId: string | null;
  selectedStageId: SpineStageId | null;
  rc01Target: RC01Target;
  visitorPath: VisitorPath;
  motion: MotionPreference;
  power: PowerPreference;
  spatialLoad: SpatialLoadState;
  /** V7 additions below. Detected/set once, not per-frame - see the
   * type-level comments on QualityTier/WebGLCapability. */
  qualityTier: QualityTier;
  webglCapability: WebGLCapability;
  traceScope: TraceScope;
}

export type ExperienceAction =
  | { type: "ROUTE_CHANGED"; route: string; allowedProject: ProjectSlug | null }
  | { type: "PROJECT_SELECTED"; slug: ProjectSlug }
  | { type: "PROJECT_CLEARED" }
  | { type: "SCENE_CHANGED"; scene: SceneKind }
  | { type: "NODE_SELECTED"; nodeId: string }
  | { type: "STAGE_SELECTED"; stageId: SpineStageId }
  | { type: "SELECTION_CLEARED" }
  | { type: "RC01_TARGET_SET"; target: RC01Target }
  | { type: "VISITOR_PATH_SET"; path: VisitorPath }
  | { type: "MOTION_PREFERENCE_SET"; value: MotionPreference }
  | { type: "POWER_PREFERENCE_SET"; value: PowerPreference }
  | { type: "SPATIAL_LOAD_STATE_SET"; state: SpatialLoadState }
  | { type: "SCENE_ERROR"; reason: string }
  | { type: "RESET" }
  | { type: "QUALITY_TIER_SET"; tier: QualityTier }
  | { type: "WEBGL_CAPABILITY_SET"; capability: WebGLCapability }
  | { type: "TRACE_SCOPE_SET"; scope: TraceScope };

export const initialExperienceState: ExperienceState = {
  activeRoute: null,
  activeProject: null,
  activeScene: null,
  selectedNodeId: null,
  selectedStageId: null,
  rc01Target: { nodeId: null, stageId: null },
  visitorPath: null,
  motion: "full",
  power: "standard",
  spatialLoad: { status: "idle" },
  qualityTier: "high",
  webglCapability: "unknown",
  traceScope: "single",
};

export type { ProjectCategory, SpineStageId };
