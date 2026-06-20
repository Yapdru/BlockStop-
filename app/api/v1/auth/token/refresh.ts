import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface RefreshRequest {
  refresh_token: string;
  grant_type?: string;
}

interface RefreshResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// In-memory refresh token store (use database in production)
const REFRESH_TOKENS = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
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

    const body = (await request.json()) as RefreshRequest;
    const { refresh_token, grant_type } = body;

    // Validate parameters
    if (!refresh_token) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "refresh_token is required",
        },
        { status: 400 }
      );
    }

    if (grant_type && grant_type !== "refresh_token") {
      return NextResponse.json(
        {
          error: "unsupported_grant_type",
          error_description: "Only 'refresh_token' grant type is supported",
        },
        { status: 400 }
      );
    }

    // Validate refresh token
    const tokenData = REFRESH_TOKENS.get(refresh_token);
    if (!tokenData) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Refresh token is invalid or expired",
        },
        { status: 401 }
      );
    }

    // Check expiry
    if (tokenData.expires_at < Date.now()) {
      REFRESH_TOKENS.delete(refresh_token);
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: "Refresh token has expired",
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = crypto.randomBytes(32).toString("hex");
    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    // Store new refresh token
    REFRESH_TOKENS.set(newRefreshToken, {
      user_id: tokenData.user_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      created_at: Date.now(),
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Invalidate old refresh token
    REFRESH_TOKENS.delete(refresh_token);

    const response: RefreshResponse = {
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: tokenData.scope || "default",
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export { REFRESH_TOKENS };
