import { NextRequest, NextResponse } from "next/server";

interface Integration {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  connected_at?: string;
  last_sync?: string;
  config?: Record<string, any>;
  description?: string;
}

interface ListIntegrationsResponse {
  integrations: Integration[];
  total: number;
  limit: number;
  offset: number;
  available_integrations?: AvailableIntegration[];
}

interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_url?: string;
}

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
    if (!hasScope(token, "integrations:read")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to list integrations",
        },
        { status: 403 }
      );
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const connected = searchParams.get("connected");
    const includeAvailable = searchParams.get("include_available") === "true";

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
    // SELECT * FROM integrations WHERE user_id = ?
    const mockIntegrations: Integration[] = [
      {
        id: "int_slack",
        name: "Slack",
        type: "communication",
        status: "connected",
        connected_at: "2024-01-15T10:30:00Z",
        last_sync: "2024-06-18T14:20:00Z",
        description: "Slack notifications",
      },
      {
        id: "int_microsoft",
        name: "Microsoft Teams",
        type: "communication",
        status: "disconnected",
      },
      {
        id: "int_jira",
        name: "Jira",
        type: "ticketing",
        status: "connected",
        connected_at: "2024-02-20T08:15:00Z",
        last_sync: "2024-06-18T13:45:00Z",
        description: "Issue tracking",
      },
    ];

    let filtered = mockIntegrations;
    if (connected !== null) {
      filtered = mockIntegrations.filter((i) => {
        const isConnected = i.status === "connected";
        return isConnected === (connected === "true");
      });
    }

    const response: ListIntegrationsResponse = {
      integrations: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };

    if (includeAvailable) {
      response.available_integrations = getAvailableIntegrations();
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "X-Total-Count": String(filtered.length),
      },
    });
  } catch (error) {
    console.error("Error listing integrations:", error);
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

function getAvailableIntegrations(): AvailableIntegration[] {
  return [
    {
      id: "slack",
      name: "Slack",
      description: "Send BlockStop notifications to Slack channels",
      category: "communication",
    },
    {
      id: "microsoft_teams",
      name: "Microsoft Teams",
      description: "Integrate with Microsoft Teams",
      category: "communication",
    },
    {
      id: "jira",
      name: "Jira",
      description: "Create Jira tickets for threats",
      category: "ticketing",
    },
    {
      id: "zendesk",
      name: "Zendesk",
      description: "Sync with Zendesk support",
      category: "ticketing",
    },
    {
      id: "splunk",
      name: "Splunk",
      description: "Send logs to Splunk",
      category: "siem",
    },
    {
      id: "datadog",
      name: "Datadog",
      description: "Monitor with Datadog",
      category: "monitoring",
    },
  ];
}
