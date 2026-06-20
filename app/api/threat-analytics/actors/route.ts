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
      actorName,
      actorType,
      threatLevel,
      description,
      knownTechniques,
      knownIps,
      knownDomains,
      tactics,
    } = await req.json();

    if (!actorName || !actorType || !threatLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO threat_actors
       (actor_name, actor_type, threat_level, description, known_techniques,
        known_ips, known_domains, tactics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        actorName,
        actorType,
        threatLevel,
        description,
        knownTechniques || [],
        knownIps || [],
        knownDomains || [],
        tactics || [],
      ]
    );

    return NextResponse.json({
      success: true,
      actor: result.rows[0],
    });
  } catch (error) {
    console.error('Actor creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create actor' },
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
    const threatLevel = searchParams.get('threatLevel');
    const actorType = searchParams.get('actorType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (threatLevel) {
      filterQuery += ` AND threat_level = $${params.length + 1}`;
      params.push(threatLevel);
    }

    if (actorType) {
      filterQuery += ` AND actor_type = $${params.length + 1}`;
      params.push(actorType);
    }

    const result = await query(
      `SELECT * FROM threat_actors ${filterQuery}
       ORDER BY last_activity DESC, total_incidents DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      actors: result.rows,
    });
  } catch (error) {
    console.error('Actors fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actors' },
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

    const { id, lastActivity, totalIncidents, tactics } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE threat_actors
       SET last_activity = COALESCE($1, last_activity),
           total_incidents = COALESCE($2, total_incidents),
           tactics = COALESCE($3, tactics),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [lastActivity || null, totalIncidents || null, tactics || null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Actor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      actor: result.rows[0],
    });
  } catch (error) {
    console.error('Actor update error:', error);
    return NextResponse.json(
      { error: 'Failed to update actor' },
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
      'DELETE FROM threat_actors WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Actor deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete actor' },
      { status: 500 }
    );
  }
}
