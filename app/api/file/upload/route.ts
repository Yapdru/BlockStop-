import { NextRequest, NextResponse } from "next/server";
import { betterbotPro } from "@/lib/ai/betterbot-pro";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Check file size limit (50MB)
    if (fileBuffer.length > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 413 }
      );
    }

    // Use real BetterBot PRO analysis
    const result = await betterbotPro.scanFile(fileBuffer, file.name);

    return NextResponse.json({
      fileName: file.name,
      fileType: file.type || "unknown",
      fileSize: `${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      threatLevel: result.threatLevel,
      threats: result.threats,
      analysis: result.analysis,
      scanDetails: result.scanDetails,
      scanTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("File scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan file" },
      { status: 500 }
    );
  }
}
