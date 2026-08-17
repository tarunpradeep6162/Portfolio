'use client';

import { useEffect } from 'react';
import { initPerformanceMonitoring, trackPageVisibility, initSessionTracking } from '@/lib/analytics/performanceMonitoring';

export function AnalyticsInit() {
  useEffect(() => {
    // Initialize all analytics tracking
    initPerformanceMonitoring();
    trackPageVisibility();
    initSessionTracking();
  }, []);

  return null;
}
