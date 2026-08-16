import { cn } from "@/lib/cn";

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "underline decoration-[var(--line)] underline-offset-4 transition-all duration-300 hover:decoration-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[0_0_12px_rgba(216,255,79,0.2)]",
        className,
      )}
    >
      {children}
    </a>
  );
}
