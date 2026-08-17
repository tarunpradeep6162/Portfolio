'use client';

import { PhotoGallery } from '@/components/shared/PhotoGallery';

const workImages = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
    alt: 'Cloud Architecture',
    title: 'Cloud Systems Infrastructure',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&h=600&fit=crop',
    alt: 'DevOps Pipeline',
    title: 'CI/CD Pipeline Design',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=600&fit=crop',
    alt: 'Distributed Systems',
    title: 'Distributed Computing',
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1549167534-50649ab12b20?w=800&h=600&fit=crop',
    alt: 'Security Architecture',
    title: 'Security Infrastructure',
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1516321318423-f06f70d504d0?w=800&h=600&fit=crop',
    alt: 'AWS Architecture',
    title: 'AWS Production Systems',
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    alt: 'Tech Stack',
    title: 'Modern Tech Stack',
  },
];

export function WorkGallery() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center" data-scroll-reveal>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-[var(--ink)] mb-4">
            Project Gallery
          </h2>
          <p className="text-lg text-[var(--ink-muted)] max-w-2xl mx-auto">
            Visual documentation of cloud systems, infrastructure design, and deployment architecture
          </p>
        </div>
        <PhotoGallery images={workImages} columns={3} />
      </div>
    </section>
  );
}
