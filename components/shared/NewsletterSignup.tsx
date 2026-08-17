"use client";

import { useState, FormEvent } from "react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe");
      }

      const data = await response.json();
      setStatus("success");
      setMessage(data.message || "Check your email to confirm subscription!");
      setEmail("");

      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to subscribe. Try again later."
      );
    }
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-8">
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
          Join the newsletter
        </h3>
        <p className="text-sm text-[var(--ink-muted)]">
          Get insights on web development, design systems, and building better
          digital products. One email per month.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="relative flex items-center">
          <Mail size={18} className="absolute left-3 text-[var(--ink-muted)]" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="w-full rounded-lg bg-[var(--accent)] py-3 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-control-black)] transition-all duration-300 hover:bg-[var(--accent)]/90 disabled:opacity-60 active:scale-95"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>

        {status === "success" && (
          <div className="flex items-start gap-3 rounded-lg bg-[var(--accent)]/10 p-3">
            <CheckCircle size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--accent)]">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 rounded-lg bg-[var(--signal-warm)]/10 p-3">
            <AlertCircle size={18} className="text-[var(--signal-warm)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--signal-warm)]">{message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
