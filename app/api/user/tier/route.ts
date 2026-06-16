import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT p.name as tier FROM users u
       JOIN plans p ON u.plan_id = p.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tier: result.rows[0].tier,
    });
  } catch (error) {
    console.error('Tier fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tier' },
      { status: 500 }
    );
  }
}
