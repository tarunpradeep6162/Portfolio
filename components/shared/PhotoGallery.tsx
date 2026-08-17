'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  title: string;
}

interface PhotoGalleryProps {
  images: GalleryItem[];
  columns?: number;
}

export function PhotoGallery({ images, columns = 3 }: PhotoGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const selectedImage = images.find(img => img.id === selectedId);
  const currentIdx = images.findIndex(img => img.id === selectedImage?.id);

  const handlePrevious = () => {
    const newIndex = currentIdx === 0 ? images.length - 1 : currentIdx - 1;
    setSelectedId(images[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = currentIdx === images.length - 1 ? 0 : currentIdx + 1;
    setSelectedId(images[newIndex].id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const getGridClass = () => {
    const baseClass = 'grid gap-6 grid-cols-1 md:grid-cols-2';
    switch(columns) {
      case 2: return `${baseClass} lg:grid-cols-2`;
      case 4: return `${baseClass} lg:grid-cols-4`;
      default: return `${baseClass} lg:grid-cols-3`;
    }
  };

  return (
    <>
      <div className={getGridClass()}>
        {images.map((image) => (
          <div
            key={image.id}
            data-scroll-reveal
            className="group cursor-pointer relative overflow-hidden rounded-lg aspect-square"
            onClick={() => setSelectedId(image.id)}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-display text-lg">
                {image.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedId(null)}
              className="absolute -top-10 right-0 text-white hover:text-[var(--accent)] transition-colors"
              aria-label="Close gallery"
            >
              <X size={32} />
            </button>

            <div className="relative aspect-video">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                className="object-contain"
              />
            </div>

            <h3 className="mt-4 text-center text-white text-premium-heading">
              {selectedImage.title}
            </h3>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handlePrevious}
                className="btn-luxury"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-white text-sm">
                {currentIdx + 1} / {images.length}
              </span>
              <button
                onClick={handleNext}
                className="btn-luxury"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
