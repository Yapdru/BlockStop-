/**
 * Threat Hunting Evidence API
 * GET /api/hunting/evidence - Get evidence
 * POST /api/hunting/evidence - Add evidence
 */

import { NextRequest, NextResponse } from "next/server";

interface Evidence {
  evidenceId: string;
  type: string;
  source: string;
  description: string;
  hash: string;
  size: number;
  collectedAt: Date;
  collectedBy: string;
  chainOfCustody: Array<{
    action: string;
    timestamp: Date;
    actor: string;
  }>;
}

const evidenceStore: Map<string, Evidence> = new Map();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get("caseId");
    const type = searchParams.get("type");

    let results = Array.from(evidenceStore.values());

    if (type) {
      results = results.filter(e => e.type === type);
    }

    return NextResponse.json({
      success: true,
      evidence: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Failed to retrieve evidence:", error);
    return NextResponse.json(
      { error: "Failed to retrieve evidence" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      type,
      source,
      description,
      hash,
      size,
      collectedBy,
    } = data;

    if (!type || !source || !collectedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const evidenceId = `evt-${Date.now()}`;
    const evidence: Evidence = {
      evidenceId,
      type,
      source,
      description,
      hash: hash || "",
      size: size || 0,
      collectedAt: new Date(),
      collectedBy,
      chainOfCustody: [
        {
          action: "collected",
          timestamp: new Date(),
          actor: collectedBy,
        },
      ],
    };

    evidenceStore.set(evidenceId, evidence);

    return NextResponse.json({
      success: true,
      evidence,
    });
  } catch (error) {
    console.error("Failed to add evidence:", error);
    return NextResponse.json(
      { error: "Failed to add evidence" },
      { status: 500 }
    );
  }
}
