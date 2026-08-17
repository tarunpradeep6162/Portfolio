"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics/events";

export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackInteraction: analytics.trackInteraction.bind(analytics),
    trackAnimation: analytics.trackAnimation.bind(analytics),
    trackThemeChange: analytics.trackThemeChange.bind(analytics),
  };
}

export function usePageAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Map pathname to page name
    const pageName = pathname === "/" ? "home" : pathname.slice(1).split("/")[0];
    analytics.trackPageView(pageName);

    // Track time on page
    const startTime = Date.now();
    return () => {
      const timeOnPage = (Date.now() - startTime) / 1000;
      if (timeOnPage > 2) {
        // Only track if spent more than 2 seconds
        analytics.trackTimeOnPage(pageName, timeOnPage);
      }
    };
  }, [pathname]);
}
