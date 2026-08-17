// Document Processing API - Stub for build

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Stub document processing handler
  return NextResponse.json(
    {
      error: "Document processing not configured",
      message: "OpenAI integration not available in this deployment",
    },
    { status: 501 }
  );
}
