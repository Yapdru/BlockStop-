import { NextRequest, NextResponse } from 'next/server';
import { registerWithPassword, registerWithGoogle } from '@/lib/neo/auth-service';

export async function POST(req: NextRequest) {
  try {
    const { email, password, authMethod, googleId } = await req.json();

    if (!email || !authMethod) {
      return NextResponse.json(
        { error: 'Email and authMethod are required' },
        { status: 400 }
      );
    }

    let result;

    if (authMethod === 'password') {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for password auth' },
          { status: 400 }
        );
      }
      result = await registerWithPassword(email, password);
    } else if (authMethod === 'google') {
      if (!googleId) {
        return NextResponse.json(
          { error: 'Google ID is required for Google auth' },
          { status: 400 }
        );
      }
      result = await registerWithGoogle(googleId, email, '');
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
