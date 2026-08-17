"use client";

import { useState, FormEvent } from "react";
import { Calendar, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";

export function ConsultationBooking() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    projectType: "",
    timeline: "",
    budget: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to book consultation");
      }

      const data = await response.json();
      setStatus("success");
      setMessage(
        "Consultation request received! I'll contact you within 24 hours."
      );
      setFormData({
        name: "",
        email: "",
        company: "",
        projectType: "",
        timeline: "",
        budget: "",
        message: "",
      });

      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to book consultation. Try again."
      );
    }
  };

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[var(--accent)]" />
          <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
            Schedule a Consultation
          </h3>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Let's discuss your infrastructure challenges and how I can help.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
              placeholder="Company name"
            />
          </div>

          <div>
            <label
              htmlFor="projectType"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Project Type
            </label>
            <select
              id="projectType"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            >
              <option value="">Select a type...</option>
              <option value="kubernetes">Kubernetes Migration</option>
              <option value="devops">DevOps & Automation</option>
              <option value="architecture">Infrastructure Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="timeline"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Timeline
            </label>
            <select
              id="timeline"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            >
              <option value="">Select timeline...</option>
              <option value="immediate">Immediate (1-2 weeks)</option>
              <option value="month">This month</option>
              <option value="quarter">This quarter</option>
              <option value="planning">Planning phase</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="budget"
              className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
            >
              Budget Range
            </label>
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            >
              <option value="">Select range...</option>
              <option value="10k-25k">$10k - $25k</option>
              <option value="25k-50k">$25k - $50k</option>
              <option value="50k-100k">$50k - $100k</option>
              <option value="100k+">$100k+</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-xs font-medium uppercase tracking-[0.1em] text-[var(--ink-muted)] mb-2"
          >
            Tell me about your project
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] transition-all duration-300 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30"
            placeholder="Describe your infrastructure challenges, goals, and current setup..."
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-[var(--accent)] py-3 px-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-control-black)] transition-all duration-300 hover:bg-[var(--accent)]/90 disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {status === "loading" ? "Booking..." : "Request Consultation"}
        </button>

        {status === "success" && (
          <div className="flex items-start gap-3 rounded-lg bg-[var(--accent)]/10 p-4">
            <CheckCircle size={18} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--accent)]">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-3 rounded-lg bg-[var(--signal-warm)]/10 p-4">
            <AlertCircle size={18} className="text-[var(--signal-warm)] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--signal-warm)]">{message}</p>
          </div>
        )}
      </form>

      <div className="mt-6 border-t border-[var(--line)] pt-6">
        <p className="text-xs text-[var(--ink-muted)] uppercase tracking-[0.1em] mb-3">
          What to expect
        </p>
        <ul className="space-y-2 text-sm text-[var(--ink-muted)]">
          <li className="flex gap-2">
            <Clock size={16} className="flex-shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>I'll respond within 24 hours</span>
          </li>
          <li className="flex gap-2">
            <Clock size={16} className="flex-shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>Initial consultation is free (30-60 min call)</span>
          </li>
          <li className="flex gap-2">
            <Clock size={16} className="flex-shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>We'll discuss scope and next steps</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
