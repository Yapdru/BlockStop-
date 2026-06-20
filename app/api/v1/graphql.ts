import { NextRequest, NextResponse } from "next/server";

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{ message: string; extensions?: Record<string, any> }>;
}

const SCHEMA = `
type Query {
  threats(limit: Int, offset: Int, severity: String): ThreatConnection!
  threat(id: ID!): Threat
  files(limit: Int, offset: Int): FileConnection!
  file(id: ID!): File
  integrations: [Integration!]!
  integration(id: ID!): Integration
  webhooks: [Webhook!]!
  webhook(id: ID!): Webhook
  apiKeys: [APIKey!]!
  user: User!
  health: HealthStatus!
}

type Mutation {
  createWebhook(input: CreateWebhookInput!): Webhook!
  updateWebhook(id: ID!, input: UpdateWebhookInput!): Webhook!
  deleteWebhook(id: ID!): Boolean!
  connectIntegration(id: String!, credentials: JSON): Integration!
  disconnectIntegration(id: String!): Boolean!
  createAPIKey(name: String!, scopes: [String!]!): APIKey!
  revokeAPIKey(id: ID!): Boolean!
}

type Threat {
  id: ID!
  type: String!
  severity: String!
  source: String!
  detected_at: String!
  details: JSON
}

type ThreatConnection {
  edges: [ThreatEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type ThreatEdge {
  node: Threat!
  cursor: String!
}

type File {
  id: ID!
  name: String!
  size: Int!
  scan_result: String!
  scanned_at: String!
}

type FileConnection {
  edges: [FileEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type FileEdge {
  node: File!
  cursor: String!
}

type Integration {
  id: ID!
  name: String!
  type: String!
  status: String!
  connected_at: String
  config: JSON
}

type Webhook {
  id: ID!
  url: String!
  events: [String!]!
  active: Boolean!
  created_at: String!
}

type APIKey {
  id: ID!
  name: String!
  key_prefix: String!
  scopes: [String!]!
  created_at: String!
  expires_at: String
}

type User {
  id: ID!
  email: String!
  name: String!
  plan: String!
  created_at: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type HealthStatus {
  status: String!
  timestamp: String!
  services: JSON!
}

input CreateWebhookInput {
  url: String!
  events: [String!]!
  description: String
}

input UpdateWebhookInput {
  url: String
  events: [String!]
  active: Boolean
}
`;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          errors: [
            {
              message: "Unauthorized",
              extensions: { code: "UNAUTHENTICATED" },
            },
          ],
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        {
          errors: [
            {
              message: "Invalid token",
              extensions: { code: "UNAUTHENTICATED" },
            },
          ],
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as GraphQLRequest;
    const { query, variables, operationName } = body;

    // Validate query
    if (!query) {
      return NextResponse.json(
        {
          errors: [
            {
              message: "Query is required",
              extensions: { code: "BAD_REQUEST" },
            },
          ],
        },
        { status: 400 }
      );
    }

    // Parse and validate query
    const result = await executeQuery(userId, query, variables, operationName);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    console.error("GraphQL error:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Internal server error",
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          },
        ],
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // GraphQL introspection via GET
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.has("schema")) {
      return NextResponse.json(
        {
          data: {
            __schema: {
              queryType: { name: "Query" },
              mutationType: { name: "Mutation" },
              types: parseSchema(SCHEMA),
            },
          },
        },
        {
          headers: {
            "Cache-Control": "public, max-age=3600",
          },
        }
      );
    }

    return NextResponse.json(
      {
        message: "GraphQL endpoint",
        documentation: "https://docs.blockstop.io/api/graphql",
        introspection: `${request.nextUrl.origin}?schema=true`,
      }
    );
  } catch (error) {
    console.error("GraphQL introspection error:", error);
    return NextResponse.json(
      {
        errors: [{ message: "An unexpected error occurred" }],
      },
      { status: 500 }
    );
  }
}

async function executeQuery(
  userId: string,
  query: string,
  variables?: Record<string, any>,
  operationName?: string
): Promise<GraphQLResponse> {
  // In production: use actual GraphQL resolver library (apollo-server, graphql-yoga, etc)
  // This is a simplified mock implementation

  try {
    // Parse query (simplified)
    const isHealthQuery = query.includes("health");
    const isThreatsQuery = query.includes("threats");
    const isWebhooksQuery = query.includes("webhooks");

    if (isHealthQuery) {
      return {
        data: {
          health: {
            status: "operational",
            timestamp: new Date().toISOString(),
            services: {
              api: "operational",
              database: "connected",
              cache: "operational",
            },
          },
        },
      };
    }

    if (isThreatsQuery) {
      return {
        data: {
          threats: {
            edges: [
              {
                node: {
                  id: "threat_1",
                  type: "malware",
                  severity: "high",
                  source: "email",
                  detected_at: new Date().toISOString(),
                },
                cursor: "cursor_1",
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: "cursor_1",
              endCursor: "cursor_1",
            },
            total: 1,
          },
        },
      };
    }

    if (isWebhooksQuery) {
      return {
        data: {
          webhooks: [
            {
              id: "wh_1",
              url: "https://example.com/webhook",
              events: ["threat.detected"],
              active: true,
              created_at: new Date().toISOString(),
            },
          ],
        },
      };
    }

    return {
      data: {
        user: {
          id: userId,
          email: "user@example.com",
          name: "Example User",
          plan: "pro",
          created_at: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    return {
      errors: [
        {
          message: String(error),
          extensions: { code: "GRAPHQL_ERROR" },
        },
      ],
    };
  }
}

function parseSchema(schema: string): any[] {
  // Simplified schema parser
  return [
    {
      kind: "OBJECT",
      name: "Query",
      fields: [
        { name: "threats", type: "ThreatConnection" },
        { name: "threat", type: "Threat" },
        { name: "files", type: "FileConnection" },
        { name: "integrations", type: "[Integration!]!" },
        { name: "webhooks", type: "[Webhook!]!" },
        { name: "user", type: "User!" },
        { name: "health", type: "HealthStatus!" },
      ],
    },
  ];
}

function getUserIdFromToken(token: string): string | null {
  if (token.length > 0) {
    return "user_123";
  }
  return null;
}
