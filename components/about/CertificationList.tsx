import type { Certification } from "@/content/types";

/** Ledger style, not bordered cards - certifications are a record, not
    tiles to compare against skill badges or project cards elsewhere on
    the site (spec: avoid one container language used for everything). */
export function CertificationList({ items }: { items: Certification[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((cert) => (
        <li
          key={cert.name}
          data-reveal
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--line)] py-3 last:border-b"
        >
          <p className="font-display text-sm font-semibold text-[var(--ink)]">{cert.name}</p>
          {/* No issuer link/credential ID supplied yet for some entries: the
              control is simply omitted rather than announced (CONTENT_GAPS.md tracks it). */}
          {cert.completed && (
            <p className="font-mono text-xs text-[var(--ink-muted)]">Completed {cert.completed}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
