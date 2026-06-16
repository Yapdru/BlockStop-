import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock statistics (would query from database in production)
    const stats = {
      totalScans: 1247,
      emailScans: 892,
      fileScans: 355,
      threatsDetected: 156,
      malwareFound: 23,
      phishingAttempts: 87,
      ransomwareDetected: 5,
      avgRiskScore: 34.2,
      trendsLastWeek: {
        totalScans: [120, 135, 142, 128, 151, 165, 172],
        threatsDetected: [12, 15, 18, 14, 22, 28, 31],
      },
      topThreats: [
        { name: "Phishing Attempts", count: 87, percentage: 55 },
        { name: "Malicious Links", count: 34, percentage: 22 },
        { name: "Ransomware", count: 23, percentage: 15 },
        { name: "Trojans", count: 12, percentage: 8 },
      ],
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
