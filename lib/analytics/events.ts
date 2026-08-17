interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, string | number | boolean>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  track(
    name: string,
    category: string,
    properties?: Record<string, string | number | boolean>,
  ) {
    const event: AnalyticsEvent = {
      name,
      category,
      properties,
    };

    this.events.push(event);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${category}:${name}`, properties);
    }

    // Send to analytics endpoint if configured
    this.sendEvent(event);
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      if (process.env.NODE_ENV === "development") {
        console.error("Analytics error:", error);
      }
    }
  }

  trackPageView(pageName: string) {
    this.track("page_view", "navigation", { page: pageName });
  }

  trackInteraction(element: string, action: string) {
    this.track("interaction", "user_engagement", {
      element,
      action,
    });
  }

  trackAnimation(animationType: string, triggered: boolean) {
    this.track("animation", "user_experience", {
      type: animationType,
      triggered,
    });
  }

  trackThemeChange(theme: string) {
    this.track("theme_change", "preferences", { theme });
  }

  trackTimeOnPage(pageName: string, seconds: number) {
    this.track("time_on_page", "engagement", {
      page: pageName,
      seconds: Math.round(seconds),
    });
  }
}

export const analytics = new Analytics();
