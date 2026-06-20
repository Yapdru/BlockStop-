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
      patternName,
      threatType,
      confidence,
      indicators,
      behaviorDescription,
      userId,
    } = await req.json();

    if (!patternName || !threatType || !confidence || !indicators) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO threat_patterns
       (pattern_name, threat_type, confidence, indicators, behavior_description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patternName, threatType, confidence, indicators, behaviorDescription, userId]
    );

    return NextResponse.json({
      success: true,
      pattern: result.rows[0],
    });
  } catch (error) {
    console.error('Pattern creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create pattern' },
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
    const threatType = searchParams.get('threatType');
    const active = searchParams.get('active');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (threatType) {
      filterQuery += ` AND threat_type = $${params.length + 1}`;
      params.push(threatType);
    }

    if (active !== null) {
      filterQuery += ` AND active = $${params.length + 1}`;
      params.push(active === 'true');
    }

    if (minConfidence > 0) {
      filterQuery += ` AND confidence >= $${params.length + 1}`;
      params.push(minConfidence);
    }

    const result = await query(
      `SELECT * FROM threat_patterns ${filterQuery}
       ORDER BY confidence DESC, last_detected DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      patterns: result.rows,
    });
  } catch (error) {
    console.error('Patterns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
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

    const { id, active, confidence, detectionCount } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE threat_patterns
       SET active = COALESCE($1, active),
           confidence = COALESCE($2, confidence),
           detection_count = COALESCE($3, detection_count),
           last_detected = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        active !== undefined ? active : null,
        confidence || null,
        detectionCount || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern: result.rows[0],
    });
  } catch (error) {
    console.error('Pattern update error:', error);
    return NextResponse.json(
      { error: 'Failed to update pattern' },
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
      'DELETE FROM threat_patterns WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Pattern deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete pattern' },
      { status: 500 }
    );
  }
}
