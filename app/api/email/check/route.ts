import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Mock DRAR AI analysis
    const riskScore = Math.floor(Math.random() * 100);
    const threats = [];

    if (email.includes("@")) {
      if (email.includes("suspicious") || email.includes("spam")) {
        threats.push("Suspicious sender pattern detected");
      }
      if (email.includes("click") || email.includes("verify")) {
        threats.push("Potential phishing attempt");
      }
      if (email.length > 500) {
        threats.push("Unusually long email content");
      }
    }

    return NextResponse.json({
      riskScore,
      threats: threats.length > 0 ? threats : ["No immediate threats detected"],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to analyze email" },
      { status: 500 }
    );
  }
}
