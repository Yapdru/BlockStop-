import { NextRequest, NextResponse } from "next/server";

interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  description?: string;
  headers?: Record<string, string>;
  active?: boolean;
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const webhookId = params.id;

    // Verify token has required scope
    if (!hasScope(token, "webhooks:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to update webhooks",
        },
        { status: 403 }
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

    // Verify webhook exists and belongs to user
    const webhook = await getWebhook(userId, webhookId);
    if (!webhook) {
      return NextResponse.json(
        {
          error: "not_found",
          error_description: "Webhook not found",
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateWebhookRequest;
    const { url, events, description, headers, active } = body;

    // Validate URL if provided
    if (url !== undefined) {
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
    }

    // Validate events if provided
    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: "events must be a non-empty array",
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
    }

    // Validate headers if provided
    if (headers !== undefined) {
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

    // In production: update database
    // UPDATE webhooks SET
    //   url = COALESCE(?, url),
    //   events = COALESCE(?, events),
    //   description = COALESCE(?, description),
    //   headers = COALESCE(?, headers),
    //   active = COALESCE(?, active),
    //   updated_at = NOW()
    // WHERE id = ? AND user_id = ?

    const updatedWebhook = {
      id: webhookId,
      url: url || webhook.url,
      events: events || webhook.events,
      description: description !== undefined ? description : webhook.description,
      headers: headers || webhook.headers,
      active: active !== undefined ? active : webhook.active,
      created_at: webhook.created_at,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        webhook: updatedWebhook,
        message: "Webhook updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PUT is similar to PATCH but requires all fields
  return PATCH(request, { params });
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

async function getWebhook(userId: string, webhookId: string): Promise<any | null> {
  // In production: SELECT * FROM webhooks WHERE id = ? AND user_id = ?
  return {
    id: webhookId,
    url: "https://example.com/webhook",
    events: ["threat.detected"],
    active: true,
    created_at: "2024-01-15T10:30:00Z",
  };
}
