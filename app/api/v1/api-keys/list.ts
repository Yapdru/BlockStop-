import { NextRequest, NextResponse } from "next/server";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

interface ListAPIKeysResponse {
  keys: APIKey[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(request: NextRequest) {
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

    // Verify token has required scope
    const token = authHeader.substring(7);
    if (!hasScope(token, "api_keys:read")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to list API keys",
        },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

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

    // In production: fetch from database
    // SELECT * FROM api_keys WHERE user_id = ? LIMIT ? OFFSET ?
    const mockKeys: APIKey[] = [
      {
        id: "key_1",
        name: "Production Integration",
        key_prefix: "sk_live_4eC39HqLyjWDarh",
        scopes: ["api_keys:read", "webhooks:write"],
        created_at: "2024-01-15T10:30:00Z",
        last_used_at: "2024-06-18T14:20:00Z",
        expires_at: "2025-01-15T10:30:00Z",
      },
      {
        id: "key_2",
        name: "Development",
        key_prefix: "sk_test_51JQrJ7Eo",
        scopes: ["api_keys:read"],
        created_at: "2024-02-20T08:15:00Z",
      },
    ];

    const response: ListAPIKeysResponse = {
      keys: mockKeys.slice(offset, offset + limit),
      total: mockKeys.length,
      limit,
      offset,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=0",
        "X-Total-Count": String(mockKeys.length),
      },
    });
  } catch (error) {
    console.error("Error listing API keys:", error);
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
