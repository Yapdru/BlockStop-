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
    const { password } = body;

    // Validate password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to disable 2FA' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await authService.validatePassword(user.email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Disable 2FA
    await twoFactorService.disableTwoFactor(user.id);

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled',
      data: { enabled: false },
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
