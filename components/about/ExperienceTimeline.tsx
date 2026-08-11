import type { ExperienceRole } from "@/content/types";
import { NeedsInput } from "@/components/shared/NeedsInput";

export function ExperienceTimeline({ roles }: { roles: ExperienceRole[] }) {
  return (
    <ol className="flex flex-col gap-10">
      {roles.map((role) => (
        <li key={`${role.org}-${role.dates}`} className="border-t border-[var(--line)] pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-display text-lg font-semibold text-[var(--ink)]">{role.role}</h3>
            <p className="font-mono text-xs text-[var(--ink-muted)]">{role.dates}</p>
          </div>
          <p className="mt-1 font-mono text-sm text-[var(--accent-secondary)]">
            {role.org}
            {role.location ? ` · ${role.location}` : ""}
          </p>

          {role.achievements.status === "ready" ? (
            <ul className="mt-4 flex flex-col gap-2">
              {role.achievements.value.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--ink-muted)]">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <NeedsInput note={role.achievements.note} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
