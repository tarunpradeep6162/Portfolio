"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onLCP, onINP, onTTFB } from "web-vitals";
import { reportWebVitals } from "@/lib/performance/vitals";

export function VitalsTracker() {
  useEffect(() => {
    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onINP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null;
}
