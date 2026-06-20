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
      chainName,
      description,
      phaseSequence,
      threatActorId,
      successRate,
      metadata,
    } = await req.json();

    if (!chainName || !phaseSequence || !Array.isArray(phaseSequence)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO attack_chains
       (chain_name, description, phase_sequence, threat_actor_id, success_rate, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        chainName,
        description,
        phaseSequence,
        threatActorId || null,
        successRate || null,
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      chain: result.rows[0],
    });
  } catch (error) {
    console.error('Chain creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create attack chain' },
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
    const threatActorId = searchParams.get('threatActorId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let filterQuery = 'WHERE 1=1';
    const params: any[] = [];

    if (threatActorId) {
      filterQuery += ` AND threat_actor_id = $${params.length + 1}`;
      params.push(threatActorId);
    }

    const result = await query(
      `SELECT * FROM attack_chains ${filterQuery}
       ORDER BY last_observed DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      chains: result.rows,
    });
  } catch (error) {
    console.error('Chains fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attack chains' },
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

    const { id, lastObserved, totalAttacks, successRate, metadata } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE attack_chains
       SET last_observed = COALESCE($1, last_observed),
           total_attacks = COALESCE($2, total_attacks),
           success_rate = COALESCE($3, success_rate),
           metadata = COALESCE($4, metadata),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        lastObserved || null,
        totalAttacks || null,
        successRate || null,
        metadata ? JSON.stringify(metadata) : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Chain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chain: result.rows[0],
    });
  } catch (error) {
    console.error('Chain update error:', error);
    return NextResponse.json(
      { error: 'Failed to update attack chain' },
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
      'DELETE FROM attack_chains WHERE id = $1',
      [id]
    );

    return NextResponse.json({
      success: true,
      deleted: result.rowCount,
    });
  } catch (error) {
    console.error('Chain deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete attack chain' },
      { status: 500 }
    );
  }
}
