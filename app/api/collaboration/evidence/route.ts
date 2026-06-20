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
      title,
      description,
      evidenceType,
      url,
      filePath,
      fileHash,
      fileSize,
      mimeType,
      tags,
    } = await req.json();

    if (!incidentId || !title || !evidenceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO evidence
       (incident_id, title, description, evidence_type, url, file_path,
        file_hash, file_size, mime_type, uploaded_by, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        incidentId,
        title,
        description,
        evidenceType,
        url,
        filePath,
        fileHash,
        fileSize,
        mimeType,
        session.user.email,
        tags || [],
      ]
    );

    return NextResponse.json({
      success: true,
      evidence: result.rows[0],
    });
  } catch (error) {
    console.error('Evidence creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create evidence' },
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
    const evidenceType = searchParams.get('evidenceType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Missing incidentId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE incident_id = $1';
    const params: any[] = [incidentId];

    if (evidenceType) {
      filterQuery += ` AND evidence_type = $${params.length + 1}`;
      params.push(evidenceType);
    }

    const result = await query(
      `SELECT * FROM evidence ${filterQuery}
       ORDER BY uploaded_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    return NextResponse.json({
      success: true,
      evidence: result.rows,
    });
  } catch (error) {
    console.error('Evidence fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
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

    const { id, title, description, tags } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE evidence
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           tags = COALESCE($3, tags),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title || null, description || null, tags || null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evidence: result.rows[0],
    });
  } catch (error) {
    console.error('Evidence update error:', error);
    return NextResponse.json(
      { error: 'Failed to update evidence' },
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
      'DELETE FROM evidence WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Evidence deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete evidence' },
      { status: 500 }
    );
  }
}
