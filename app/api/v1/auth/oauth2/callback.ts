import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface CallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // Handle error response
    if (error) {
      return NextResponse.json(
        {
          error,
          error_description:
            error_description || "Authorization failed",
          state,
        },
        { status: 400 }
      );
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Authorization code is required",
        },
        { status: 400 }
      );
    }

    // Validate state parameter if provided
    if (state) {
      const isValidState = validateState(state);
      if (!isValidState) {
        return NextResponse.json(
          {
            error: "invalid_state",
            error_description: "State parameter validation failed",
          },
          { status: 400 }
        );
      }
    }

    // Process the authorization code
    const tokenResponse = await exchangeCodeForToken(code, state);

    // Return session information
    return NextResponse.json(
      {
        success: true,
        access_token: tokenResponse.access_token,
        token_type: "Bearer",
        expires_in: tokenResponse.expires_in,
        state,
        user: {
          id: tokenResponse.user_id,
          email: tokenResponse.email,
          name: tokenResponse.name,
        },
      },
      {
        headers: {
          "Set-Cookie": `session_token=${tokenResponse.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        },
      }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred during callback processing",
      },
      { status: 500 }
    );
  }
}

async function exchangeCodeForToken(code: string, state?: string) {
  // In production, exchange authorization code for access token
  // This would typically involve:
  // 1. Verify authorization code hasn't expired
  // 2. Verify code is still valid and hasn't been used
  // 3. Look up user associated with this authorization
  // 4. Generate new access token
  // 5. Update database

  return {
    access_token: crypto.randomBytes(32).toString("hex"),
    token_type: "Bearer",
    expires_in: 3600,
    user_id: crypto.randomBytes(8).toString("hex"),
    email: "user@example.com",
    name: "Example User",
  };
}

function validateState(state: string): boolean {
  // In production, verify state token against session store
  // State tokens should be:
  // 1. Cryptographically secure random values
  // 2. Stored in user session
  // 3. Checked for expiry
  // 4. Compared against incoming state parameter
  return state.length > 0;
}
