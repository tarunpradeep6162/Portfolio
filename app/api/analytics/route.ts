import { NextRequest, NextResponse } from "next/server";

interface AnalyticsPayload {
  name: string;
  category: string;
  properties?: Record<string, string | number | boolean>;
  sessionId: string;
  timestamp: string;
  url: string;
}

// In production, you would store this in a database
// For now, we'll just acknowledge receipt
const analyticsLog: AnalyticsPayload[] = [];

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json();

    // Validate payload
    if (!payload.name || !payload.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Store event
    analyticsLog.push(payload);

    // Keep only last 1000 events in memory
    if (analyticsLog.length > 1000) {
      analyticsLog.shift();
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics API]", payload);
    }

    // In production, you would:
    // 1. Send to a service like PostHog, Plausible, or Fathom
    // 2. Store in database for later analysis
    // 3. Check for specific events to trigger actions

    return NextResponse.json({
      success: true,
      eventId: `${payload.sessionId}-${Date.now()}`,
    });
  } catch (error) {
    console.error("Analytics endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to process analytics" },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Optional: Return analytics summary in development
  if (process.env.NODE_ENV === "development") {
    const summary = {
      totalEvents: analyticsLog.length,
      eventTypes: [...new Set(analyticsLog.map((e) => e.category))],
      recentEvents: analyticsLog.slice(-10),
    };
    return NextResponse.json(summary);
  }

  return NextResponse.json({ message: "Analytics endpoint" });
}
