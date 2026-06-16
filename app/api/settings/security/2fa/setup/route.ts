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

    // Generate 2FA secret
    const { secret, qrCode } = await twoFactorService.generateSecret(user.email);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode,
        message: 'Scan the QR code with your authenticator app',
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to generate 2FA secret' },
      { status: 500 }
    );
  }
}
