import { NextRequest, NextResponse } from "next/server";

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

    // Mock BetterBot PRO analysis
    const fileName = file.name;
    const fileType = file.type || "unknown";
    const fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    const threatLevels = ["safe", "warning", "dangerous"];
    const threatLevel = threatLevels[Math.floor(Math.random() * threatLevels.length)];

    const threats = [];
    if (threatLevel !== "safe") {
      if (file.name.toLowerCase().includes(".exe")) {
        threats.push("Executable file detected - potential risk");
      }
      if (fileSize && parseInt(fileSize) > 50) {
        threats.push("Suspiciously large file");
      }
      threats.push("Behavioral analysis inconclusive - manual review recommended");
    }

    return NextResponse.json({
      fileName,
      fileType,
      fileSize,
      threatLevel,
      threats: threats.length > 0 ? threats : [],
      scanTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to scan file" },
      { status: 500 }
    );
  }
}
