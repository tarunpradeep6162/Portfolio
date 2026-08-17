"use client";

import { Star, CheckCircle } from "lucide-react";
import type { Testimonial } from "@/content/testimonials";

interface TestimonialsGridProps {
  testimonials: Testimonial[];
  showMetrics?: boolean;
}

export function TestimonialsGrid({
  testimonials,
  showMetrics = true,
}: TestimonialsGridProps) {
  const featuredTestimonials = testimonials.filter((t) => t.featured);

  return (
    <div className="space-y-12">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-4">
          <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
            Happy Clients
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--accent)]">
            {testimonials.length}+
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-4">
          <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
            Avg Rating
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-3xl font-semibold text-[var(--accent)]">
              5.0
            </span>
            <Star size={20} className="fill-yellow-500 text-yellow-500" />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-4">
          <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
            Projects
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--accent)]">
            20+
          </p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-4">
          <p className="text-sm text-[var(--ink-muted)] uppercase tracking-[0.1em]">
            Success Rate
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-[var(--accent)]">
            100%
          </p>
        </div>
      </div>

      {/* Featured Testimonials */}
      <div>
        <h3 className="mb-6 font-display text-lg font-semibold tracking-[-0.035em]">
          Featured Client Stories
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {featuredTestimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-6 transition-all duration-300 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-raised)]"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="mb-4 leading-6 text-[var(--ink-muted)]">
                "{testimonial.content}"
              </p>

              {/* Project & Metrics */}
              {(testimonial.project || testimonial.metrics) && (
                <div className="border-t border-[var(--line)] pt-4">
                  {testimonial.project && (
                    <p className="text-xs font-mono uppercase tracking-[0.1em] text-[var(--accent)] mb-2">
                      {testimonial.project}
                    </p>
                  )}
                  {showMetrics && testimonial.metrics && (
                    <div className="flex items-center gap-2 text-sm text-[var(--accent)]">
                      <CheckCircle size={14} />
                      <span className="font-mono text-xs">
                        {testimonial.metrics}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Testimonials */}
      <div>
        <h3 className="mb-6 font-display text-lg font-semibold tracking-[-0.035em]">
          More Client Testimonials
        </h3>
        <div className="space-y-4">
          {testimonials
            .filter((t) => !t.featured)
            .map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-4 transition-all duration-300 hover:border-[var(--accent)]/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-[var(--ink)] text-sm">
                        {testimonial.name}
                      </p>
                      <span className="text-xs text-[var(--ink-muted)]">
                        {testimonial.role}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--ink-muted)]">
                      {testimonial.company}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className="fill-yellow-500 text-yellow-500"
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-5 text-[var(--ink-muted)]">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
