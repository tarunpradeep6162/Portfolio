import { cn } from "@/lib/cn";

export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]",
        className,
      )}
    >
      <span aria-hidden className="h-px w-8 bg-current" />
      <span>{children}</span>
    </p>
  );
}
