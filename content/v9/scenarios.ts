import type { SpineStageId } from "../types";

/**
 * V9 Scenario Simulator content (docs/PORTFOLIO_V9_ARCHITECTURE.md /
 * docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md Phase 5) - the highest-risk
 * pillar identified in docs/PORTFOLIO_V9_DISCOVERY.md, so the rules here
 * are deliberate and load-bearing, not stylistic:
 *
 * 1. Every scenario is a labeled hypothetical teaching exercise, not a
 *    claim about real infrastructure - this file's own content is
 *    illustrative narrative, unlike every other content/*.ts file in
 *    this codebase, which transcribes real facts. The component that
 *    renders this data (components/simulator/ScenarioSimulator.tsx)
 *    is responsible for keeping "Simulation" visibly labeled in the UI
 *    itself, not just here in a comment.
 * 2. No invented metric with false precision (no "latency: 340ms",
 *    no "94% CPU") - only qualitative/structural description, so
 *    nothing here could be mistaken for a real measurement.
 * 3. Every `skillLabel` below must be a real, verbatim string from
 *    content/skills.ts, and every `relatedProjectSlug` a real flagship
 *    project slug from content/projects.ts - enforced by
 *    tests/unit/scenarios.test.ts, not just by convention.
 * 4. The "recommended" choice in each scenario reflects a real,
 *    ordinary cloud-engineering practice - not a dramatized "hero save."
 */
export type ScenarioCategory =
  | "traffic-spike"
  | "deployment-failure"
  | "compromised-credentials"
  | "database-latency"
  | "recovery-decision";

export interface ScenarioChoice {
  id: string;
  label: string;
  recommended: boolean;
  outcome: string;
  skillLabel: string;
  relatedProjectSlug: string;
}

export interface Scenario {
  slug: string;
  category: ScenarioCategory;
  title: string;
  spineStageId: SpineStageId;
  setup: string;
  choices: ScenarioChoice[];
}

