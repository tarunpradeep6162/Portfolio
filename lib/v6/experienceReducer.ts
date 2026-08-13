import type { ExperienceAction, ExperienceState } from "./types";
import { initialExperienceState } from "./types";

/**
 * Discrete, high-level UI state only (which project/scene/node is active) -
 * NOT per-frame animation state. Anything running inside a Canvas's
 * useFrame loop continues to use refs + damping (RC-01's existing,
 * unchanged pattern in RC01Model.tsx) - dispatching an action every frame
 * would defeat the point of a reducer and reintroduce the exact
 * setState-in-useFrame problem this architecture is meant to avoid.
 */
export function experienceReducer(
  state: ExperienceState,
  action: ExperienceAction,
): ExperienceState {
  switch (action.type) {
    case "ROUTE_CHANGED": {
      // Route cleanup: leaving a project's route (or landing on a route
      // with no matching project) clears every piece of state scoped to
      // the previous project, so nothing stale survives a navigation -
      // this is what "no stale scoped state" and "route cleanup" mean
      // concretely, not just a comment.
      if (action.allowedProject === state.activeProject) {
        return { ...state, activeRoute: action.route };
      }
      return {
        ...state,
        activeRoute: action.route,
        activeProject: action.allowedProject,
        activeScene: null,
        selectedNodeId: null,
        selectedStageId: null,
        rc01Target: { nodeId: null, stageId: null },
        spatialLoad: { status: "idle" },
      };
    }

    case "PROJECT_SELECTED": {
      if (action.slug === state.activeProject) return state;
      // Switching projects clears node/stage selection - scoped highlights
      // must not leak from one project's graph into another's.
      return {
        ...state,
        activeProject: action.slug,
        selectedNodeId: null,
        selectedStageId: null,
        rc01Target: { nodeId: null, stageId: null },
      };
    }

    case "PROJECT_CLEARED":
      return {
        ...state,
        activeProject: null,
        activeScene: null,
        selectedNodeId: null,
        selectedStageId: null,
        rc01Target: { nodeId: null, stageId: null },
        spatialLoad: { status: "idle" },
      };

    case "SCENE_CHANGED":
      return { ...state, activeScene: action.scene };

    case "NODE_SELECTED":
      return { ...state, selectedNodeId: action.nodeId };

    case "STAGE_SELECTED":
      return { ...state, selectedStageId: action.stageId };

    case "SELECTION_CLEARED":
      return {
        ...state,
        selectedNodeId: null,
        selectedStageId: null,
        rc01Target: { nodeId: null, stageId: null },
      };

    case "RC01_TARGET_SET":
      return { ...state, rc01Target: action.target };

    case "VISITOR_PATH_SET":
      return { ...state, visitorPath: action.path };

    case "MOTION_PREFERENCE_SET":
      // Reduced motion forces spatial state back to idle - no 3D canvas
      // should be mid-load or ready when motion drops to "reduced".
      if (action.value === "reduced" && state.spatialLoad.status !== "idle") {
        return {
          ...state,
          motion: action.value,
          activeScene: null,
          spatialLoad: { status: "idle" },
        };
      }
      return { ...state, motion: action.value };

    case "POWER_PREFERENCE_SET":
      if (action.value === "low" && state.spatialLoad.status !== "idle") {
        return {
          ...state,
          power: action.value,
          activeScene: null,
          spatialLoad: { status: "idle" },
        };
      }
      return { ...state, power: action.value };

    case "SPATIAL_LOAD_STATE_SET":
      return { ...state, spatialLoad: action.state };

    case "SCENE_ERROR":
      // Error recovery: an error clears the active scene and node/stage
      // selection (whatever was mid-load is now unknown-state) but
      // deliberately preserves route/project/visitorPath - a scene error
      // should not evict the visitor from the project they were exploring.
      return {
        ...state,
        activeScene: null,
        selectedNodeId: null,
        selectedStageId: null,
        rc01Target: { nodeId: null, stageId: null },
        spatialLoad: { status: "error", reason: action.reason },
      };

    case "RESET":
      return initialExperienceState;

    default:
      return state;
  }
}
