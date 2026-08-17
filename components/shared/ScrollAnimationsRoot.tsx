'use client';

import { useScrollReveal, useParallax } from '@/lib/utils/animations';

export function ScrollAnimationsRoot() {
  useScrollReveal();
  useParallax();
  return null;
}