export const scenarios: Scenario[] = [
  {
    slug: "traffic-spike",
    category: "traffic-spike",
    title: "Traffic spike",
    spineStageId: "network",
    setup:
      "Request volume to a web application climbs well beyond its normal range over a short window, and response times start to degrade for new visitors.",
    choices: [
      {
        id: "manual-instances",
        label: "Manually launch more EC2 instances and hope it's enough",
        recommended: false,
        outcome:
          "Buys time once, but doesn't scale down afterward and depends on someone noticing and acting fast enough next time.",
        skillLabel: "AWS EC2",
        relatedProjectSlug: "project-aurora",
      },
      {
        id: "auto-scaling",
        label: "Let a load balancer and auto scaling group absorb the spike automatically",
        recommended: true,
        outcome:
          "The documented, repeatable approach: capacity grows and shrinks with real demand instead of a manual response.",
        skillLabel: "AWS Auto Scaling",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
      {
        id: "do-nothing",
        label: "Do nothing and wait for traffic to subside on its own",
        recommended: false,
        outcome: "Visitors keep experiencing degraded response times for the duration of the spike.",
        skillLabel: "Monitoring and logging",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
    ],
  },
  {
    slug: "deployment-failure",
    category: "deployment-failure",
    title: "Deployment failure",
    spineStageId: "build",
    setup:
      "A build that passed every automated check on a feature branch fails once it reaches the environment where it actually gets deployed.",
    choices: [
      {
        id: "push-again",
        label: "Re-run the same deployment and hope it passes the second time",
        recommended: false,
        outcome: "Sometimes appears to work, but leaves the actual cause undiagnosed for next time.",
        skillLabel: "CI/CD pipeline design",
        relatedProjectSlug: "distributed-jenkins-controller",
      },
      {
        id: "isolate-agent",
        label: "Separate build orchestration from the build agent to isolate where the failure is happening",
        recommended: true,
        outcome:
          "Splitting controller and agent responsibilities makes it possible to tell a controller-side problem apart from an agent/environment-side one.",
        skillLabel: "Jenkins",
        relatedProjectSlug: "distributed-jenkins-controller",
      },
      {
        id: "skip-checks",
        label: "Disable the failing check so the deployment goes through",
        recommended: false,
        outcome: "Removes the signal instead of investigating what it was actually catching.",
        skillLabel: "CI/CD pipeline design",
        relatedProjectSlug: "distributed-jenkins-controller",
      },
    ],
  },
  {
    slug: "compromised-credentials",
    category: "compromised-credentials",
    title: "Compromised credentials",
    spineStageId: "network",
    setup:
      "An access key with more privilege than a workload actually needs is discovered exposed in a place it shouldn't be.",
    choices: [
      {
        id: "rotate-only",
        label: "Rotate the key and consider it resolved",
        recommended: false,
        outcome: "Removes the immediate exposure but leaves the underlying over-broad permission in place.",
        skillLabel: "AWS IAM",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
      {
        id: "least-privilege",
        label: "Rotate the key and re-scope the role to least privilege before reissuing access",
        recommended: true,
        outcome:
          "Addresses both the immediate exposure and the reason its blast radius was larger than it needed to be.",
        skillLabel: "Security policy documentation",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
      {
        id: "ignore",
        label: "Leave it as-is since nothing has gone wrong yet",
        recommended: false,
        outcome: "The exposure and the over-broad permission both remain in place.",
        skillLabel: "AWS IAM",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
    ],
  },
  {
    slug: "database-latency",
    category: "database-latency",
    title: "Database latency",
    spineStageId: "observe",
    setup: "An application that reads and writes to a managed relational database starts responding noticeably slower under normal load.",
    choices: [
      {
        id: "restart-blind",
        label: "Restart the application server without checking the database first",
        recommended: false,
        outcome: "May briefly mask the symptom, but doesn't confirm whether the database was the actual source.",
        skillLabel: "Monitoring and logging",
        relatedProjectSlug: "nodejs-auth-mysql-rds",
      },
      {
        id: "check-metrics-first",
        label: "Check the managed database's own connection and query metrics before changing anything",
        recommended: true,
        outcome: "Confirms whether the database itself is the bottleneck before acting on the application layer.",
        skillLabel: "AWS RDS",
        relatedProjectSlug: "nodejs-auth-mysql-rds",
      },
      {
        id: "add-cache-blind",
        label: "Add a cache layer immediately, without diagnosing the cause",
        recommended: false,
        outcome: "Adds complexity and a new thing to maintain, without confirming it addresses the actual cause.",
        skillLabel: "MySQL and MSSQL",
        relatedProjectSlug: "nodejs-auth-mysql-rds",
      },
    ],
  },
  {
    slug: "recovery-decision",
    category: "recovery-decision",
    title: "Recovery decision",
    spineStageId: "recover",
    setup:
      "A deployed change is confirmed to be the cause of a regression already visible to real visitors.",
    choices: [
      {
        id: "forward-fix",
        label: "Write and ship a fix for the regression directly, under time pressure",
        recommended: false,
        outcome: "Can work, but risks introducing a second, rushed mistake on top of the first.",
        skillLabel: "Incident troubleshooting",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
      {
        id: "rollback-first",
        label: "Roll back to the last known-good deployment first, then investigate the cause separately",
        recommended: true,
        outcome:
          "Restores a working state immediately and removes the time pressure from the investigation that follows - this is the documented pattern this candidate's own incident record follows (see Incident Replay).",
        skillLabel: "Backup and recovery workflows",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
      {
        id: "wait",
        label: "Leave the regression live while deciding what to do",
        recommended: false,
        outcome: "Real visitors keep experiencing the regression for the duration of the delay.",
        skillLabel: "Incident troubleshooting",
        relatedProjectSlug: "secure-aws-production-architecture",
      },
    ],
  },
];
