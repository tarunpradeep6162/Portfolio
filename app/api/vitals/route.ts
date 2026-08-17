import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface VitalMetric {
  name: string;
  value: number;
  rating: string;
  delta?: number;
  timestamp: string;
}

const vitalsFile = path.join(process.cwd(), ".data", "vitals.json");

function getVitals(): VitalMetric[] {
  try {
    if (fs.existsSync(vitalsFile)) {
      const content = fs.readFileSync(vitalsFile, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading vitals file:", error);
  }
  return [];
}

function saveVital(metric: VitalMetric): void {
  const vitals = getVitals();

  vitals.push(metric);

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(vitalsFile, JSON.stringify(vitals.slice(-1000), null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, delta } = body;

    if (!name || typeof value !== "number") {
      return NextResponse.json(
        { error: "Invalid metric data" },
        { status: 400 }
      );
    }

    saveVital({
      name,
      value,
      rating,
      delta,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vital metric recorded",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Vitals recording error:", error);
    return NextResponse.json(
      { error: "Failed to record vital metric" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const vitals = getVitals();

  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const stats = {
    totalMetrics: vitals.length,
    byName: {} as Record<string, any>,
  };

  const grouped = vitals.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    },
    {} as Record<string, number[]>
  );

  for (const [name, values] of Object.entries(grouped)) {
    const sorted = [...values].sort((a, b) => a - b);
    stats.byName[name] = {
      count: values.length,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  return NextResponse.json(stats);
}
