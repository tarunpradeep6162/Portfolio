import type { SpineStageId } from "@/content/types";
import { homeSections, resolveInternalHref, type HomeSection } from "./routes";

/**
 * Everything RC-01 is allowed to *do* on the page, as a closed discriminated
 * union. The model proposes actions through tool calls; both the server
 * (before forwarding) and the client (before executing) run the same
 * validator, so a malformed or out-of-policy action is dropped rather than
 * trusted - the model never gets to execute arbitrary navigation or DOM work.
 */
export const spineStageIds = [
  "commit",
  "build",
  "test",
  "container",
  "network",
  "cloud",
  "observe",
  "recover",
] as const satisfies readonly SpineStageId[];

export const gestures = ["wave", "nod", "point", "shrug", "celebrate"] as const;
export type Gesture = (typeof gestures)[number];

export const audiences = ["recruiter", "engineer", "explorer"] as const;
export type Audience = (typeof audiences)[number];

export type Rc01Action =
  | { type: "navigate"; path: string }
  | { type: "scroll_to_section"; section: HomeSection }
  | { type: "highlight_spine_stage"; stage: SpineStageId | "all" }
  | { type: "gesture"; gesture: Gesture }
  | { type: "set_audience"; audience: Audience }
  | { type: "copy_email" };

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

/**
 * Validates a (tool name, input) pair from the model, or a serialized action
 * received over the wire, into a trusted Rc01Action - or null.
 */
export function parseAction(type: unknown, input: unknown): Rc01Action | null {
  const data = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;
  switch (type) {
    case "navigate": {
      if (typeof data.path !== "string") return null;
      const href = resolveInternalHref(data.path);
      return href ? { type: "navigate", path: href } : null;
    }
    case "scroll_to_section":
      return isOneOf(homeSections, data.section)
        ? { type: "scroll_to_section", section: data.section }
        : null;
    case "highlight_spine_stage":
      return data.stage === "all" || isOneOf(spineStageIds, data.stage)
        ? { type: "highlight_spine_stage", stage: data.stage as SpineStageId | "all" }
        : null;
    case "gesture":
      return isOneOf(gestures, data.gesture) ? { type: "gesture", gesture: data.gesture } : null;
    case "set_audience":
      return isOneOf(audiences, data.audience)
        ? { type: "set_audience", audience: data.audience }
        : null;
    case "copy_email":
      return { type: "copy_email" };
    default:
      return null;
  }
}

/** Short, visitor-facing description of an action, shown in the chat log. */
export function describeAction(action: Rc01Action): string {
  switch (action.type) {
    case "navigate":
      return `Opening ${action.path}`;
    case "scroll_to_section":
      return `Scrolling to ${action.section}`;
    case "highlight_spine_stage":
      return action.stage === "all"
        ? "Highlighting the Reliability Spine"
        : `Highlighting the ${action.stage} stage`;
    case "gesture":
      return "";
    case "set_audience":
      return `Tailoring answers for a ${action.audience}`;
    case "copy_email":
      return "Copied Tarun's email to your clipboard";
  }
}
