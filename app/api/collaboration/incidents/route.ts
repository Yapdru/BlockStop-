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
      incidentNumber,
      title,
      description,
      severity,
      threatType,
      sourceIp,
      affectedSystems,
      assignedTo,
      metadata,
    } = await req.json();

    if (!incidentNumber || !title || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO incidents
       (incident_number, title, description, severity, threat_type,
        source_ip, affected_systems, created_by, assigned_to, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        incidentNumber,
        title,
        description,
        severity,
        threatType,
        sourceIp,
        affectedSystems || [],
        session.user.email,
        assignedTo,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      incident: result.rows[0],
    });
  } catch (error) {
    console.error('Incident creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create incident' },
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
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      filterQuery += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (severity) {
      filterQuery += ` AND severity = $${params.length + 1}`;
      params.push(severity);
    }

    const result = await query(
      `SELECT * FROM incidents ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      incidents: result.rows,
    });
  } catch (error) {
    console.error('Incidents fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
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

    const { id, status, assignedTo, severity } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const closedAt = status === 'closed' ? new Date() : null;

    const result = await query(
      `UPDATE incidents
       SET status = COALESCE($1, status),
           assigned_to = COALESCE($2, assigned_to),
           severity = COALESCE($3, severity),
           closed_at = COALESCE($4, closed_at),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status || null, assignedTo || null, severity || null, closedAt, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      incident: result.rows[0],
    });
  } catch (error) {
    console.error('Incident update error:', error);
    return NextResponse.json(
      { error: 'Failed to update incident' },
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
      'DELETE FROM incidents WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Incident deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    );
  }
}
