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
      framework,
      complianceScore,
      status,
      checkedAt,
      findings,
      metadata,
    } = await req.json();

    if (!userId || !framework || complianceScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO compliance_reports
       (user_id, framework, compliance_score, status, checked_at, findings, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        framework,
        complianceScore,
        status || 'pending',
        checkedAt || new Date(),
        JSON.stringify(findings || {}),
        JSON.stringify(metadata || {}),
      ]
    );

    return NextResponse.json({
      success: true,
      report: result.rows[0],
    });
  } catch (error) {
    console.error('Compliance report creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create compliance report' },
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
    const framework = searchParams.get('framework');
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

    if (framework) {
      filterQuery += ` AND framework = $${params.length + 1}`;
      params.push(framework);
    }

    const result = await query(
      `SELECT * FROM compliance_reports ${filterQuery}
       ORDER BY checked_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      reports: result.rows,
    });
  } catch (error) {
    console.error('Compliance reports fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance reports' },
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

    const { id, status, complianceScore, findings } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE compliance_reports
       SET status = COALESCE($1, status),
           compliance_score = COALESCE($2, compliance_score),
           findings = COALESCE($3, findings),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        status || null,
        complianceScore || null,
        findings ? JSON.stringify(findings) : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.rows[0],
    });
  } catch (error) {
    console.error('Compliance report update error:', error);
    return NextResponse.json(
      { error: 'Failed to update compliance report' },
      { status: 500 }
    );
  }
}
