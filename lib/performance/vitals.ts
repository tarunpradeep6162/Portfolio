export interface WebVital {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
}

export function getLCPRating(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 2500) return "good";
  if (value <= 4000) return "needs-improvement";
  return "poor";
}

export function getINPRating(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 200) return "good";
  if (value <= 500) return "needs-improvement";
  return "poor";
}

export function getCLSRating(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 0.1) return "good";
  if (value <= 0.25) return "needs-improvement";
  return "poor";
}

export function getFCPRating(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 1800) return "good";
  if (value <= 3000) return "needs-improvement";
  return "poor";
}

export function getTTFBRating(value: number): "good" | "needs-improvement" | "poor" {
  if (value <= 600) return "good";
  if (value <= 1200) return "needs-improvement";
  return "poor";
}

export function reportWebVitals(metric: any) {
  const vitals: WebVital = {
    name: metric.name,
    value: Math.round(metric.value),
    rating: "good" as const,
  };

  switch (metric.name) {
    case "LCP":
      vitals.rating = getLCPRating(metric.value);
      break;
    case "INP":
      vitals.rating = getINPRating(metric.value);
      break;
    case "CLS":
      vitals.rating = getCLSRating(metric.value);
      break;
    case "FCP":
      vitals.rating = getFCPRating(metric.value);
      break;
    case "TTFB":
      vitals.rating = getTTFBRating(metric.value);
      break;
  }

  if (metric.delta) {
    vitals.delta = Math.round(metric.delta);
  }

  console.log("Web Vital:", vitals);

  if (process.env.NEXT_PUBLIC_SEND_VITALS === "true") {
    fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vitals),
      keepalive: true,
    }).catch(() => {});
  }
}
