import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonBaseProps = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[var(--ease-spine)] whitespace-nowrap active:translate-y-px relative";

const variants = {
  primary:
    "border border-[var(--accent)] bg-[var(--accent)] text-[var(--color-dark-navy)] hover:-translate-y-0.5 hover:bg-transparent hover:text-[var(--accent)] hover:shadow-[0_0_20px_rgba(216,255,79,0.3),inset_0_0_20px_rgba(216,255,79,0.1)]",
  secondary:
    "border border-[var(--line)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[0_0_16px_rgba(216,255,79,0.2)]",
};

export function Button({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonBaseProps & {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const classes = cn(base, variants[variant], className);

  if (isExternal) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
