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
      postureScore,
      category,
      assessment,
      recommendations,
      timestamp,
      metadata,
    } = await req.json();

    if (!userId || postureScore === undefined || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO security_posture
       (user_id, posture_score, category, assessment, recommendations, assessment_timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        postureScore,
        category,
        assessment,
        JSON.stringify(recommendations || []),
        timestamp || new Date(),
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      posture: result.rows[0],
    });
  } catch (error) {
    console.error('Posture assessment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create posture assessment' },
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
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (category) {
      filterQuery += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    const result = await query(
      `SELECT * FROM security_posture ${filterQuery}
       ORDER BY assessment_timestamp DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      postures: result.rows,
    });
  } catch (error) {
    console.error('Posture assessments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posture assessments' },
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

    const { id, postureScore, recommendations } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE security_posture
       SET posture_score = COALESCE($1, posture_score),
           recommendations = COALESCE($2, recommendations),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [
        postureScore || null,
        recommendations ? JSON.stringify(recommendations) : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Posture assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      posture: result.rows[0],
    });
  } catch (error) {
    console.error('Posture update error:', error);
    return NextResponse.json(
      { error: 'Failed to update posture assessment' },
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
      'DELETE FROM security_posture WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Posture deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete posture assessment' },
      { status: 500 }
    );
  }
}
