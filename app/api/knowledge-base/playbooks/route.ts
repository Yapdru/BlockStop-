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
      title,
      content,
      category,
      steps,
      estimatedTime,
      difficulty,
      prerequisites,
      successCriteria,
      tags,
      isPublished = true,
      metadata,
    } = await req.json();

    if (!title || !category || !steps) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO playbooks
       (title, content, category, steps, estimated_time, difficulty,
        prerequisites, success_criteria, tags, created_by, is_published, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        title,
        content,
        category,
        JSON.stringify(steps),
        estimatedTime,
        difficulty,
        prerequisites || [],
        JSON.stringify(successCriteria || []),
        tags || [],
        session.user.email,
        isPublished,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      playbook: result.rows[0],
    });
  } catch (error) {
    console.error('Playbook creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create playbook' },
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
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const isPublished = searchParams.get('isPublished');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (isPublished !== null) {
      filterQuery += ` AND is_published = $${params.length + 1}`;
      params.push(isPublished === 'true');
    }

    if (category) {
      filterQuery += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (difficulty) {
      filterQuery += ` AND difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }

    const result = await query(
      `SELECT * FROM playbooks ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      playbooks: result.rows,
    });
  } catch (error) {
    console.error('Playbooks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks' },
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

    const { id, title, content, steps, isPublished, tags } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE playbooks
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           steps = COALESCE($3, steps),
           is_published = COALESCE($4, is_published),
           tags = COALESCE($5, tags),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        title || null,
        content || null,
        steps ? JSON.stringify(steps) : null,
        isPublished !== undefined ? isPublished : null,
        tags || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      playbook: result.rows[0],
    });
  } catch (error) {
    console.error('Playbook update error:', error);
    return NextResponse.json(
      { error: 'Failed to update playbook' },
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
      'DELETE FROM playbooks WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Playbook deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playbook' },
      { status: 500 }
    );
  }
}
