import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userId,
      riskScore,
      threatFactors,
      exposureLevel,
      timestamp,
      metadata,
    } = await req.json();

    if (!userId || riskScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO risk_assessments
       (user_id, risk_score, threat_factors, exposure_level, assessment_timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       risk_score = $2, threat_factors = $3, exposure_level = $4,
       assessment_timestamp = $5, metadata = $6, updated_at = NOW()
       RETURNING *`,
      [
        userId,
        riskScore,
        JSON.stringify(threatFactors || {}),
        exposureLevel,
        timestamp || new Date(),
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      riskAssessment: result.rows[0],
    });
  } catch (error) {
    console.error('Risk score creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create risk assessment' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM risk_assessments
       WHERE user_id = $1
       ORDER BY assessment_timestamp DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({
        success: true,
        riskAssessment: null,
      });
    }

    return NextResponse.json({
      success: true,
      riskAssessment: result.rows[0],
    });
  } catch (error) {
    console.error('Risk score fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk assessment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM risk_assessments WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Risk score deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete risk assessment' },
      { status: 500 }
    );
  }
}
