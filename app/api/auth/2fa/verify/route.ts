import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { twoFactorService } from '@/lib/auth/2fa';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token, secret } = await request.json();

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = await twoFactorService.verifyToken(secret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
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

    // Enable 2FA for user
    await twoFactorService.enableTwoFactor(userId, secret);

    return NextResponse.json({
      message: '2FA enabled successfully',
      enabled: true,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    );
  }
}
