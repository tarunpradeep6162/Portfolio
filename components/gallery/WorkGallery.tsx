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
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1517694712686-5e4a27911e6d?w=800&h=600&fit=crop',
    alt: 'Container Orchestration',
    title: 'Kubernetes Deployment',
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1563440810-c5e66b3b8a5e?w=800&h=600&fit=crop',
    alt: 'Monitoring & Observability',
    title: 'System Monitoring',
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1516534819246-8b33f42c5a4f?w=800&h=600&fit=crop',
    alt: 'Network Infrastructure',
    title: 'Network Architecture',
  },
  {
    id: '10',
    src: 'https://images.unsplash.com/photo-1514434328850-f280c7ee4e16?w=800&h=600&fit=crop',
    alt: 'Database Systems',
    title: 'Database Engineering',
  },
  {
    id: '11',
    src: 'https://images.unsplash.com/photo-1551434678-e076306fae0d?w=800&h=600&fit=crop',
    alt: 'Server Infrastructure',
    title: 'Server Architecture',
  },
  {
    id: '12',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    alt: 'Enterprise Solutions',
    title: 'Enterprise Infrastructure',
  },
];

export function WorkGallery() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center" data-scroll-reveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[var(--ink)] mb-3 sm:mb-4">
            Project Gallery
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[var(--ink-muted)] max-w-2xl mx-auto leading-relaxed">
            Visual documentation of cloud systems, infrastructure design, and deployment architecture
          </p>
        </div>
        <div className="mt-8 sm:mt-12">
          <PhotoGallery images={workImages} columns={3} />
        </div>
      </div>
    </section>
  );
}
