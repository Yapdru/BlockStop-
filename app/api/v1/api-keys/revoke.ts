import { NextRequest, NextResponse } from "next/server";

interface RevokeAPIKeyRequest {
  key_id: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Bearer token required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token has required scope
    if (!hasScope(token, "api_keys:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to revoke API keys",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as RevokeAPIKeyRequest;
    const { key_id, reason } = body;

    // Validate key_id
    if (!key_id) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "key_id is required",
        },
        { status: 400 }
      );
    }

    // Get user from token
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Verify key belongs to user
    const keyBelongsToUser = await verifyKeyOwnership(userId, key_id);
    if (!keyBelongsToUser) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "You cannot revoke this API key",
        },
        { status: 403 }
      );
    }

    // In production:
    // 1. Mark key as revoked in database
    // 2. Add to revocation list
    // 3. Invalidate any cached access
    // 4. Log revocation event
    // UPDATE api_keys SET revoked = true, revoked_at = NOW(), revoke_reason = ? WHERE id = ?

    const revokedAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        message: "API key revoked successfully",
        key_id,
        revoked_at: revokedAt,
        reason,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking API key:", error);
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
  // Alternative endpoint for revocation using query parameter
  try {
    const { searchParams } = new URL(request.url);
    const key_id = searchParams.get("key_id");

    if (!key_id) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "key_id query parameter is required",
        },
        { status: 400 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Bearer token required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!hasScope(token, "api_keys:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions",
        },
        { status: 403 }
      );
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Invalid token",
        },
        { status: 401 }
      );
    }

    const keyBelongsToUser = await verifyKeyOwnership(userId, key_id);
    if (!keyBelongsToUser) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "You cannot revoke this API key",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "API key revoked successfully",
        key_id,
        revoked_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

function hasScope(token: string, requiredScope: string): boolean {
  // In production: verify token against JWT or database
  return token.length > 0;
}

function getUserIdFromToken(token: string): string | null {
  // In production: decode JWT or look up in session store
  if (token.length > 0) {
    return "user_123";
  }
  return null;
}

async function verifyKeyOwnership(
  userId: string,
  keyId: string
): Promise<boolean> {
  // In production: query database
  // SELECT user_id FROM api_keys WHERE id = ? AND user_id = ?
  return true;
}
