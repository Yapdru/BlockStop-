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
      incidentId,
      channelId,
      content,
      mentions,
      attachments,
      threadId,
      metadata,
    } = await req.json();

    if (!incidentId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO chat_messages
       (incident_id, channel_id, user_id, username, content, mentions, attachments, thread_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        incidentId,
        channelId || 'general',
        session.user.email,
        session.user.name || session.user.email,
        content,
        mentions || [],
        attachments || [],
        threadId || null,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      message: result.rows[0],
    });
  } catch (error) {
    console.error('Chat message creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
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
    const incidentId = searchParams.get('incidentId');
    const channelId = searchParams.get('channelId');
    const threadId = searchParams.get('threadId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Missing incidentId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE incident_id = $1';
    const params: any[] = [incidentId];

    if (channelId) {
      filterQuery += ` AND channel_id = $${params.length + 1}`;
      params.push(channelId);
    }

    if (threadId) {
      filterQuery += ` AND (thread_id = $${params.length + 1} OR id = $${params.length + 1})`;
      params.push(threadId);
    }

    const result = await query(
      `SELECT * FROM chat_messages ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      messages: result.rows,
    });
  } catch (error) {
    console.error('Chat messages fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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

    const { id, content, mentions } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE chat_messages
       SET content = COALESCE($1, content),
           mentions = COALESCE($2, mentions),
           edited_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [content || null, mentions || null, id, session.user.email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.rows[0],
    });
  } catch (error) {
    console.error('Chat message update error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
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
      'DELETE FROM chat_messages WHERE id = $1 AND user_id = $2',
      [id, session.user.email]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Chat message deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
