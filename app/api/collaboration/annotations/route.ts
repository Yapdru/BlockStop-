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
      evidenceId,
      annotationType,
      content,
      position,
    } = await req.json();

    if (!evidenceId || !annotationType || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO annotations
       (evidence_id, annotation_type, content, position, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [evidenceId, annotationType, content, JSON.stringify(position || {}), session.user.email]
    );

    return NextResponse.json({
      success: true,
      annotation: result.rows[0],
    });
  } catch (error) {
    console.error('Annotation creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation' },
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
    const evidenceId = searchParams.get('evidenceId');
    const resolved = searchParams.get('resolved');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    if (!evidenceId) {
      return NextResponse.json(
        { error: 'Missing evidenceId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE evidence_id = $1';
    const params: any[] = [evidenceId];

    if (resolved !== null) {
      filterQuery += ` AND resolved = $${params.length + 1}`;
      params.push(resolved === 'true');
    }

    const result = await query(
      `SELECT * FROM annotations ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      annotations: result.rows,
    });
  } catch (error) {
    console.error('Annotations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
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

    const { id, resolved, content } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const resolvedAt = resolved ? new Date() : null;

    const result = await query(
      `UPDATE annotations
       SET resolved = COALESCE($1, resolved),
           resolved_at = COALESCE($2, resolved_at),
           resolved_by = CASE WHEN $1 = true THEN $4 ELSE resolved_by END,
           content = COALESCE($3, content)
       WHERE id = $5
       RETURNING *`,
      [
        resolved !== undefined ? resolved : null,
        resolvedAt,
        content || null,
        session.user.email,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      annotation: result.rows[0],
    });
  } catch (error) {
    console.error('Annotation update error:', error);
    return NextResponse.json(
      { error: 'Failed to update annotation' },
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
      'DELETE FROM annotations WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Annotation deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
