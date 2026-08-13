import type { Certification } from "@/content/types";

/** Ledger style, not bordered cards - certifications are a record, not
    tiles to compare against skill badges or project cards elsewhere on
    the site (spec: avoid one container language used for everything). */
export function CertificationList({ items }: { items: Certification[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((cert, index) => (
        <li
          key={cert.name}
          data-reveal
          className="grid grid-cols-[2rem_1fr] gap-3 border-t border-[var(--line)] py-4 last:border-b sm:grid-cols-[2.5rem_1fr_auto] sm:items-baseline"
        >
          <span className="font-mono text-[9px] text-[var(--accent-secondary)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="font-display text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {cert.name}
          </p>
          {/* No issuer link/credential ID supplied yet for some entries: the
              control is simply omitted rather than announced (CONTENT_GAPS.md tracks it). */}
          {cert.completed && (
            <p className="col-start-2 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] sm:col-start-auto">
              Completed {cert.completed}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
