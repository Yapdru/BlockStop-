import { NextRequest, NextResponse } from "next/server";

interface DisconnectIntegrationRequest {
  reason?: string;
  revoke_access?: boolean;
}

export async function POST(
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
    if (!hasScope(token, "integrations:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to disconnect integrations",
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

    const body = (await request.json()) as DisconnectIntegrationRequest;
    const { reason, revoke_access } = body;

    // Verify integration exists and belongs to user
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

    // Check if already disconnected
    if (integration.status === "disconnected") {
      return NextResponse.json(
        {
          error: "invalid_state",
          error_description: "Integration is already disconnected",
        },
        { status: 400 }
      );
    }

    // Perform disconnection
    const disconnectResult = await performDisconnection(
      integrationId,
      integration,
      revoke_access || false
    );

    if (!disconnectResult.success) {
      return NextResponse.json(
        {
          error: "disconnection_failed",
          error_description: disconnectResult.error,
        },
        { status: 500 }
      );
    }

    // In production:
    // 1. Update database to mark as disconnected
    // 2. Revoke access tokens if requested
    // 3. Clean up any stored credentials
    // 4. Cancel any pending syncs
    // 5. Log disconnection event
    // UPDATE integrations SET status = 'disconnected', disconnected_at = NOW(), reason = ?
    // WHERE user_id = ? AND integration_id = ?

    return NextResponse.json(
      {
        success: true,
        integration_id: integrationId,
        status: "disconnected",
        disconnected_at: new Date().toISOString(),
        message: "Integration disconnected successfully",
        reason,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Alias for POST disconnect
  return POST(request, { params });
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
  };
}

async function performDisconnection(
  integrationId: string,
  integration: any,
  revokeAccess: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production: perform actual disconnection
    // 1. For OAuth: revoke tokens if revokeAccess is true
    // 2. For API keys: delete stored credentials
    // 3. Stop any active syncs

    if (revokeAccess) {
      // Call integration API to revoke access
      // await revokeIntegrationAccess(integrationId, integration.credentials);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to disconnect integration: ${error}`,
    };
  }
}
