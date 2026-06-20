import { NextRequest, NextResponse } from "next/server";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  last_triggered_at?: string;
  description?: string;
  headers?: Record<string, string>;
}

interface ListWebhooksResponse {
  webhooks: Webhook[];
  total: number;
  limit: number;
  offset: number;
}

const VALID_EVENTS = [
  "threat.detected",
  "threat.resolved",
  "file.scanned",
  "email.checked",
  "integration.connected",
  "integration.disconnected",
  "api_key.created",
  "api_key.revoked",
];

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

    const token = authHeader.substring(7);

    // Verify token has required scope
    if (!hasScope(token, "webhooks:read")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to list webhooks",
        },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const active = searchParams.get("active");

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
    // SELECT * FROM webhooks WHERE user_id = ? AND (? IS NULL OR active = ?)
    const mockWebhooks: Webhook[] = [
      {
        id: "wh_1",
        url: "https://example.com/webhooks/threats",
        events: ["threat.detected", "threat.resolved"],
        active: true,
        created_at: "2024-01-15T10:30:00Z",
        last_triggered_at: "2024-06-18T14:20:00Z",
        description: "Main threat detection webhook",
        headers: { "X-Custom-Header": "value" },
      },
      {
        id: "wh_2",
        url: "https://example.com/webhooks/files",
        events: ["file.scanned"],
        active: true,
        created_at: "2024-02-20T08:15:00Z",
        description: "File scan results",
      },
    ];

    let filtered = mockWebhooks;
    if (active !== null) {
      filtered = mockWebhooks.filter(
        (w) => w.active === (active === "true")
      );
    }

    const response: ListWebhooksResponse = {
      webhooks: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=0",
        "X-Total-Count": String(filtered.length),
      },
    });
  } catch (error) {
    console.error("Error listing webhooks:", error);
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
  return token.length > 0;
}

function getUserIdFromToken(token: string): string | null {
  if (token.length > 0) {
    return "user_123";
  }
  return null;
}

export { VALID_EVENTS };
