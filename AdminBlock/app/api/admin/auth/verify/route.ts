import { NextRequest, NextResponse } from 'next/server';
import { verifyPasscode, setSessionCookie, checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '@/lib/auth/passcode-auth';

const ADMIN_PASSCODE_HASH = process.env.ADMIN_PASSCODE_HASH ||
  '$2a$10$9QFcVKl9SZPnLFMPLu17wOe5hLaE1Ww.R8Pnmn7SrSu/M3pJj2eYu'; // Default hash for "AdHey22@8"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (!passcode) {
      return NextResponse.json(
        { message: 'Passcode is required' },
        { status: 400 }
      );
    }

    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limiting
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: `Account locked. Try again in ${rateLimit.retryAfter} seconds`,
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // Verify passcode
    const isValid = await verifyPasscode(passcode, ADMIN_PASSCODE_HASH);

    if (!isValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { message: 'Invalid passcode' },
        { status: 401 }
      );
    }

    // Clear failed attempts on success
    clearFailedAttempts(ip);

    // Set session cookie
    const token = await setSessionCookie(ip);

    // Log successful authentication
    console.log(`[ADMIN AUTH] Successful login from IP: ${ip} at ${new Date().toISOString()}`);

    return NextResponse.json(
      {
        message: 'Authentication successful',
        token,
        expiresIn: 30 * 60, // 30 minutes
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
