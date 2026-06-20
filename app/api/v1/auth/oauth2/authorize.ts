import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface AuthorizeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: "code" | "token";
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
}

interface StoredAuthState {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: string;
  created_at: number;
}

const AUTH_STATES = new Map<string, StoredAuthState>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const client_id = searchParams.get("client_id");
    const redirect_uri = searchParams.get("redirect_uri");
    const response_type = searchParams.get("response_type");
    const scope = searchParams.get("scope") || "default";
    const state = searchParams.get("state");
    const code_challenge = searchParams.get("code_challenge");
    const code_challenge_method = searchParams.get("code_challenge_method");

    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Validate response_type
    if (response_type !== "code" && response_type !== "token") {
      return NextResponse.json(
        {
          error: "unsupported_response_type",
          error_description: "Only 'code' and 'token' are supported",
        },
        { status: 400 }
      );
    }

    // Validate redirect_uri format
    try {
      new URL(redirect_uri);
    } catch {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Invalid redirect_uri format",
        },
        { status: 400 }
      );
    }

    // Generate authorization code
    const authorization_code = crypto.randomBytes(32).toString("hex");
    const code_state = state || crypto.randomBytes(16).toString("hex");

    // Store authorization state (in production, use database)
    AUTH_STATES.set(authorization_code, {
      client_id,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method,
      created_at: Date.now(),
    });

    // Cleanup old states (5 minute expiry)
    const now = Date.now();
    for (const [key, value] of AUTH_STATES.entries()) {
      if (now - value.created_at > 5 * 60 * 1000) {
        AUTH_STATES.delete(key);
      }
    }

    if (response_type === "token") {
      // Implicit flow
      const token = crypto.randomBytes(32).toString("hex");
      const fragment = new URLSearchParams({
        access_token: token,
        token_type: "Bearer",
        expires_in: "3600",
        ...(state && { state }),
      });
      return NextResponse.redirect(
        `${redirect_uri}#${fragment.toString()}`
      );
    } else {
      // Authorization code flow
      const params = new URLSearchParams({
        code: authorization_code,
        ...(state && { state: code_state }),
      });
      return NextResponse.redirect(
        `${redirect_uri}?${params.toString()}`
      );
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export { AUTH_STATES };
