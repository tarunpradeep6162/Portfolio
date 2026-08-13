import type { ExperienceRole } from "@/content/types";

export function ExperienceTimeline({ roles }: { roles: ExperienceRole[] }) {
  return (
    <ol className="border-t border-[var(--line)]">
      {roles.map((role, index) => (
        <li
          key={`${role.org}-${role.dates}`}
          data-reveal
          className="grid gap-4 border-b border-[var(--line)] py-7 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:py-8"
        >
          <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--accent-secondary)]">
            0{index + 1}
          </span>
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
              <h3 className="font-display text-xl font-semibold tracking-[-0.035em] text-[var(--ink)]">
                {role.role}
              </h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                {role.dates}
              </p>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent-secondary)]">
              {role.org}
              {role.location ? ` · ${role.location}` : ""}
            </p>

            {role.achievements.status === "ready" && (
              <ul className="mt-5 grid gap-3 lg:grid-cols-2">
                {role.achievements.value.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-6 text-[var(--ink-muted)]"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 h-1 w-1 shrink-0 bg-[var(--accent)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
