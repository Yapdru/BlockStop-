import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ForensicAnalyzer } from "@/lib/forensics/forensic-analyzer";

const analyzer = new ForensicAnalyzer();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json(
        { error: "caseId is required" },
        { status: 400 }
      );
    }

    const investigationCase = await analyzer.getCase(caseId);
    if (!investigationCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: investigationCase,
    });
  } catch (error) {
    console.error("[Forensics API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      severity,
      affectedEntities,
      createdBy,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const investigationCase = await analyzer.createCase({
      title,
      description,
      severity,
      affectedEntities,
      createdBy,
      status: "open",
    });

    // Store in database
    await query(
      `INSERT INTO forensic_cases (case_id, title, status, severity, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        investigationCase.caseId,
        investigationCase.title,
        investigationCase.status,
        investigationCase.severity,
        investigationCase.createdBy,
      ]
    );

    return NextResponse.json({
      success: true,
      case: investigationCase,
    });
  } catch (error) {
    console.error("[Forensics API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
