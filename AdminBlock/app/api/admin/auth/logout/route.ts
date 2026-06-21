import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/passcode-auth';

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    await clearSession();

    // Log logout
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    console.log(`[ADMIN AUTH] Logout from IP: ${ip} at ${new Date().toISOString()}`);

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
