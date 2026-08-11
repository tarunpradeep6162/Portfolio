import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonBaseProps = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 font-mono text-sm font-medium tracking-wide transition-[transform,background-color] duration-200 ease-[var(--ease-spine)] whitespace-nowrap active:translate-y-px";

const variants = {
  primary: "bg-[var(--accent)] text-[var(--color-control-black)] hover:brightness-110",
  secondary:
    "border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
};

export function Button({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonBaseProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
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
