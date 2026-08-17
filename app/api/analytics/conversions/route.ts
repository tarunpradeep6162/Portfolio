import { NextRequest, NextResponse } from 'next/server';

interface ConversionData {
  event: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversionData = await request.json();

    // Validate required fields
    if (!body.event) {
      return NextResponse.json(
        { error: 'Missing event field' },
        { status: 400 }
      );
    }

    // Log conversion event (in production, store in database or analytics service)
    console.log('Conversion tracked:', {
      event: body.event,
      value: body.value,
      timestamp: body.timestamp,
      url: body.url,
      metadata: body.metadata,
    });

    // TODO: Store in database or send to analytics service
    // Examples:
    // - Send to Google Analytics
    // - Store in database for dashboard
    // - Send to third-party analytics platform
    // - Track in session storage for heatmaps

    return NextResponse.json(
      { success: true, message: 'Conversion tracked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Conversion tracking error:', error);
    // Don't expose error details to client
    return NextResponse.json(
      { success: false },
      { status: 200 } // Return 200 anyway to not trigger errors on client
    );
  }
}
