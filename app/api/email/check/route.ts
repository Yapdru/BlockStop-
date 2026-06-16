import { NextRequest, NextResponse } from "next/server";
import { drarAI } from "@/lib/ai/drar-ai";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Invalid email content provided" },
        { status: 400 }
      );
    }

    // Use real DRAR AI analysis
    const result = await drarAI.analyzeEmail(email);

    return NextResponse.json({
      riskScore: result.riskScore,
      threats: result.threats,
      analysis: result.analysis,
      detailedReport: result.detailedReport,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Email analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze email" },
      { status: 500 }
    );
  }
}
