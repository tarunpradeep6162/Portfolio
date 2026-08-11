import { cn } from "@/lib/cn";

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]", className)}>
      {children}
    </p>
  );
}
