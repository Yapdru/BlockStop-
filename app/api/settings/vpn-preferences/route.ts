import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { query } from '@/lib/db';
import { authService } from '@/lib/auth/auth-service';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user info
    const user = await authService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's VPN preferences
    const result = await query(
      `SELECT id, vpn_provider as "vpnProvider", is_preferred as "isPreferred", protocol
       FROM vpn_preferences
       WHERE user_id = $1
       ORDER BY is_preferred DESC, vpn_provider ASC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get VPN preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VPN preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user info
    const user = await authService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { vpnProvider, isPreferred, protocol } = body;

    // Validate input
    if (!vpnProvider || typeof vpnProvider !== 'string') {
      return NextResponse.json(
        { error: 'Valid VPN provider is required' },
        { status: 400 }
      );
    }

    // Check if preference exists
    const existing = await query(
      `SELECT id FROM vpn_preferences WHERE user_id = $1 AND vpn_provider = $2`,
      [user.id, vpnProvider]
    );

    if (existing.rows.length > 0) {
      // Update existing preference
      await query(
        `UPDATE vpn_preferences
         SET is_preferred = $1, protocol = $2, updated_at = NOW()
         WHERE user_id = $3 AND vpn_provider = $4`,
        [isPreferred, protocol, user.id, vpnProvider]
      );
    } else {
      // Insert new preference
      await query(
        `INSERT INTO vpn_preferences (user_id, vpn_provider, is_preferred, protocol)
         VALUES ($1, $2, $3, $4)`,
        [user.id, vpnProvider, isPreferred, protocol]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'VPN preference updated',
      data: { vpnProvider, isPreferred, protocol },
    });
  } catch (error) {
    console.error('Update VPN preference error:', error);
    return NextResponse.json(
      { error: 'Failed to update VPN preference' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user info
    const user = await authService.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { vpnProvider } = body;

    // Validate input
    if (!vpnProvider) {
      return NextResponse.json(
        { error: 'VPN provider is required' },
        { status: 400 }
      );
    }

    // Delete preference
    await query(
      `DELETE FROM vpn_preferences WHERE user_id = $1 AND vpn_provider = $2`,
      [user.id, vpnProvider]
    );

    return NextResponse.json({
      success: true,
      message: 'VPN preference removed',
    });
  } catch (error) {
    console.error('Delete VPN preference error:', error);
    return NextResponse.json(
      { error: 'Failed to remove VPN preference' },
      { status: 500 }
    );
  }
}
