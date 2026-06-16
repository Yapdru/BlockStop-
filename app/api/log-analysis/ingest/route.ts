import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { LogParser } from "@/lib/log-analysis/log-parser";

const parser = new LogParser();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logContent, format, source } = body;

    if (!logContent) {
      return NextResponse.json(
        { error: "logContent is required" },
        { status: 400 }
      );
    }

    // Parse logs
    const parsedLogs = await parser.parseLogs(logContent, format);

    if (parsedLogs.length === 0) {
      return NextResponse.json(
        { error: "No logs could be parsed" },
        { status: 400 }
      );
    }

    // Store in database
    for (const log of parsedLogs) {
      await query(
        `INSERT INTO logs (timestamp, level, source, message, fields, hash, ingested_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (hash) DO NOTHING`,
        [
          log.timestamp,
          log.level,
          source || log.source,
          log.message,
          JSON.stringify(log.fields),
          log.hash,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      ingested: parsedLogs.length,
      logs: parsedLogs.slice(0, 10), // Return first 10 as sample
    });
  } catch (error) {
    console.error("[Log Ingest API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
