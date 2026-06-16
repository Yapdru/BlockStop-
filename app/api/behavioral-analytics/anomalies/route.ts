import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AnomalyDetector } from "@/lib/behavioral-analytics/anomaly-detector";

const anomalyDetector = new AnomalyDetector();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const days = searchParams.get("days") || "7";

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    // Get anomalies from database
    const result = await query(
      `SELECT * FROM anomalies
       WHERE user_id = $1 AND detected_at >= $2
       ORDER BY detected_at DESC`,
      [userId, since]
    );

    const anomalies = result.rows;
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const anomaly of anomalies) {
      severityCounts[anomaly.severity as keyof typeof severityCounts]++;
    }

    return NextResponse.json({
      success: true,
      anomalies,
      summary: {
        total: anomalies.length,
        severityCounts,
      },
    });
  } catch (error) {
    console.error("[Anomalies API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, severity, anomalyType, reasons, score } = body;

    if (!userId || !eventId || !severity) {
      return NextResponse.json(
        { error: "userId, eventId, and severity are required" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO anomalies (user_id, event_id, severity, anomaly_type, reasons, score, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, eventId, severity, anomalyType, JSON.stringify(reasons), score]
    );

    return NextResponse.json({
      success: true,
      anomaly: result.rows[0],
    });
  } catch (error) {
    console.error("[Anomalies API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
