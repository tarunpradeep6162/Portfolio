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
        "underline decoration-[var(--line)] underline-offset-4 transition-[color,text-shadow,text-decoration-color] hover:decoration-[var(--accent)] hover:text-[var(--accent)] hover:drop-shadow-[0_0_8px_rgba(216,255,79,0.3)]",
        className,
      )}
    >
      {children}
    </a>
  );
}
