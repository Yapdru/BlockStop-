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
      entryType,
      entryValue,
      reason,
      expiresAt,
      enabled = true,
    } = await req.json();

    if (!userId || !entryType || !entryValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO whitelist_entries
       (user_id, entry_type, entry_value, reason, enabled, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, entryType, entryValue, reason, enabled, expiresAt || null, session.user.email]
    );

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
    });
  } catch (error) {
    console.error('Whitelist creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create whitelist entry' },
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
    const entryType = searchParams.get('entryType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (entryType) {
      filterQuery += ` AND entry_type = $${params.length + 1}`;
      params.push(entryType);
    }

    filterQuery += ` AND (expires_at IS NULL OR expires_at > NOW())`;

    const result = await query(
      `SELECT * FROM whitelist_entries ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      entries: result.rows,
    });
  } catch (error) {
    console.error('Whitelist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whitelist entries' },
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

    const { id, enabled, expiresAt, reason } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE whitelist_entries
       SET enabled = COALESCE($1, enabled),
           expires_at = COALESCE($2, expires_at),
           reason = COALESCE($3, reason),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [enabled !== undefined ? enabled : null, expiresAt || null, reason || null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
    });
  } catch (error) {
    console.error('Whitelist update error:', error);
    return NextResponse.json(
      { error: 'Failed to update whitelist entry' },
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
      'DELETE FROM whitelist_entries WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Whitelist deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete whitelist entry' },
      { status: 500 }
    );
  }
}
