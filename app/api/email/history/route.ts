import { NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, return mock data (real implementation would query from database)
    const mockHistory = [
      {
        id: 1,
        email: "suspicious@example.com",
        riskScore: 85,
        threats: ["Phishing attempt detected", "Malicious links found"],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        email: "Click here to verify account",
        riskScore: 72,
        threats: ["Urgency tactics detected", "Suspicious patterns"],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 3,
        email: "Welcome to newsletter",
        riskScore: 15,
        threats: [],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ];

    return NextResponse.json({
      history: mockHistory,
      total: mockHistory.length,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
