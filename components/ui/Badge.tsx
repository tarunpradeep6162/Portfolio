import { cn } from "@/lib/cn";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-[var(--line)] px-2.5 py-1 font-mono text-xs text-[var(--ink-muted)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
