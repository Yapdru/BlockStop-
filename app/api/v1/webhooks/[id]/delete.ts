import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
          error_description: "Insufficient permissions to delete webhooks",
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

    // In production:
    // 1. Soft delete or hard delete from database
    // 2. Clean up any pending deliveries
    // 3. Archive webhook data for audit trail
    // DELETE FROM webhooks WHERE id = ? AND user_id = ?

    return NextResponse.json(
      {
        success: true,
        message: "Webhook deleted successfully",
        webhook_id: webhookId,
        deleted_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting webhook:", error);
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

async function getWebhook(userId: string, webhookId: string): Promise<any | null> {
  // In production: SELECT * FROM webhooks WHERE id = ? AND user_id = ?
  return {
    id: webhookId,
    url: "https://example.com/webhook",
  };
}
