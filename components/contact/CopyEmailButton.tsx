"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) - the mailto CTA next to
      // this button still works, so this failure is silent by design.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex min-h-12 max-w-full items-center gap-2 border px-4 font-mono text-[10px] uppercase tracking-[0.08em] transition-all duration-300",
          copied
            ? "border-[var(--accent)] text-[var(--accent)] shadow-[0_0_16px_rgba(216,255,79,0.3)]"
            : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-[0_0_12px_rgba(216,255,79,0.2)]",
        )}
      >
        {copied ? (
          <Check size={16} aria-hidden />
        ) : (
          <Copy size={16} aria-hidden />
        )}
        {email}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </div>
  );
}
