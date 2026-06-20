// GraphQL Schema Definition
export const graphqlSchema = `
  enum ThreatType {
    PHISHING
    MALWARE
    RANSOMWARE
    BEC
    SPAM
    DLP_VIOLATION
    IMPERSONATION
    ATTACHMENT_THREAT
  }

  enum ThreatSeverity {
    CRITICAL
    HIGH
    MEDIUM
    LOW
    INFO
  }

  enum ThreatStatus {
    OPEN
    INVESTIGATING
    REMEDIATED
    FALSE_POSITIVE
    ARCHIVED
  }

  type Threat {
    id: ID!
    type: ThreatType!
    severity: ThreatSeverity!
    status: ThreatStatus!
    source: String!
    subject: String
    senderEmail: String
    recipientEmail: String
    indicators: [String!]!
    timestamp: String!
    detectedAt: String!
    analysis: ThreatAnalysis!
    actions: [ThreatAction!]!
    metadata: JSON!
  }

  type ThreatAnalysis {
    spamScore: Float
    phishingScore: Float
    malwareScore: Float
    urlScore: Float
    attachmentScore: Float
  }

  type ThreatAction {
    id: ID!
    type: String!
    status: String!
    timestamp: String!
    details: JSON
  }

  type PaginatedThreats {
    items: [Threat!]!
    cursor: String
    hasMore: Boolean!
    total: Int
    pageSize: Int!
  }

  type Scan {
    id: ID!
    type: String!
    target: String!
    status: String!
    result: String
    threats: [Threat!]!
    startedAt: String!
    completedAt: String
    duration: Int
  }

  type Webhook {
    id: ID!
    url: String!
    eventTypes: [String!]!
    active: Boolean!
    lastTriggeredAt: String
    createdAt: String!
    updatedAt: String!
  }

  type WebhookEvent {
    id: ID!
    webhookId: ID!
    eventType: String!
    status: String!
    deliveryAttempts: Int!
    timestamp: String!
    nextRetryAt: String
    lastError: String
  }

  type Integration {
    id: ID!
    name: String!
    type: String!
    category: String!
    enabled: Boolean!
    config: JSON!
    testable: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type IntegrationTemplate {
    id: ID!
    name: String!
    type: String!
    description: String!
    requiredFields: [TemplateField!]!
    documentation: String
  }

  type TemplateField {
    name: String!
    type: String!
    label: String!
    required: Boolean!
    placeholder: String
    helpText: String
  }

  type APIKey {
    id: ID!
    name: String!
    scopes: [String!]!
    active: Boolean!
    lastUsedAt: String
    createdAt: String!
    expiresAt: String
  }

  type Organization {
    id: ID!
    name: String!
    email: String!
    tier: String!
    seats: Int!
    usedSeats: Int!
    features: [String!]!
    createdAt: String!
  }

  type Team {
    id: ID!
    name: String!
    orgId: ID!
    members: [TeamMember!]!
    permissions: [String!]!
    createdAt: String!
  }

  type TeamMember {
    userId: ID!
    email: String!
    role: String!
    joinedAt: String!
  }

  type UsageMetrics {
    period: String!
    apiKeyId: ID!
    requestCount: Int!
    successCount: Int!
    errorCount: Int!
    avgLatencyMs: Int!
    byEndpoint: [EndpointMetrics!]!
  }

  type EndpointMetrics {
    path: String!
    method: String!
    count: Int!
    avgLatencyMs: Int!
    errorRate: Float!
  }

  type BatchResult {
    requestId: String!
    status: Int!
    body: JSON!
  }

  type Query {
    # Threats
    threat(id: ID!): Threat
    threats(limit: Int, offset: Int, severity: ThreatSeverity, status: ThreatStatus): PaginatedThreats!
    threatsBySource(source: String!, limit: Int): [Threat!]!

    # Scans
    scan(id: ID!): Scan
    scans(limit: Int, status: String): [Scan!]!

    # Webhooks
    webhook(id: ID!): Webhook
    webhooks(limit: Int): [Webhook!]!
    webhookEvents(webhookId: ID!, limit: Int): [WebhookEvent!]!

    # Integrations
    integration(id: ID!): Integration
    integrations(type: String, enabled: Boolean): [Integration!]!
    integrationTemplates(type: String): [IntegrationTemplate!]!
    integrationTemplate(id: ID!): IntegrationTemplate

    # API Keys
    apiKey(id: ID!): APIKey
    apiKeys(limit: Int): [APIKey!]!

    # Organization
    organization: Organization!
    teams(limit: Int): [Team!]!
    team(id: ID!): Team

    # Metrics
    usageMetrics(period: String!): UsageMetrics!
  }

  type Mutation {
    # Threats
    updateThreat(id: ID!, status: ThreatStatus, severity: ThreatSeverity): Threat!
    deleteThreat(id: ID!): Boolean!
    createThreat(type: ThreatType!, source: String!, subject: String): Threat!

    # Scans
    createScan(type: String!, target: String!): Scan!
    cancelScan(id: ID!): Boolean!

    # Webhooks
    createWebhook(url: String!, eventTypes: [String!]!): Webhook!
    updateWebhook(id: ID!, url: String, eventTypes: [String!], active: Boolean): Webhook!
    deleteWebhook(id: ID!): Boolean!
    testWebhook(id: ID!): Boolean!
    replayWebhookEvent(eventId: ID!): Boolean!

    # Integrations
    createIntegration(name: String!, type: String!, config: JSON!): Integration!
    updateIntegration(id: ID!, config: JSON, enabled: Boolean): Integration!
    deleteIntegration(id: ID!): Boolean!
    testIntegration(id: ID!): Boolean!

    # API Keys
    createAPIKey(name: String!, scopes: [String!]!): APIKey!
    revokeAPIKey(id: ID!): Boolean!
    updateAPIKey(id: ID!, scopes: [String!]): APIKey!

    # Organization
    updateOrganization(name: String, email: String): Organization!
    createTeam(name: String!): Team!
    addTeamMember(teamId: ID!, userId: ID!, role: String!): TeamMember!
  }

  type Subscription {
    threatDetected: Threat!
    webhookTriggered(webhookId: ID!): WebhookEvent!
  }

  scalar JSON
  scalar DateTime
`;

