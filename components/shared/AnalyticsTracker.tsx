"use client";

import { usePageAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsTracker() {
  usePageAnalytics();
  return null;
}
