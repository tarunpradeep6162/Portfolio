import { describe, it, expect } from "vitest";
import { experienceReducer } from "@/lib/v6/experienceReducer";
import { initialExperienceState } from "@/lib/v6/types";
import type { ExperienceState } from "@/lib/v6/types";

describe("experienceReducer: state transitions", () => {
  it("SCENE_CHANGED updates only activeScene", () => {
    const next = experienceReducer(initialExperienceState, {
      type: "SCENE_CHANGED",
      scene: "atlas",
    });
    expect(next.activeScene).toBe("atlas");
    expect(next.activeProject).toBeNull();
  });

  it("VISITOR_PATH_SET updates only visitorPath", () => {
    const next = experienceReducer(initialExperienceState, {
      type: "VISITOR_PATH_SET",
      path: "engineer",
    });
    expect(next.visitorPath).toBe("engineer");
  });

  it("RESET returns exactly the initial state", () => {
    const modified: ExperienceState = { ...initialExperienceState, visitorPath: "explorer" };
    const next = experienceReducer(modified, { type: "RESET" });
    expect(next).toEqual(initialExperienceState);
  });
});

describe("experienceReducer: project changes", () => {
  it("PROJECT_SELECTED sets activeProject and clears any prior node/stage selection", () => {
    const withSelection: ExperienceState = {
      ...initialExperienceState,
      activeProject: "project-aurora",
      selectedNodeId: "0-git",
      selectedStageId: "commit",
    };
    const next = experienceReducer(withSelection, {
      type: "PROJECT_SELECTED",
      slug: "distributed-jenkins-controller",
    });
    expect(next.activeProject).toBe("distributed-jenkins-controller");
    expect(next.selectedNodeId).toBeNull();
    expect(next.selectedStageId).toBeNull();
    expect(next.rc01Target).toEqual({ nodeId: null, stageId: null });
  });

  it("PROJECT_SELECTED with the same slug is a no-op that preserves selection", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeProject: "project-aurora",
      selectedNodeId: "0-git",
    };
    const next = experienceReducer(state, { type: "PROJECT_SELECTED", slug: "project-aurora" });
    expect(next).toBe(state);
  });

  it("PROJECT_CLEARED resets project, scene, and selection together", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeProject: "project-aurora",
      activeScene: "atlas",
      selectedNodeId: "0-git",
      spatialLoad: { status: "ready" },
    };
    const next = experienceReducer(state, { type: "PROJECT_CLEARED" });
    expect(next.activeProject).toBeNull();
    expect(next.activeScene).toBeNull();
    expect(next.selectedNodeId).toBeNull();
    expect(next.spatialLoad).toEqual({ status: "idle" });
  });
});

describe("experienceReducer: scene changes and selection", () => {
  it("NODE_SELECTED and STAGE_SELECTED are independent", () => {
    let state = experienceReducer(initialExperienceState, {
      type: "NODE_SELECTED",
      nodeId: "0-git",
    });
    expect(state.selectedNodeId).toBe("0-git");
    expect(state.selectedStageId).toBeNull();

    state = experienceReducer(state, { type: "STAGE_SELECTED", stageId: "commit" });
    expect(state.selectedNodeId).toBe("0-git");
    expect(state.selectedStageId).toBe("commit");
  });

  it("SELECTION_CLEARED clears node, stage, and RC-01 target together", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      selectedNodeId: "0-git",
      selectedStageId: "commit",
      rc01Target: { nodeId: "0-git", stageId: "commit" },
    };
    const next = experienceReducer(state, { type: "SELECTION_CLEARED" });
    expect(next.selectedNodeId).toBeNull();
    expect(next.selectedStageId).toBeNull();
    expect(next.rc01Target).toEqual({ nodeId: null, stageId: null });
  });
});

