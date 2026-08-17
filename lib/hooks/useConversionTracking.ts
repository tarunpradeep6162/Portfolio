import { useEffect } from 'react';

export type ConversionEvent =
  | 'contact_form_submit'
  | 'cta_button_click'
  | 'blog_article_read'
  | 'project_view'
  | 'download_resume'
  | 'social_link_click'
  | 'email_copy'
  | 'newsletter_signup';

interface ConversionData {
  event: ConversionEvent;
  value?: number;
  metadata?: Record<string, any>;
}

export function trackConversion(data: ConversionData) {
  if (typeof window === 'undefined') return;

  const conversionData = {
    ...data,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Send to analytics backend
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/analytics/conversions',
      JSON.stringify(conversionData)
    );
  } else {
    // Fallback to fetch
    fetch('/api/analytics/conversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversionData),
    }).catch(() => {
      // Silently fail for analytics - don't interrupt user experience
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Conversion tracked:', conversionData);
  }
}

export function useConversionTracking() {
  useEffect(() => {
    // Track page view
    trackConversion({
      event: 'blog_article_read',
      metadata: {
        page: window.location.pathname,
      },
    });
  }, []);

  return { trackConversion };
}

export function useFormConversionTracking(formName: string) {
  const handleFormSubmit = (success: boolean) => {
    if (success) {
      trackConversion({
        event: 'contact_form_submit',
        metadata: {
          form: formName,
          success: true,
        },
      });
    }
  };

  return { handleFormSubmit };
}
