import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { wifiChecker } from '@/lib/wifi/wifi-checker';
import { requireTierFeature } from '@/lib/tiers/tier-guard';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Check if user has access to WiFi scanner
    await requireTierFeature(userId, 'wifiChecker');

    // Scan networks
    const networks = await wifiChecker.scanNetworks();

    return NextResponse.json({
      networks,
      scanTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('WiFi scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'WiFi scan failed' },
      { status: 400 }
    );
  }
}
