import type { SpineStage } from "./types";

/**
 * The Reliability Spine (spec §4): real information architecture, not a
 * decorative timeline. Each stage is a genuine delivery step and maps to
 * the projects that demonstrate it (see the `spineStages` field on flagship
 * projects in projects.ts).
 */
export const spineStages: SpineStage[] = [
  {
    id: "commit",
    label: "Commit",
    description: "Version control, branching, and review before anything ships.",
  },
  {
    id: "build",
    label: "Build",
    description: "Compiling and packaging an application into a deployable artifact.",
  },
  {
    id: "test",
    label: "Test",
    description: "Verifying behaviour and scanning images before they reach production.",
  },
  {
    id: "container",
    label: "Container",
    description: "Multi-stage Docker builds, image layering, and service composition.",
  },
  {
    id: "network",
    label: "Network",
    description: "VPC tiers, security groups, load balancing, and controlled routing.",
  },
  {
    id: "cloud",
    label: "Cloud",
    description: "Compute, storage, and managed services running the workload.",
  },
  {
    id: "observe",
    label: "Observe",
    description: "Metrics, logs, and alarms that surface what the system is actually doing.",
  },
  {
    id: "recover",
    label: "Recover",
    description: "Backups, restore strategy, and the plan for when something breaks.",
  },
];
