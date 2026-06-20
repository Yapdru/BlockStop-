import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface TokenRequest {
  grant_type: string;
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  code_verifier?: string;
  refresh_token?: string;
  username?: string;
  password?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

// In-memory token storage (use database in production)
const TOKENS_ISSUED = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TokenRequest;

    const { grant_type, code, redirect_uri, client_id, client_secret } = body;

    // Validate required fields
    if (!grant_type || !client_id || !client_secret) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    // Validate client credentials (in production, check against database)
    const isValidClient = validateClientCredentials(client_id, client_secret);
    if (!isValidClient) {
      return NextResponse.json(
        {
          error: "invalid_client",
          error_description: "Client authentication failed",
        },
        { status: 401 }
      );
    }

    let tokenResponse: TokenResponse;

    switch (grant_type) {
      case "authorization_code":
        if (!code || !redirect_uri) {
          return NextResponse.json(
            {
              error: "invalid_request",
              error_description: "Missing code or redirect_uri",
            },
            { status: 400 }
          );
        }
        tokenResponse = await handleAuthorizationCodeFlow(
          code,
          redirect_uri,
          client_id,
          body.code_verifier
        );
        break;

      case "refresh_token":
        if (!body.refresh_token) {
          return NextResponse.json(
            {
              error: "invalid_request",
              error_description: "Missing refresh_token",
            },
            { status: 400 }
          );
        }
        tokenResponse = await handleRefreshTokenFlow(
          body.refresh_token,
          client_id
        );
        break;

      case "client_credentials":
        tokenResponse = await handleClientCredentialsFlow(client_id);
        break;

      case "password":
        if (!body.username || !body.password) {
          return NextResponse.json(
            {
              error: "invalid_request",
              error_description: "Missing username or password",
            },
            { status: 400 }
          );
        }
        tokenResponse = await handlePasswordFlow(
          body.username,
          body.password,
          client_id
        );
        break;

      default:
        return NextResponse.json(
          {
            error: "unsupported_grant_type",
            error_description: `Grant type '${grant_type}' is not supported`,
          },
          { status: 400 }
        );
    }

    TOKENS_ISSUED.set(tokenResponse.access_token, {
      client_id,
      scope: tokenResponse.scope,
      created_at: Date.now(),
      expires_at: Date.now() + tokenResponse.expires_in * 1000,
    });

    return NextResponse.json(tokenResponse, {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Token error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

async function handleAuthorizationCodeFlow(
  code: string,
  redirect_uri: string,
  client_id: string,
  code_verifier?: string
): Promise<TokenResponse> {
  // In production, verify code against database and validate PKCE if present
  const access_token = crypto.randomBytes(32).toString("hex");
  const refresh_token = crypto.randomBytes(32).toString("hex");

  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token,
    scope: "default",
  };
}

async function handleRefreshTokenFlow(
  refresh_token: string,
  client_id: string
): Promise<TokenResponse> {
  // In production, verify refresh_token against database
  const access_token = crypto.randomBytes(32).toString("hex");

  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "default",
  };
}

async function handleClientCredentialsFlow(
  client_id: string
): Promise<TokenResponse> {
  const access_token = crypto.randomBytes(32).toString("hex");

  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: "default",
  };
}

async function handlePasswordFlow(
  username: string,
  password: string,
  client_id: string
): Promise<TokenResponse> {
  // In production, verify credentials against user database
  const access_token = crypto.randomBytes(32).toString("hex");
  const refresh_token = crypto.randomBytes(32).toString("hex");

  return {
    access_token,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token,
    scope: "default",
  };
}

function validateClientCredentials(
  client_id: string,
  client_secret: string
): boolean {
  // In production, verify against database
  return client_id.length > 0 && client_secret.length > 0;
}
