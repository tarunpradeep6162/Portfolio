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
      className={cn("underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]", className)}
    >
      {children}
    </a>
  );
}
