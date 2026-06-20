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
      automationLevel,
      scripts,
      triggers,
      onSuccess,
      onFailure,
      maxRetries = 3,
      timeout = 300000,
      tags,
      isPublished = true,
      metadata,
    } = await req.json();

    if (!title || !category || !automationLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO runbooks
       (title, content, category, automation_level, scripts, triggers,
        on_success, on_failure, max_retries, timeout, tags, created_by, is_published, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        title,
        content,
        category,
        automationLevel,
        JSON.stringify(scripts || []),
        JSON.stringify(triggers || []),
        onSuccess,
        onFailure,
        maxRetries,
        timeout,
        tags || [],
        session.user.email,
        isPublished,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      runbook: result.rows[0],
    });
  } catch (error) {
    console.error('Runbook creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create runbook' },
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
    const automationLevel = searchParams.get('automationLevel');
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

    if (automationLevel) {
      filterQuery += ` AND automation_level = $${params.length + 1}`;
      params.push(automationLevel);
    }

    const result = await query(
      `SELECT * FROM runbooks ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      runbooks: result.rows,
    });
  } catch (error) {
    console.error('Runbooks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch runbooks' },
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
      title,
      content,
      scripts,
      triggers,
      isPublished,
      tags,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE runbooks
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           scripts = COALESCE($3, scripts),
           triggers = COALESCE($4, triggers),
           is_published = COALESCE($5, is_published),
           tags = COALESCE($6, tags),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title || null,
        content || null,
        scripts ? JSON.stringify(scripts) : null,
        triggers ? JSON.stringify(triggers) : null,
        isPublished !== undefined ? isPublished : null,
        tags || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Runbook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      runbook: result.rows[0],
    });
  } catch (error) {
    console.error('Runbook update error:', error);
    return NextResponse.json(
      { error: 'Failed to update runbook' },
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
      'DELETE FROM runbooks WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Runbook deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete runbook' },
      { status: 500 }
    );
  }
}
