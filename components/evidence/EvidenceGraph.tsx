import { CheckCircle2, CircleDashed } from "lucide-react";
import { buildEvidenceGraph, type EvidenceNode } from "@/lib/v9/evidenceGraph";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * The V9 Evidence Graph (docs/PORTFOLIO_V9_ARCHITECTURE.md /
 * docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md Phase 4): project -> repository
 * -> screenshot -> Reliability Spine stages, for each of the 4 flagship
 * projects. Server component - buildEvidenceGraph() reads content/*.ts
 * directly, no client state needed since every visitor sees the same
 * real evidence.
 *
 * SVG/HTML, not a 3D scene, per Direction A's rejection: this establishes
 * the verified/needs-input visual convention Phase 5's Scenario Simulator
 * reuses for its own "simulated" label. A needs-input node is never
 * hidden - CircleDashed + muted text renders it exactly as absent-but-
 * acknowledged, matching this codebase's Field<T> convention everywhere
 * else (résumé, certifications, lab repo links).
 */
export function EvidenceGraph() {
  const chains = buildEvidenceGraph();

  return (
    <section
      id="evidence-graph"
      aria-label="Evidence graph"
      data-field="manual"
      className="border-t border-[var(--line)] bg-[var(--surface)] py-20 text-[var(--ink)] sm:py-28"
    >
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Evidence graph</Eyebrow>
          <h2 className="mt-5 max-w-[16ch] font-display text-heading font-semibold tracking-[-0.04em]">
            Every project, traced to its real evidence.
          </h2>
          <p className="mt-4 max-w-[60ch] text-sm leading-6 text-[var(--ink-muted)]">
            Repository and screenshot links, and the Reliability Spine stages
            each project actually demonstrates. A dashed marker means that
            evidence is still missing - never a placeholder link.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {chains.map((chain) => (
            <li
              key={chain.projectSlug}
              className="border border-[var(--line)] p-6"
            >
              <p className="font-display text-base font-semibold leading-snug">{chain.projectTitle}</p>

              <ul className="mt-4 flex flex-col gap-2">
                {chain.nodes.map((node) => (
                  <EvidenceNodeRow key={node.id} node={node} />
                ))}
              </ul>

              {chain.spineStageLabels.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-4">
                  {chain.spineStageLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded border border-[var(--line)] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ink-muted)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function EvidenceNodeRow({ node }: { node: EvidenceNode }) {
  const verified = node.status === "verified";
  return (
    <li className="flex items-start gap-2">
      {verified ? (
        <CheckCircle2 size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--accent)]" />
      ) : (
        <CircleDashed size={14} aria-hidden className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
      )}
      <span className="text-sm leading-6">
        <span className={verified ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}>{node.label}</span>
        {verified && node.href ? (
          <>
            {" - "}
            <ExternalLink href={node.href} className="text-[var(--accent-secondary)]">
              view
            </ExternalLink>
          </>
        ) : (
          <span className="text-[var(--ink-muted)]"> - {node.detail}</span>
        )}
      </span>
    </li>
  );
}
