"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (contentRef.current) {
      gsap.from(contentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, { dependencies: [current] });

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const testimonial = testimonials[current];

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative rounded-lg border border-[var(--line)] bg-[var(--color-control-raised)] p-8 sm:p-12">
        <div ref={contentRef} className="space-y-6">
          {/* Stars */}
          <div className="flex gap-1">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className="fill-yellow-500 text-yellow-500"
              />
            ))}
          </div>

          {/* Quote */}
          <p className="text-lg leading-7 text-[var(--ink)] italic">
            &ldquo;{testimonial.content}&rdquo;
          </p>

          {/* Author */}
          <div className="border-t border-[var(--line)] pt-6">
            <p className="font-display font-semibold text-[var(--ink)]">
              {testimonial.name}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-[var(--ink-muted)]">
              {testimonial.role} at {testimonial.company}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              className="rounded border border-[var(--line)] p-2 transition-all hover:bg-[var(--accent)]/20"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="rounded border border-[var(--line)] p-2 transition-all hover:bg-[var(--accent)]/20"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="font-mono text-sm text-[var(--ink-muted)]">
            {current + 1} / {testimonials.length}
          </div>
        </div>
      </div>
    </div>
  );
}
