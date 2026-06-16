import { NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, return mock data (real implementation would query from database)
    const mockResults = [
      {
        id: 1,
        fileName: "document.exe",
        fileSize: "2.5 MB",
        threatLevel: "dangerous",
        threats: ["Executable file detected", "Ransomware indicators"],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        fileName: "presentation.pdf",
        fileSize: "5.1 MB",
        threatLevel: "safe",
        threats: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 3,
        fileName: "archive.zip",
        fileSize: "150 MB",
        threatLevel: "warning",
        threats: ["Compressed archive - potential payload hidden"],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ];

    return NextResponse.json({
      results: mockResults,
      total: mockResults.length,
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
