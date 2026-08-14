import type { Incident } from "@/lib/v7/incidentModel";

/**
 * Real, documented incidents from this portfolio's own engineering - not
 * invented outages, not fabricated business impact. Every fact below is
 * transcribed from what actually happened during V6/V7 development,
 * verified by direct reproduction at the time (see git history and
 * docs/LIVING_INFRASTRUCTURE_V6_COMPLETION_REPORT.md /
 * docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md for the original record). No
 * MTTR, customer count, or uptime figure appears anywhere here because
 * none of those are real facts about a portfolio site's own build
 * process - inventing them to look more dramatic would violate the
 * honesty requirements this whole site is built to demonstrate.
 */
export const incidents: Incident[] = [
  {
    slug: "atlas-close-reopen-regression",
    title: "Closing Atlas's 3D view permanently disabled it",
    system: "Living Infrastructure Atlas (V6)",
    observedSymptom: {
      label: "Observed symptom",
      detail:
        "Frame-by-frame inspection of a recorded walkthrough video caught “3D view failed to load” appearing right after an ordinary close - not the working scene the beat was supposed to show.",
    },
    evidenceCollected: {
      label: "Evidence collected",
      detail:
        "A 10-iteration direct reproduction (open the 3D view, click a node, close it) - 10 out of 10 attempts failed the same way.",
    },
    rootCause: {
      label: "Root cause",
      detail:
        "Three.js's own WebGLRenderer.dispose(), called by React Three Fiber when the scene unmounts, intentionally force-loses the WebGL context as part of its own cleanup - firing the exact same webglcontextlost event a genuine GPU/driver failure would. The context-loss recovery listener couldn't tell a deliberate close apart from a real failure.",
    },
    correction: {
      label: "Correction",
      detail:
        "An activeRef, kept current via effect for the general case and set synchronously inside the Close button's own click handler for the one path proven to race the effect, checked before either error-handling path (the React error boundary and the raw DOM event listener) treats a context loss as real.",
    },
    verification: {
      label: "Verification",
      detail:
        "10 out of 10 clean reproductions after the fix, confirmed against a freshly-built, freshly-started server - an earlier round of “still failing” results during debugging turned out to be testing against a stale server process left over from a previous build, not the fix failing.",
    },
    preventionOrAutomation: {
      label: "Prevention / automation added",
      detail:
        "tests/e2e/atlas.spec.ts's one-canvas-rule tests cover this path in CI on every push. This session's own V7 production verification independently re-confirmed close-then-reopen against the real live deployment, not just the local fix.",
    },
    knownLimitation: {
      label: "Known limitation",
      detail:
        "None identified - fully resolved and covered by an automated regression test, not just fixed once.",
    },
  },
  {
    slug: "system-trace-suspense-boundary",
    title: "A lint-clean, typecheck-clean component that still broke the production build",
    system: "System Trace (V7, this session)",
    observedSymptom: {
      label: "Observed symptom",
      detail:
        "next build failed during static page generation for the homepage with “useSearchParams() should be wrapped in a suspense boundary,” immediately after System Trace (which reads the URL's ?stage= parameter) was first wired in.",
    },
    evidenceCollected: {
      label: "Evidence collected",
      detail:
        "tsc --noEmit and eslint were both run first and both passed cleanly - the build failure was only visible by actually running a full production build, which this session did specifically because a lint-clean component isn't proof a real build succeeds.",
    },
    rootCause: {
      label: "Root cause",
      detail:
        "Next.js's App Router requires any component using useSearchParams() to render inside a Suspense boundary, or it opts the whole page out of static rendering during the build - a build-time failure mode neither the type checker nor the linter checks for.",
    },
    correction: {
      label: "Correction",
      detail:
        "Restructured the component to wrap its own useSearchParams()-dependent logic in an internal Suspense boundary with a skeleton fallback, so every future caller gets this for free instead of needing to remember to wrap it themselves.",
    },
    verification: {
      label: "Verification",
      detail:
        "Re-ran next build; it completed cleanly with all 16 routes generated as static content.",
    },
    preventionOrAutomation: {
      label: "Prevention / automation added",
      detail:
        "The fix lives inside the shared component itself, not at each call site, so the same mistake can't recur simply by someone forgetting a wrapper elsewhere.",
    },
    knownLimitation: {
      label: "Known limitation",
      detail:
        "The Suspense fallback briefly renders non-interactive skeleton buttons before hydration completes - a genuine, intentional tradeoff to avoid layout shift, not hidden from this record.",
    },
  },
  {
    slug: "service-fork-line-crossover",
    title: "Correct math, broken picture: a topology layout that crossed its own line",
    system: "Project-world topology layout (V7, this session)",
    observedSymptom: {
      label: "Observed symptom",
      detail:
        "The Node.js Auth project's architecture-diagram connector lines, after adding a distinct “service-fork” layout for it, rendered as a peak followed by a line that appeared to jut backward and cross itself - not a coherent shape.",
    },
    evidenceCollected: {
      label: "Evidence collected",
      detail:
        "The underlying coordinate numbers and unit tests all passed. The problem was only visible by rendering the actual SVG and inspecting the screenshot directly - exactly the “actually look at the evidence, not just the exit code” discipline this site's own case studies describe.",
    },
    rootCause: {
      label: "Root cause",
      detail:
        "The layout compressed each node's horizontal position independently, by its own index, rather than cumulatively - which could place a node adjacent to the “fork” point at a smaller x-coordinate than the fork point itself, drawing its connector line backward across the shape.",
    },
    correction: {
      label: "Correction",
      detail:
        "Rewrote the horizontal spacing to accumulate strictly left to right, compressing only the gap immediately around the fork node rather than each node's absolute position independently.",
    },
    verification: {
      label: "Verification",
      detail:
        "Re-rendered and visually re-inspected the screenshot - a clean, legible V-shape with no crossover.",
    },
    preventionOrAutomation: {
      label: "Prevention / automation added",
      detail:
        "A unit test now asserts every node's x-coordinate is strictly greater than the previous node's, specifically to catch this exact mistake if it's ever reintroduced.",
    },
    knownLimitation: {
      label: "Known limitation",
      detail:
        "The topology shapes are deliberately simple two-dimensional layouts, not a general-purpose graph-layout algorithm - they cover the four real project flows that exist today, not an arbitrary future one.",
    },
  },
];
