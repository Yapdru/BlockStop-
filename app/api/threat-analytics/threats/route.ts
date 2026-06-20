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
      destinationIp,
      sourcePort,
      destinationPort,
      protocol,
      processId,
      filePath,
      registryPath,
      description,
      metadata,
      userId,
    } = await req.json();

    if (!threatId || !threatType || !severity || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO threats
       (threat_id, threat_type, severity, source_ip, destination_ip,
        source_port, destination_port, protocol, process_id, file_path,
        registry_path, description, detection_timestamp, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14)
       RETURNING *`,
      [
        threatId,
        threatType,
        severity,
        sourceIp,
        destinationIp,
        sourcePort,
        destinationPort,
        protocol,
        processId,
        filePath,
        registryPath,
        description,
        userId,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      threat: result.rows[0],
    });
  } catch (error) {
    console.error('Threat creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create threat' },
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
    const threatType = searchParams.get('threatType');
    const severity = searchParams.get('severity');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (threatType) {
      filterQuery += ` AND threat_type = $${params.length + 1}`;
      params.push(threatType);
    }

    if (severity) {
      filterQuery += ` AND severity = $${params.length + 1}`;
      params.push(severity);
    }

    const result = await query(
      `SELECT * FROM threats ${filterQuery}
       ORDER BY detection_timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      threats: result.rows,
    });
  } catch (error) {
    console.error('Threats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threats' },
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

    const { id, analyzed_at, metadata } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE threats
       SET analyzed_at = COALESCE($1, analyzed_at),
           metadata = COALESCE($2, metadata)
       WHERE id = $3
       RETURNING *`,
      [analyzed_at || null, metadata ? JSON.stringify(metadata) : null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Threat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      threat: result.rows[0],
    });
  } catch (error) {
    console.error('Threat update error:', error);
    return NextResponse.json(
      { error: 'Failed to update threat' },
      { status: 500 }
    );
  }
}
