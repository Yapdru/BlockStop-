import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { UEBAEngine } from "@/lib/behavioral-analytics/ueba-engine";

const uebaEngine = new UEBAEngine();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user profile from database
    const result = await query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const profile = result.rows[0];

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("[Profile API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, department } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "userId and name are required" },
        { status: 400 }
      );
    }

    // Insert or update profile
    const result = await query(
      `INSERT INTO user_profiles (user_id, name, department, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       name = $2, department = $3, updated_at = NOW()
       RETURNING *`,
      [userId, name, department]
    );

    return NextResponse.json({
      success: true,
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("[Profile API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
