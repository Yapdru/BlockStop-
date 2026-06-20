import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface ConnectIntegrationRequest {
  credentials?: Record<string, string>;
  config?: Record<string, any>;
  name?: string;
}

interface ConnectIntegrationResponse {
  integration_id: string;
  status: "connected" | "pending_authorization";
  authorization_url?: string;
  connected_at?: string;
  message: string;
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
          error_description: "Insufficient permissions to connect integrations",
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

    const body = (await request.json()) as ConnectIntegrationRequest;
    const { credentials, config, name } = body;

    // Validate integration ID
    const integration = getIntegrationInfo(integrationId);
    if (!integration) {
      return NextResponse.json(
        {
          error: "not_found",
          error_description: "Integration type not found",
        },
        { status: 404 }
      );
    }

    // Check if already connected
    const existing = await getConnectedIntegration(userId, integrationId);
    if (existing && existing.status === "connected") {
      return NextResponse.json(
        {
          error: "conflict",
          error_description: "Integration already connected",
        },
        { status: 409 }
      );
    }

    // Handle OAuth integrations
    if (integration.auth_type === "oauth2") {
      const state = crypto.randomBytes(16).toString("hex");
      const authUrl = buildOAuthUrl(integrationId, state);

      // In production: store state in database for validation
      // INSERT INTO oauth_states (state, user_id, integration_id, created_at)

      return NextResponse.json(
        {
          integration_id: integrationId,
          status: "pending_authorization",
          authorization_url: authUrl,
          message: "User authorization required",
        },
        { status: 200 }
      );
    }

    // Handle API key or credentials
    if (!credentials || Object.keys(credentials).length === 0) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: `${integration.name} requires credentials`,
        },
        { status: 400 }
      );
    }

    // Validate credentials
    const isValid = await validateCredentials(integrationId, credentials);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "invalid_credentials",
          error_description: "Invalid credentials provided",
        },
        { status: 401 }
      );
    }

    // In production:
    // 1. Encrypt credentials
    // 2. Store in secure vault
    // 3. Test connection
    // INSERT INTO integrations (user_id, integration_id, status, credentials, config, connected_at)
    // VALUES (?, ?, 'connected', ?, ?, NOW())

    const connectedAt = new Date().toISOString();
    const instanceId = "inst_" + crypto.randomBytes(8).toString("hex");

    return NextResponse.json(
      {
        integration_id: integrationId,
        status: "connected",
        connected_at: connectedAt,
        message: "Integration connected successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error connecting integration:", error);
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

interface IntegrationInfo {
  id: string;
  name: string;
  auth_type: "oauth2" | "api_key" | "basic";
}

function getIntegrationInfo(integrationId: string): IntegrationInfo | null {
  const integrations: Record<string, IntegrationInfo> = {
    slack: { id: "slack", name: "Slack", auth_type: "oauth2" },
    microsoft_teams: { id: "microsoft_teams", name: "Microsoft Teams", auth_type: "oauth2" },
    jira: { id: "jira", name: "Jira", auth_type: "api_key" },
    zendesk: { id: "zendesk", name: "Zendesk", auth_type: "api_key" },
    splunk: { id: "splunk", name: "Splunk", auth_type: "basic" },
  };
  return integrations[integrationId] || null;
}

async function getConnectedIntegration(
  userId: string,
  integrationId: string
): Promise<any | null> {
  // In production: SELECT * FROM integrations WHERE user_id = ? AND integration_id = ?
  return null;
}

async function validateCredentials(
  integrationId: string,
  credentials: Record<string, string>
): Promise<boolean> {
  // In production: validate against the integration API
  return Object.keys(credentials).length > 0;
}

function buildOAuthUrl(integrationId: string, state: string): string {
  const baseUrls: Record<string, string> = {
    slack: "https://slack.com/oauth_authorize",
    microsoft_teams: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  };

  const baseUrl = baseUrls[integrationId];
  if (!baseUrl) return "";

  const params = new URLSearchParams({
    client_id: "your_client_id",
    redirect_uri: "https://api.blockstop.io/v1/integrations/oauth/callback",
    scope: "read write",
    state,
  });

  return `${baseUrl}?${params.toString()}`;
}
