'use client';

import { Star } from 'lucide-react';

const testimonials = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Engineering Manager, TechCorp',
    text: 'Tarun designed and implemented our entire AWS infrastructure migration. His attention to reliability patterns and automation frameworks transformed our deployment process.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'CTO, CloudFirst Solutions',
    text: 'Working with Tarun on our CI/CD pipeline overhaul was exceptional. His deep understanding of Docker and Jenkins delivered measurable improvements in deployment frequency and reliability.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'VP Infrastructure, DataSys',
    text: 'Tarun\'s approach to secure AWS production architecture gave us the confidence to scale. His documentation and knowledge transfer process set a new standard for our team.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
  {
    id: '4',
    name: 'James Wilson',
    role: 'DevOps Lead, InnovateTech',
    text: 'The distributed Jenkins controller architecture Tarun built handles our multi-region deployments flawlessly. His expertise in automation frameworks is unmatched.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-[var(--surface)]" data-scroll-reveal>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[var(--ink)] mb-4">
            Trusted by Engineering Teams
          </h2>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            Here's what leaders and teams have to say about collaboration and project outcomes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              data-scroll-reveal
              className="bg-[var(--surface-raised)] border border-[var(--line)] rounded-lg p-6 sm:p-8 hover:border-[var(--accent)] transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-[var(--accent)] text-[var(--accent)]"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-[var(--ink-muted)] leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border border-[var(--line)]"
                />
                <div>
                  <p className="font-display font-semibold text-[var(--ink)]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
