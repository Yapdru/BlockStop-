import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { threatId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT * FROM threat_timeline WHERE id = $1 AND user_id = $2`,
      [params.threatId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Threat not found' }, { status: 404 });
    }

    const threat = result.rows[0];

    // Get remediation actions for this threat
    const actionsResult = await db.query(
      `SELECT * FROM remediation_actions WHERE threat_id = $1`,
      [params.threatId]
    );

    return NextResponse.json({
      threat,
      remediationActions: actionsResult.rows
    });
  } catch (error) {
    console.error('Get threat error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threat' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { threatId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resolved } = await req.json();

    const db = getDb();

    // Verify user owns this threat
    const verifyResult = await db.query(
      `SELECT * FROM threat_timeline WHERE id = $1 AND user_id = $2`,
      [params.threatId, userId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Threat not found' }, { status: 404 });
    }

    // Update threat status
    const updateResult = await db.query(
      `UPDATE threat_timeline SET resolved = $1, resolved_at = NOW() WHERE id = $2 RETURNING *`,
      [resolved, params.threatId]
    );

    return NextResponse.json({
      threat: updateResult.rows[0],
      success: true
    });
  } catch (error) {
    console.error('Update threat error:', error);
    return NextResponse.json(
      { error: 'Failed to update threat' },
      { status: 500 }
    );
  }
}