// GraphQL Resolvers
export const graphqlResolvers = {
  Query: {
    threat: (_, { id }: { id: string }) => {
      return {
        id,
        type: 'PHISHING',
        severity: 'HIGH',
        status: 'OPEN',
        source: 'email',
        subject: 'Suspicious Email',
        indicators: [],
        timestamp: new Date().toISOString(),
        detectedAt: new Date().toISOString(),
        analysis: {
          spamScore: 0.9,
          phishingScore: 0.85,
          malwareScore: 0,
        },
        actions: [],
        metadata: {},
      };
    },

    threats: (
      _,
      {
        limit,
        offset,
        severity,
        status,
      }: {
        limit?: number;
        offset?: number;
        severity?: string;
        status?: string;
      }
    ) => {
      return {
        items: [],
        cursor: '',
        hasMore: false,
        total: 0,
        pageSize: limit || 20,
      };
    },

    integrations: (
      _,
      { type, enabled }: { type?: string; enabled?: boolean }
    ) => {
      return [];
    },

    integrationTemplates: (_, { type }: { type?: string }) => {
      return [];
    },

    webhooks: (_, { limit }: { limit?: number }) => {
      return [];
    },

    apiKeys: (_, { limit }: { limit?: number }) => {
      return [];
    },

    organization: () => {
      return {
        id: 'org-1',
        name: 'Example Organization',
        email: 'admin@example.com',
        tier: 'enterprise',
        seats: 100,
        usedSeats: 45,
        features: ['threats', 'webhooks', 'integrations'],
        createdAt: new Date().toISOString(),
      };
    },

    usageMetrics: (_, { period }: { period: string }) => {
      return {
        period,
        apiKeyId: 'key-1',
        requestCount: 10000,
        successCount: 9800,
        errorCount: 200,
        avgLatencyMs: 150,
        byEndpoint: [],
      };
    },
  },

  Mutation: {
    createThreat: (
      _,
      { type, source, subject }: { type: string; source: string; subject?: string }
    ) => {
      return {
        id: `threat-${Date.now()}`,
        type,
        source,
        subject,
        severity: 'MEDIUM',
        status: 'OPEN',
        indicators: [],
        timestamp: new Date().toISOString(),
        detectedAt: new Date().toISOString(),
        analysis: {},
        actions: [],
        metadata: {},
      };
    },

    updateThreat: (
      _,
      { id, status, severity }: { id: string; status?: string; severity?: string }
    ) => {
      return {
        id,
        status: status || 'OPEN',
        severity: severity || 'MEDIUM',
      };
    },

    createWebhook: (
      _,
      { url, eventTypes }: { url: string; eventTypes: string[] }
    ) => {
      return {
        id: `webhook-${Date.now()}`,
        url,
        eventTypes,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },

    updateIntegration: (
      _,
      { id, config, enabled }: { id: string; config?: any; enabled?: boolean }
    ) => {
      return {
        id,
        config,
        enabled: enabled ?? true,
        updatedAt: new Date().toISOString(),
      };
    },

    createAPIKey: (
      _,
      { name, scopes }: { name: string; scopes: string[] }
    ) => {
      return {
        id: `key-${Date.now()}`,
        name,
        scopes,
        active: true,
        createdAt: new Date().toISOString(),
      };
    },

    testWebhook: async (_, { id }: { id: string }) => {
      return true;
    },

    testIntegration: async (_, { id }: { id: string }) => {
      return true;
    },
  },

  Subscription: {
    threatDetected: {
      subscribe: () => {
        return {
          async *[Symbol.asyncIterator]() {
            // Would be implemented with real-time event streaming
            yield {
              data: {
                threatDetected: {
                  id: 'threat-1',
                  type: 'PHISHING',
                  severity: 'HIGH',
                  status: 'OPEN',
                  timestamp: new Date().toISOString(),
                },
              },
            };
          },
        };
      },
    },
  },
};