describe("experienceReducer: stale-state cleanup on route change", () => {
  it("navigating to a route with a different (or no) matching project clears every project-scoped field", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeRoute: "/work/project-aurora",
      activeProject: "project-aurora",
      activeScene: "time-machine",
      selectedNodeId: "0-git",
      selectedStageId: "commit",
      rc01Target: { nodeId: "0-git", stageId: "commit" },
      spatialLoad: { status: "ready" },
    };
    const next = experienceReducer(state, {
      type: "ROUTE_CHANGED",
      route: "/about",
      allowedProject: null,
    });
    expect(next.activeRoute).toBe("/about");
    expect(next.activeProject).toBeNull();
    expect(next.activeScene).toBeNull();
    expect(next.selectedNodeId).toBeNull();
    expect(next.selectedStageId).toBeNull();
    expect(next.rc01Target).toEqual({ nodeId: null, stageId: null });
    expect(next.spatialLoad).toEqual({ status: "idle" });
  });

  it("navigating between two different project routes clears the previous project's scoped state", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeRoute: "/work/project-aurora",
      activeProject: "project-aurora",
      selectedNodeId: "0-git",
    };
    const next = experienceReducer(state, {
      type: "ROUTE_CHANGED",
      route: "/work/distributed-jenkins-controller",
      allowedProject: "distributed-jenkins-controller",
    });
    expect(next.activeProject).toBe("distributed-jenkins-controller");
    expect(next.selectedNodeId).toBeNull();
  });

  it("staying on the same project's route preserves scoped state (e.g. a sub-navigation within one world)", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeRoute: "/work/project-aurora",
      activeProject: "project-aurora",
      selectedNodeId: "0-git",
    };
    const next = experienceReducer(state, {
      type: "ROUTE_CHANGED",
      route: "/work/project-aurora",
      allowedProject: "project-aurora",
    });
    expect(next.selectedNodeId).toBe("0-git");
  });
});

describe("experienceReducer: error recovery", () => {
  it("SCENE_ERROR clears the active scene and selection but preserves route/project/visitorPath", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeRoute: "/work/project-aurora",
      activeProject: "project-aurora",
      activeScene: "atlas",
      selectedNodeId: "0-git",
      visitorPath: "engineer",
      spatialLoad: { status: "loading" },
    };
    const next = experienceReducer(state, {
      type: "SCENE_ERROR",
      reason: "WebGL context lost",
    });
    expect(next.activeScene).toBeNull();
    expect(next.selectedNodeId).toBeNull();
    expect(next.spatialLoad).toEqual({ status: "error", reason: "WebGL context lost" });
    // Preserved - an error should not evict the visitor from their project.
    expect(next.activeRoute).toBe("/work/project-aurora");
    expect(next.activeProject).toBe("project-aurora");
    expect(next.visitorPath).toBe("engineer");
  });
});

describe("experienceReducer: reduced-motion and low-power force spatial state back to idle", () => {
  it("switching motion to 'reduced' while a scene is active/loaded clears the scene and resets spatial load", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeScene: "atlas",
      spatialLoad: { status: "ready" },
    };
    const next = experienceReducer(state, { type: "MOTION_PREFERENCE_SET", value: "reduced" });
    expect(next.motion).toBe("reduced");
    expect(next.activeScene).toBeNull();
    expect(next.spatialLoad).toEqual({ status: "idle" });
  });

  it("switching power to 'low' while a scene is active/loaded clears the scene and resets spatial load", () => {
    const state: ExperienceState = {
      ...initialExperienceState,
      activeScene: "rc01",
      spatialLoad: { status: "loading" },
    };
    const next = experienceReducer(state, { type: "POWER_PREFERENCE_SET", value: "low" });
    expect(next.power).toBe("low");
    expect(next.activeScene).toBeNull();
    expect(next.spatialLoad).toEqual({ status: "idle" });
  });

  it("setting motion/power preferences while idle does not touch unrelated state", () => {
    const next = experienceReducer(initialExperienceState, {
      type: "MOTION_PREFERENCE_SET",
      value: "reduced",
    });
    expect(next.motion).toBe("reduced");
    expect(next.activeScene).toBeNull();
    expect(next.spatialLoad).toEqual({ status: "idle" });
  });
});
