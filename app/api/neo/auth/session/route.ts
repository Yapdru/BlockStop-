import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserTier } from '@/lib/neo/auth-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // In a real app, validate session token against DB
    // For now, we'll extract userId from a claims header or validate token format
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);
    const tier = await getUserTier(userId);

    return NextResponse.json({
      user,
      tier,
      isAuthenticated: true
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 401 }
    );
  }
}
