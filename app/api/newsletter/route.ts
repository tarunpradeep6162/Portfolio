import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const newsletterFile = path.join(process.cwd(), ".data", "newsletter.json");

interface NewsletterEntry {
  email: string;
  subscribedAt: string;
}

function getSubscribers(): NewsletterEntry[] {
  try {
    if (fs.existsSync(newsletterFile)) {
      const content = fs.readFileSync(newsletterFile, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading newsletter file:", error);
  }
  return [];
}

function saveSubscriber(email: string): void {
  const subscribers = getSubscribers();

  if (subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already subscribed");
  }

  subscribers.push({
    email,
    subscribedAt: new Date().toISOString(),
  });

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(newsletterFile, JSON.stringify(subscribers, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    saveSubscriber(email);

    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to newsletter!",
        email,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already subscribed")) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const subscribers = getSubscribers();
  return NextResponse.json({
    totalSubscribers: subscribers.length,
    subscribers: process.env.NODE_ENV === "development" ? subscribers : [],
  });
}
