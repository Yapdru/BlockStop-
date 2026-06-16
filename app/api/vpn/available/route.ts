import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { vpnManager } from '@/lib/vpn/vpn-manager';
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

    // Get user and their tier
    const userResult = await query(
      `SELECT u.id, p.name FROM users u
       JOIN plans p ON u.plan_id = p.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userTier = userResult.rows[0].name as 'free' | 'pro';
    const vpns = await vpnManager.getAvailableVPNs(userTier);

    return NextResponse.json({
      vpns,
      tier: userTier,
      count: vpns.length,
    });
  } catch (error) {
    console.error('VPN fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VPNs' },
      { status: 500 }
    );
  }
}
