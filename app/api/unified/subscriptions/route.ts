import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, integrationIds, schedule } = await req.json();

    if (!integrationIds || !Array.isArray(integrationIds)) {
      return NextResponse.json(
        { error: 'Integration IDs array is required' },
        { status: 400 }
      );
    }

    if (!schedule || !['hourly', 'daily', 'weekly'].includes(schedule)) {
      return NextResponse.json(
        { error: 'Valid schedule (hourly, daily, weekly) is required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const subscriptionId = `sub_${crypto.randomBytes(16).toString('hex')}`;

    const scheduleMap = {
      hourly: 1,
      daily: 24,
      weekly: 7 * 24
    };

    const nextScan = new Date(Date.now() + scheduleMap[schedule as keyof typeof scheduleMap] * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO scan_subscriptions (id, user_id, team_id, integration_ids, schedule, next_scan, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING *`,
      [subscriptionId, userId, teamId || null, integrationIds, schedule, nextScan]
    );

    return NextResponse.json({
      subscription: result.rows[0],
      nextScanAt: nextScan.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = req.nextUrl.searchParams.get('teamId') || null;

    const db = getDb();

    const query = teamId
      ? `SELECT * FROM scan_subscriptions WHERE user_id = $1 AND team_id = $2 ORDER BY created_at DESC`
      : `SELECT * FROM scan_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`;

    const result = await db.query(
      query,
      teamId ? [userId, teamId] : [userId]
    );

    return NextResponse.json({
      subscriptions: result.rows
    });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to list subscriptions' },
      { status: 500 }
    );
  }
}
