import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HuntOrchestrator } from "@/lib/threat-hunting/hunt-orchestrator";

const orchestrator = new HuntOrchestrator();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const hunts = await orchestrator.getAllHunts(status || undefined);

    return NextResponse.json({
      success: true,
      hunts,
      count: hunts.length,
    });
  } catch (error) {
    console.error("[Hunts API] Error:", error);
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
      name,
      description,
      huntType,
      targetScope,
      timeRange,
      estimatedDuration,
      createdBy,
    } = body;

    if (!name || !huntType) {
      return NextResponse.json(
        { error: "name and huntType are required" },
        { status: 400 }
      );
    }

    const hunt = await orchestrator.createHunt({
      name,
      description,
      huntType,
      targetScope,
      timeRange,
      estimatedDuration: estimatedDuration || 60,
      createdBy,
    });

    // Store in database
    await query(
      `INSERT INTO threat_hunts (hunt_id, name, hunt_type, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [hunt.huntId, hunt.name, hunt.huntType, hunt.status, hunt.createdBy]
    );

    return NextResponse.json({
      success: true,
      hunt,
    });
  } catch (error) {
    console.error("[Hunts API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
