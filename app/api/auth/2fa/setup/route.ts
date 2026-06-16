import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { twoFactorService } from '@/lib/auth/2fa';

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate 2FA secret
    const { secret, qrCode } = await twoFactorService.generateSecret(
      session.user.email
    );

    return NextResponse.json({
      secret,
      qrCode,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: '2FA setup failed' },
      { status: 500 }
    );
  }
}
