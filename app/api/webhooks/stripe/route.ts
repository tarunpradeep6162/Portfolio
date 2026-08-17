// Stripe Webhook Handler - Stub for build

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Stub webhook handler
  return NextResponse.json(
    {
      error: "Webhook handler not configured",
      message: "Stripe integration not available in this deployment",
    },
    { status: 501 }
  );
}
