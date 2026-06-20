import { NextRequest, NextResponse } from 'next/server';
import { dataWarehouse } from '@/lib/analytics/data-warehouse';

export async function POST(request: NextRequest) {
  try {
    const { sql, params } = await request.json();

    // Validate input
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // Security: Prevent dangerous operations
    const dangerousOps = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'];
    const upperSql = sql.toUpperCase();

    for (const op of dangerousOps) {
      if (upperSql.includes(op)) {
        return NextResponse.json(
          { error: `Operation ${op} is not allowed` },
          { status: 403 }
        );
      }
    }

    // Execute query
    const result = await dataWarehouse.query(sql, params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Data warehouse query error:', error);
    return NextResponse.json(
      {
        error: 'Query execution failed',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const health = await dataWarehouse.getHealthStatus();

    return NextResponse.json({
      status: 'healthy',
      warehouse: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 503 }
    );
  }
}
