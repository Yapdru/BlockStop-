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
      threatId,
      threatType,
      severity,
      sourceIp,
      sourceProcess,
      action,
      details,
    } = await req.json();

    if (!threatId || !threatType || !severity || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO threat_blocks
       (threat_id, threat_type, threat_severity, source_ip, source_process, block_action, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [threatId, threatType, severity, sourceIp, sourceProcess, action, JSON.stringify(details || {})]
    );

    return NextResponse.json({
      success: true,
      block: result.rows[0],
    });
  } catch (error) {
    console.error('Block creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create block' },
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (severity) {
      filterQuery += ` AND threat_severity = $${params.length + 1}`;
      params.push(severity);
    }

    const result = await query(
      `SELECT * FROM threat_blocks ${filterQuery}
       ORDER BY block_timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      blocks: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Block fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocks' },
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

    const { threatId, action, details } = await req.json();

    if (!threatId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE threat_blocks
       SET block_action = $1, details = $2, updated_at = NOW()
       WHERE threat_id = $3
       RETURNING *`,
      [action, JSON.stringify(details || {}), threatId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      block: result.rows[0],
    });
  } catch (error) {
    console.error('Block update error:', error);
    return NextResponse.json(
      { error: 'Failed to update block' },
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
    const threatId = searchParams.get('threatId');

    if (!threatId) {
      return NextResponse.json(
        { error: 'Missing threatId parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      'DELETE FROM threat_blocks WHERE threat_id = $1',
      [threatId]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Block deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete block' },
      { status: 500 }
    );
  }
}
