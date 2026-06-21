/**
 * Threat Analytics API - Aggregates threat data for dashboard and analysis
 * GET /api/analytics/threats - Get threat statistics
 * POST /api/analytics/threats - Record new threat
 */

import { NextRequest, NextResponse } from "next/server";

export interface ThreatRecord {
  timestamp: Date;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  target?: string;
  count: number;
}

// In-memory threat data (replace with database in production)
const threatData: ThreatRecord[] = [];

/**
 * GET /api/analytics/threats
 * Retrieve threat statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "24h";
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");

    // Calculate time range
    let hoursBack = 24;
    if (period === "7d") hoursBack = 24 * 7;
    if (period === "30d") hoursBack = 24 * 30;
    if (period === "90d") hoursBack = 24 * 90;

    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Filter threats
    let filtered = threatData.filter((t) => new Date(t.timestamp) > cutoffTime);

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (severity) {
      filtered = filtered.filter((t) => t.severity === severity);
    }

    // Aggregate by type
    const byType: Record<string, number> = {};
    for (const threat of filtered) {
      byType[threat.type] = (byType[threat.type] || 0) + threat.count;
    }

    // Aggregate by severity
    const bySeverity: Record<string, number> = {};
    for (const threat of filtered) {
      bySeverity[threat.severity] = (bySeverity[threat.severity] || 0) + threat.count;
    }

    // Aggregate by source
    const bySource: Record<string, number> = {};
    for (const threat of filtered) {
      bySource[threat.source] = (bySource[threat.source] || 0) + threat.count;
    }

    // Calculate trend
    const halfway = Math.floor(filtered.length / 2);
    const firstHalf = filtered
      .slice(0, halfway)
      .reduce((sum, t) => sum + t.count, 0);
    const secondHalf = filtered
      .slice(halfway)
      .reduce((sum, t) => sum + t.count, 0);

    const trend = secondHalf > firstHalf ? "increasing" : "decreasing";
    const trendPercent = firstHalf > 0
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      : 0;

    return NextResponse.json({
      period,
      timeRange: {
        start: cutoffTime.toISOString(),
        end: new Date().toISOString(),
      },
      totalThreats: filtered.reduce((sum, t) => sum + t.count, 0),
      uniqueThreats: filtered.length,
      byType,
      bySeverity,
      bySource,
      trend: {
        direction: trend,
        percentChange: trendPercent,
      },
      topThreats: filtered
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((t) => ({
          type: t.type,
          severity: t.severity,
          count: t.count,
          lastSeen: t.timestamp,
        })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get threat analytics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve threat analytics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/threats
 * Record a new threat
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      type,
      severity,
      source,
      target,
      count = 1,
    } = data as Partial<ThreatRecord>;

    if (!type || !severity || !source) {
      return NextResponse.json(
        { error: "Missing required fields: type, severity, source" },
        { status: 400 }
      );
    }

    const threat: ThreatRecord = {
      timestamp: new Date(),
      type,
      severity,
      source,
      target,
      count,
    };

    threatData.push(threat);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const index = threatData.findIndex((t) => new Date(t.timestamp) < thirtyDaysAgo);
    if (index > 0) {
      threatData.splice(0, index);
    }

    return NextResponse.json({
      success: true,
      threat,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to record threat:", error);
    return NextResponse.json(
      { error: "Failed to record threat" },
      { status: 500 }
    );
  }
}
