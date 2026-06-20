import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface CreateAPIKeyRequest {
  name: string;
  scopes: string[];
  expires_in?: number;
  description?: string;
}

interface CreateAPIKeyResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  expires_at?: string;
  description?: string;
}

const VALID_SCOPES = [
  "api_keys:read",
  "api_keys:write",
  "webhooks:read",
  "webhooks:write",
  "integrations:read",
  "integrations:write",
  "threats:read",
  "threats:write",
  "analytics:read",
];

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
          error_description: "Insufficient permissions to create API keys",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateAPIKeyRequest;
    const { name, scopes, expires_in, description } = body;

    // Validate required fields
    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "name and scopes array are required",
        },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 1 || name.length > 255) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "name must be between 1 and 255 characters",
        },
        { status: 400 }
      );
    }

    // Validate scopes
    for (const scope of scopes) {
      if (!VALID_SCOPES.includes(scope)) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: `Invalid scope: ${scope}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate expires_in if provided
    if (expires_in !== undefined) {
      if (typeof expires_in !== "number" || expires_in < 1 || expires_in > 365 * 24 * 60 * 60) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: "expires_in must be between 1 second and 1 year",
          },
          { status: 400 }
        );
      }
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

    // Generate API key
    const keyId = "key_" + crypto.randomBytes(8).toString("hex");
    const keySecret = crypto.randomBytes(32).toString("hex");
    const fullKey = `sk_live_${keySecret.substring(0, 32)}`;
    const keyPrefix = fullKey.substring(0, 24); // Expose first part only

    // Calculate expiry
    const createdAt = new Date();
    const expiresAt = expires_in
      ? new Date(createdAt.getTime() + expires_in * 1000)
      : undefined;

    // In production: store in database
    // INSERT INTO api_keys (id, user_id, name, key_hash, scopes, created_at, expires_at, description)
    // VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    const response: CreateAPIKeyResponse = {
      id: keyId,
      name,
      key: fullKey,
      key_prefix: keyPrefix,
      scopes,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt?.toISOString(),
      description,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
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
