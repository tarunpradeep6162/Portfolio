'use client';

// Performance monitoring and Web Vitals tracking
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals using native APIs
  trackWebVitals();

  // Track custom metrics
  trackAnimationPerformance();
  trackInteractionMetrics();
}

function trackWebVitals() {
  // Track Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      sendMetric({
        name: 'LCP',
        value: entry.startTime,
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP measurement not supported');
  }

  // Track First Input Delay (FID) using Navigation Timing
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          sendMetric({
            name: 'FID',
            value: fidEntry.processingDuration || 0,
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID measurement not supported');
    }
  }
}

function sendMetric(metric: any) {
  // Send to analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/metrics', JSON.stringify(metric));
  }
}

function trackAnimationPerformance() {
  // Monitor 60fps scroll animations
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;

  function countFrame() {
    const currentTime = performance.now();
    frameCount++;

    if (currentTime - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;

      // Log if FPS drops below 50
      if (fps < 50) {
        console.warn(`Animation performance: ${fps} FPS`);
      }
    }

    requestAnimationFrame(countFrame);
  }

  requestAnimationFrame(countFrame);
}

function trackInteractionMetrics() {
  // Track button clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      trackEvent('button_click', {
        button_text: target.textContent?.slice(0, 50),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Track form submissions
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement;
    trackEvent('form_submit', {
      form_name: form.name || form.id,
      timestamp: new Date().toISOString(),
    });
  });

  // Track link clicks
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && link.href) {
      trackEvent('link_click', {
        link_url: link.href,
        link_text: link.textContent?.slice(0, 50),
        timestamp: new Date().toISOString(),
      });
    }
  });
}

export function trackEvent(eventName: string, data: Record<string, any>) {
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/events',
      JSON.stringify({ event: eventName, data })
    );
  }
}

// Page visibility tracking
export function trackPageVisibility() {
  document.addEventListener('visibilitychange', () => {
    trackEvent('page_visibility', {
      visible: !document.hidden,
      timestamp: new Date().toISOString(),
    });
  });
}

// Session tracking
export function initSessionTracking() {
  const sessionId = generateSessionId();
  sessionStorage.setItem('sessionId', sessionId);

  trackEvent('session_start', {
    sessionId,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });

  // Track session end on page unload
  window.addEventListener('beforeunload', () => {
    trackEvent('session_end', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  });
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
