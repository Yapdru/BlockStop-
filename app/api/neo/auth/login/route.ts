import { NextRequest, NextResponse } from 'next/server';
import { loginWithPassword, loginWithGoogle } from '@/lib/neo/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { email, password, googleId, authMethod } = await req.json();

    if (!authMethod) {
      return NextResponse.json(
        { error: 'Auth method is required' },
        { status: 400 }
      );
    }

    let result;

    if (authMethod === 'password') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      result = await loginWithPassword(email, password);
    } else if (authMethod === 'google') {
      if (!googleId) {
        return NextResponse.json(
          { error: 'Google ID is required' },
          { status: 400 }
        );
      }
      result = await loginWithGoogle(googleId);
    } else {
      return NextResponse.json(
        { error: 'Unsupported auth method' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      user: result.user,
      sessionToken: result.token.sessionToken
    });

    response.cookies.set('session', result.token.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}
