import type { Certification } from "@/content/types";

export function CertificationList({ items }: { items: Certification[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((cert) => (
        <li key={cert.name} data-reveal className="rounded-sm border border-[var(--line)] p-4">
          <p className="font-display text-sm font-semibold text-[var(--ink)]">{cert.name}</p>
          {cert.completed && <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">Completed {cert.completed}</p>}
          {/* No issuer link/credential ID supplied yet for some entries: the
              control is simply omitted rather than announced (CONTENT_GAPS.md tracks it). */}
        </li>
      ))}
    </ul>
  );
}
