import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { twoFactorService } from '@/lib/auth/2fa';
import { authService } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
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
    const { secret, token } = body;

    // Validate inputs
    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret and token are required' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = await twoFactorService.verifyToken(secret, token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid TOTP token' },
        { status: 401 }
      );
    }

    // Enable 2FA and get backup codes
    const backupCodes = await twoFactorService.enableTwoFactor(user.id, secret);

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        enabled: true,
        backupCodes,
        message: 'Save these backup codes in a secure place. Each code can only be used once.',
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
