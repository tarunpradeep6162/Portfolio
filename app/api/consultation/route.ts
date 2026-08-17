import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ConsultationRequest {
  name: string;
  email: string;
  company?: string;
  projectType?: string;
  timeline?: string;
  budget?: string;
  message?: string;
  submittedAt: string;
  status: "new" | "contacted" | "scheduled";
}

const requestsFile = path.join(process.cwd(), ".data", "consultations.json");

function getRequests(): ConsultationRequest[] {
  try {
    if (fs.existsSync(requestsFile)) {
      const content = fs.readFileSync(requestsFile, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading consultations file:", error);
  }
  return [];
}

function saveRequest(request: ConsultationRequest): void {
  const requests = getRequests();
  requests.push(request);

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, projectType, timeline, budget, message } =
      body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const consultationRequest: ConsultationRequest = {
      name,
      email,
      company: company || undefined,
      projectType: projectType || undefined,
      timeline: timeline || undefined,
      budget: budget || undefined,
      message: message || undefined,
      submittedAt: new Date().toISOString(),
      status: "new",
    };

    saveRequest(consultationRequest);

    // In production, you would send an email notification here
    if (process.env.NODE_ENV === "development") {
      console.log("Consultation request received:", consultationRequest);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Consultation request received! I'll contact you within 24 hours.",
        requestId: `${Date.now()}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Consultation request error:", error);
    return NextResponse.json(
      { error: "Failed to process consultation request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = getRequests();
  const stats = {
    total: requests.length,
    byStatus: {
      new: requests.filter((r) => r.status === "new").length,
      contacted: requests.filter((r) => r.status === "contacted").length,
      scheduled: requests.filter((r) => r.status === "scheduled").length,
    },
    byProjectType: {} as Record<string, number>,
  };

  requests.forEach((r) => {
    if (r.projectType) {
      stats.byProjectType[r.projectType] =
        (stats.byProjectType[r.projectType] || 0) + 1;
    }
  });

  return NextResponse.json({
    stats,
    recentRequests: requests.slice(-10),
  });
}
