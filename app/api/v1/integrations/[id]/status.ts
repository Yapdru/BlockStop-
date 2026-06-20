import { NextRequest, NextResponse } from "next/server";

interface IntegrationStatus {
  id: string;
  status: "connected" | "disconnected" | "error";
  connected_at?: string;
  last_sync?: string;
  health: {
    status: "healthy" | "degraded" | "error";
    last_check: string;
    error_message?: string;
  };
  sync_stats?: {
    last_successful_sync: string;
    sync_count: number;
    items_synced: number;
    errors: number;
  };
}

export async function GET(
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
    const integrationId = params.id;

    // Verify token has required scope
    if (!hasScope(token, "integrations:read")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to view integration status",
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

    // Get integration status
    const integration = await getIntegration(userId, integrationId);
    if (!integration) {
      return NextResponse.json(
        {
          error: "not_found",
          error_description: "Integration not found",
        },
        { status: 404 }
      );
    }

    // Perform health check
    const health = await checkIntegrationHealth(integration);

    const statusResponse: IntegrationStatus = {
      id: integrationId,
      status: integration.status,
      connected_at: integration.connected_at,
      last_sync: integration.last_sync,
      health,
      sync_stats: integration.sync_stats,
    };

    return NextResponse.json(statusResponse, {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error checking integration status:", error);
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

async function getIntegration(userId: string, integrationId: string): Promise<any | null> {
  // In production: SELECT * FROM integrations WHERE user_id = ? AND integration_id = ?
  return {
    id: integrationId,
    status: "connected",
    connected_at: "2024-01-15T10:30:00Z",
    last_sync: "2024-06-18T14:20:00Z",
    sync_stats: {
      last_successful_sync: "2024-06-18T14:20:00Z",
      sync_count: 42,
      items_synced: 1240,
      errors: 0,
    },
  };
}

async function checkIntegrationHealth(
  integration: any
): Promise<any> {
  // In production: perform actual API call to integration
  // Check authentication, rate limits, recent errors
  try {
    // Simulate health check
    const timeSinceSync = Date.now() - new Date(integration.last_sync).getTime();
    const isFresh = timeSinceSync < 24 * 60 * 60 * 1000; // 24 hours

    return {
      status: isFresh ? "healthy" : "degraded",
      last_check: new Date().toISOString(),
      error_message: isFresh ? undefined : "No recent sync activity",
    };
  } catch (error) {
    return {
      status: "error",
      last_check: new Date().toISOString(),
      error_message: String(error),
    };
  }
}
