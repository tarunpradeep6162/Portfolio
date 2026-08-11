import type { Certification } from "@/content/types";

export function CertificationList({ items }: { items: Certification[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((cert) => (
        <li key={cert.name} className="rounded-sm border border-[var(--line)] p-4">
          <p className="font-display text-sm font-semibold text-[var(--ink)]">{cert.name}</p>
          {cert.completed && <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">Completed {cert.completed}</p>}
          {cert.issuerLink.status === "needs-input" && cert.credentialId.status === "needs-input" && (
            <p className="mt-2 font-mono text-[11px] text-[var(--accent-secondary)]">Needs input — issuer link / credential ID</p>
          )}
        </li>
      ))}
    </ul>
  );
}
