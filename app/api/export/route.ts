import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, format, scanType } = body;

    if (!data || !format) {
      return NextResponse.json(
        { error: "Missing data or format parameter" },
        { status: 400 }
      );
    }

    if (format === "json") {
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="blockstop-${scanType}-${Date.now()}.json"`,
        },
      });
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="blockstop-${scanType}-${Date.now()}.csv"`,
        },
      });
    }

    if (format === "text") {
      const text = convertToText(data);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="blockstop-${scanType}-${Date.now()}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

function convertToCSV(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return String(data);
  }

  const lines: string[] = [];
  const obj = data as Record<string, unknown>;

  Object.entries(obj).forEach(([key, value]) => {
    lines.push(`${key},"${String(value).replace(/"/g, '""')}"`);
  });

  return lines.join("\n");
}

function convertToText(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return String(data);
  }

  const obj = data as Record<string, unknown>;
  const lines: string[] = [];

  lines.push("==== BLOCKSTOP SCAN REPORT ====\n");
  Object.entries(obj).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      (value as unknown[]).forEach((item, i) => {
        lines.push(`  ${i + 1}. ${String(item)}`);
      });
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  });
  lines.push("\n==== END REPORT ====");

  return lines.join("\n");
}
