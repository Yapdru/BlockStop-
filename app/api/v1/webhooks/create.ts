import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface CreateWebhookRequest {
  url: string;
  events: string[];
  description?: string;
  headers?: Record<string, string>;
  active?: boolean;
}

interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  signing_secret?: string;
  description?: string;
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
    if (!hasScope(token, "webhooks:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to create webhooks",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateWebhookRequest;
    const { url, events, description, headers, active } = body;

    // Validate required fields
    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "url and events array are required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Invalid webhook URL format",
        },
        { status: 400 }
      );
    }

    // Validate events
    if (events.length === 0) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "At least one event is required",
        },
        { status: 400 }
      );
    }

    for (const event of events) {
      if (!VALID_EVENTS.includes(event)) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: `Invalid event: ${event}`,
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

    // Validate custom headers
    if (headers) {
      if (typeof headers !== "object" || Array.isArray(headers)) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: "headers must be an object",
          },
          { status: 400 }
        );
      }
    }

    // Generate webhook ID and signing secret
    const webhookId = "wh_" + crypto.randomBytes(8).toString("hex");
    const signingSecret = crypto.randomBytes(32).toString("hex");

    const createdAt = new Date().toISOString();

    // In production: store in database
    // INSERT INTO webhooks (id, user_id, url, events, created_at, signing_secret, description, headers, active)

    const response: WebhookResponse = {
      id: webhookId,
      url,
      events,
      active: active !== false,
      created_at: createdAt,
      signing_secret: signingSecret,
      description,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
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
