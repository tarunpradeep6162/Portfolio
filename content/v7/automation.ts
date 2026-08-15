export type AutomationEvidenceStatus = "verified" | "pending";

export interface AutomationEvidence {
  status: AutomationEvidenceStatus;
  /** For "verified": what was actually confirmed and when/where. For
   * "pending": honestly says this hasn't run for V7 yet - never a
   * fabricated pass. */
  detail: string;
  url?: string;
}

export interface AutomationStage {
  slug: string;
  stage: string;
  tool: string;
  description: string;
  evidence: AutomationEvidence;
}

/**
 * The real pipeline documented in docs/AUTOMATED_CI_CD.md, transcribed
 * from that file - not a second description invented for this component.
 * "Verified" evidence below is V6's actual historical results (real
 * workflow run URLs from this repository, confirmed during V6 closure);
 * V7-specific stages are honestly "pending" until this session's own
 * final validation pass actually runs them - spec Section 10.6: "Never
 * display a tool as successfully executed unless there is real evidence
 * for that version."
 */
export const automationStages: AutomationStage[] = [
  {
    slug: "change",
    stage: "Change",
    tool: "Git",
    description: "A commit pushed to a feature/version branch - the trigger for everything downstream.",
    evidence: {
      status: "verified",
      detail: "This branch (operational-twin-v7) has real, pushed commits with a clean working tree at every point.",
    },
  },
  {
    slug: "fast-ci",
    stage: "Fast CI",
    tool: "GitHub Actions",
    description: "Lint, typecheck, unit tests, conditional build, git diff --check on every push/PR - no e2e, no deploy.",
    evidence: {
      status: "pending",
      detail: "Confirmed locally on this branch (tsc/eslint/vitest all clean at every commit); the hosted GitHub Actions run for V7-specific code has not been dispatched yet.",
    },
  },
  {
    slug: "build",
    stage: "Build",
    tool: "Next.js / Turbopack",
    description: "Production build, output: \"standalone\" - the same artifact Docker packages and Vercel deploys.",
    evidence: {
      status: "verified",
      detail: "next build run directly against this branch's code multiple times this session, most recently confirming all 16 routes generate as static content with the Incident Replay/Automation Fabric additions included.",
    },
  },
  {
    slug: "test",
    stage: "Test",
    tool: "Vitest + Playwright",
    description: "Unit suite plus a targeted, and eventually complete, end-to-end suite.",
    evidence: {
      status: "pending",
      detail: "Unit suite: 85/85 passing on this branch. The complete hosted Playwright suite - the bar for calling V7 done - has not run yet; reserved for the single final validation pass per this session's own testing-frequency policy.",
    },
  },
  {
    slug: "security",
    stage: "Security",
    tool: "Trivy",
    description: "Filesystem/secret/misconfiguration scan (nightly) and a full image scan (release).",
    evidence: {
      status: "pending",
      detail: "V6's final release candidate passed a real Trivy image scan after removing an unused base-image npm install that was flagging real CVEs - documented in V6's own completion report. Not yet re-run against V7's image, since no V7 Docker image has been built yet.",
    },
  },
  {
    slug: "preview",
    stage: "Preview",
    tool: "Vercel",
    description: "Automatic preview deployment on push, validated by a GitHub Actions workflow once it's live.",
    evidence: {
      status: "pending",
      detail: "V6's production deployment is live and independently verified (routes, headers, canvas-before-intent, Atlas/RC-01 behaviour, all confirmed against the real public URL). V7 has not been deployed to any preview yet.",
    },
  },
  {
    slug: "release-candidate",
    stage: "Release candidate",
    tool: "GitHub Actions + Docker",
    description: "A manually dispatched, non-production candidate run: full suite, real Docker image, Trivy image scan, candidate-container health/route/header checks.",
    evidence: {
      status: "verified",
      detail: "V6's release-candidate workflow_dispatch mode passed completely on the final validated commit - every job green, evidence artifacts generated, promotion correctly gated behind an explicit flag that was never enabled during candidate runs.",
      url: "https://github.com/tarunpradeep6162/Portfolio/actions/runs/31721550307",
    },
  },
  {
    slug: "production-verification",
    stage: "Production verification",
    tool: "Playwright + manual scripts",
    description: "Post-deploy smoke test against the real public URL - routes, headers, core interactions, no fabricated pass.",
    evidence: {
      status: "verified",
      detail: "V6's production deployment was checked directly against the live public URL this session: 13/13 routes, all security headers, canvas-before-intent, Atlas activate/close/reopen, RC-01, one-canvas invariant, reduced motion, and mobile overflow all confirmed - not assumed from the release-candidate pass alone.",
      url: "https://portfolio-tarun-dun.vercel.app",
    },
  },
  {
    slug: "rollback-readiness",
    stage: "Rollback readiness",
    tool: "Git tags",
    description: "Every prior version's final tag remains an untouched, immediate rollback target.",
    evidence: {
      status: "verified",
      detail: "living-infrastructure-v6-final (and every prior version's tag back to jury-refinement-v5.1-final) remains exactly as it was validated - confirmed untouched throughout this entire V7 session.",
    },
  },
];
