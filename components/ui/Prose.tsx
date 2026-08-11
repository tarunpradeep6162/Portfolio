import { cn } from "@/lib/cn";

/** Body copy container held to spec §5's 60-72 character measure. */
export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("max-w-[68ch] text-[var(--ink-muted)] leading-relaxed", className)}>{children}</div>
  );
}
