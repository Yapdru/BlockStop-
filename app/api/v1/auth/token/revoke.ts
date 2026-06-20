import { NextRequest, NextResponse } from "next/server";

interface RevokeRequest {
  token: string;
  token_type_hint?: "access_token" | "refresh_token";
}

// In-memory revocation list (use database in production)
const REVOKED_TOKENS = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    // Verify bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Bearer token required",
        },
        { status: 401 }
      );
    }

    const currentToken = authHeader.substring(7);

    const body = (await request.json()) as RevokeRequest;
    const { token, token_type_hint } = body;

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "token is required",
        },
        { status: 400 }
      );
    }

    // Verify that user can only revoke their own tokens
    if (!canUserRevokeToken(currentToken, token)) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "You cannot revoke this token",
        },
        { status: 403 }
      );
    }

    // Add token to revocation list
    REVOKED_TOKENS.add(token);

    // In production:
    // 1. Add to database revocation list
    // 2. Invalidate any cached sessions
    // 3. Notify any connected clients
    // 4. Log revocation event for audit

    return NextResponse.json(
      {
        success: true,
        message: "Token revoked successfully",
        revoked_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Alternative to POST for revocation (RESTful)
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "token query parameter is required",
        },
        { status: 400 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Bearer token required",
        },
        { status: 401 }
      );
    }

    const currentToken = authHeader.substring(7);

    if (!canUserRevokeToken(currentToken, token)) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "You cannot revoke this token",
        },
        { status: 403 }
      );
    }

    REVOKED_TOKENS.add(token);

    return NextResponse.json(
      {
        success: true,
        message: "Token revoked successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token revocation error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

function canUserRevokeToken(currentToken: string, tokenToRevoke: string): boolean {
  // In production, verify:
  // 1. Current token is valid and not revoked
  // 2. Token to revoke belongs to same user as current token
  // 3. User has permission to manage tokens
  return currentToken.length > 0 && tokenToRevoke.length > 0;
}

export { REVOKED_TOKENS };
