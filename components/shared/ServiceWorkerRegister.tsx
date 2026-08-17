'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only register in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Service Worker registration skipped in development');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates regularly
          setInterval(() => {
            registration.update();
          }, 60000); // Check every 60 seconds
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
