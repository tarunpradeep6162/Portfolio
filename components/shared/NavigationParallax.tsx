'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function NavigationParallax() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const parallaxOffset = scrollY * 0.5;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ transform: `translateY(${isVisible ? 0 : -100}px)` }}
    >
      <div className="cinematic-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="text-premium-heading text-2xl text-[var(--accent)]"
              style={{ transform: `translateY(${parallaxOffset * 0.1}px)` }}
            >
              Tarun
            </Link>
            <div className="flex gap-8">
              {['About', 'Work', 'Contact'].map((item, i) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="link-luxury text-sm uppercase tracking-widest"
                  style={{ transform: `translateY(${parallaxOffset * (0.15 + i * 0.05)}px)` }}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
