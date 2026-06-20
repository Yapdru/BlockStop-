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
      policyName,
      threatTypes,
      minSeverity,
      action,
      enabled = true,
      conditions,
      exceptions,
      userId,
    } = await req.json();

    if (!policyName || !threatTypes || !minSeverity || !action || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO prevention_policies
       (policy_name, threat_types, min_severity, action, enabled, conditions, exceptions, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        policyName,
        threatTypes,
        minSeverity,
        action,
        enabled,
        JSON.stringify(conditions || {}),
        exceptions || [],
        userId,
      ]
    );

    return NextResponse.json({
      success: true,
      policy: result.rows[0],
    });
  } catch (error) {
    console.error('Policy creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
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
    const enabled = searchParams.get('enabled');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (enabled !== null) {
      filterQuery += ` AND enabled = $${params.length + 1}`;
      params.push(enabled === 'true');
    }

    const result = await query(
      `SELECT * FROM prevention_policies ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      policies: result.rows,
    });
  } catch (error) {
    console.error('Policies fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      id,
      policyName,
      threatTypes,
      minSeverity,
      action,
      enabled,
      conditions,
      exceptions,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE prevention_policies
       SET policy_name = COALESCE($1, policy_name),
           threat_types = COALESCE($2, threat_types),
           min_severity = COALESCE($3, min_severity),
           action = COALESCE($4, action),
           enabled = COALESCE($5, enabled),
           conditions = COALESCE($6, conditions),
           exceptions = COALESCE($7, exceptions),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        policyName || null,
        threatTypes || null,
        minSeverity || null,
        action || null,
        enabled !== undefined ? enabled : null,
        conditions ? JSON.stringify(conditions) : null,
        exceptions || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      policy: result.rows[0],
    });
  } catch (error) {
    console.error('Policy update error:', error);
    return NextResponse.json(
      { error: 'Failed to update policy' },
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM prevention_policies WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Policy deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete policy' },
      { status: 500 }
    );
  }
}
