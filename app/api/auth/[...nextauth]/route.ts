// NextAuth handler - stub implementation

import { NextRequest } from "next/server";

// Stub handler when NextAuth dependencies are not available
export async function GET(request: NextRequest, { params }: any) {
  return new Response(
    JSON.stringify({
      error: "Authentication not configured",
      message: "Please install required dependencies and configure environment variables",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(request: NextRequest, { params }: any) {
  return new Response(
    JSON.stringify({
      error: "Authentication not configured",
      message: "Please install required dependencies and configure environment variables",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}
