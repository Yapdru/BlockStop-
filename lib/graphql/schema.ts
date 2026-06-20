import { gql } from 'apollo-server-core';

export const typeDefs = gql`
  # ==================== ENUMS ====================

  enum ThreatType {
    PHISHING
    MALWARE
    RANSOMWARE
    BEC
    SPAM
    DLP_VIOLATION
    IMPERSONATION
    ATTACHMENT_THREAT
    CREDENTIAL_THEFT
    ZERO_DAY
    ADVANCED_THREAT
    UNKNOWN
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
    QUARANTINED
  }

  enum ScanType {
    EMAIL
    FILE
    URL
    ENDPOINT
    NETWORK
  }

  enum ScanStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    FAILED
    CANCELLED
  }

  enum IntegrationStatus {
    CONNECTED
    DISCONNECTED
    ERROR
    TESTING
    PENDING_AUTH
  }

  enum Role {
    ADMIN
    MANAGER
    ANALYST
    VIEWER
    DEVELOPER
  }

  enum WebhookStatus {
    ACTIVE
    INACTIVE
    FAILED
    SUSPENDED
  }

  enum AlertSeverity {
    CRITICAL
    HIGH
    MEDIUM
    LOW
  }

  # ==================== SCALARS ====================

  scalar JSON
  scalar DateTime
  scalar Upload

  # ==================== INPUT TYPES ====================

  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  input ThreatFilterInput {
    severity: [ThreatSeverity!]
    status: [ThreatStatus!]
    type: [ThreatType!]
    source: String
    dateRange: DateRangeInput
    searchTerm: String
  }

  input DateRangeInput {
    startDate: DateTime!
    endDate: DateTime!
  }

  input ScanFilterInput {
    status: [ScanStatus!]
    type: [ScanType!]
    dateRange: DateRangeInput
  }

  input CreateScanInput {
    type: ScanType!
    target: String!
    priority: String
    metadata: JSON
  }

  input UpdateThreatInput {
    id: ID!
    status: ThreatStatus
    severity: ThreatSeverity
    notes: String
    tags: [String!]
  }

  input CreateWebhookInput {
    url: String!
    eventTypes: [String!]!
    active: Boolean
    secret: String
  }

  input UpdateWebhookInput {
    id: ID!
    url: String
    eventTypes: [String!]
    active: Boolean
  }

  input IntegrationConfigInput {
    apiKey: String
    apiSecret: String
    endpoint: String
    customFields: JSON
  }

  input ConnectIntegrationInput {
    integrationId: ID!
    config: IntegrationConfigInput!
  }

  input CreateOrganizationInput {
    name: String!
    email: String!
    tier: String!
  }

  input UpdateSettingsInput {
    autoRemediation: Boolean
    notificationThreshold: Int
    retentionDays: Int
    customRules: JSON
  }

  # ==================== TYPE DEFINITIONS ====================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Threat Types
  type ThreatAnalysis {
    spamScore: Float
    phishingScore: Float
    malwareScore: Float
    urlScore: Float
    attachmentScore: Float
    dkimValid: Boolean
    spfValid: Boolean
    dmarcValid: Boolean
    senderReputation: Float
  }

  type Indicator {
    id: ID!
    type: String!
    value: String!
    confidence: Float!
    source: String
    lastSeen: DateTime
  }

  type ThreatAction {
    id: ID!
    type: String!
    status: String!
    timestamp: DateTime!
    details: JSON
    performedBy: String
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
    indicators: [Indicator!]!
    timestamp: DateTime!
    detectedAt: DateTime!
    analysis: ThreatAnalysis!
    actions: [ThreatAction!]!
    metadata: JSON
    tags: [String!]
    organizationId: ID!
    riskScore: Float!
    mitigationStatus: String
  }

  type ThreatConnection {
    edges: [ThreatEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ThreatEdge {
    node: Threat!
    cursor: String!
  }

  # Scan Types
  type ScanResult {
    id: ID!
    threatLevel: String!
    riskScore: Float!
    threatsFound: Int!
    details: JSON
  }

  type Scan {
    id: ID!
    type: ScanType!
    target: String!
    status: ScanStatus!
    result: ScanResult
    threats: [Threat!]!
    startedAt: DateTime!
    completedAt: DateTime
    duration: Int
    organizationId: ID!
    initiatedBy: String!
    priority: String
    metadata: JSON
  }

  type ScanConnection {
    edges: [ScanEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ScanEdge {
    node: Scan!
    cursor: String!
  }

  # Webhook Types
  type Webhook {
    id: ID!
    url: String!
    eventTypes: [String!]!
    status: WebhookStatus!
    lastTriggeredAt: DateTime
    lastError: String
    failureCount: Int!
    successCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    organizationId: ID!
  }

  type WebhookEvent {
    id: ID!
    webhookId: ID!
    eventType: String!
    status: String!
    deliveryAttempts: Int!
    timestamp: DateTime!
    nextRetryAt: DateTime
    lastError: String
    payload: JSON
  }

  type WebhookConnection {
    edges: [WebhookEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type WebhookEdge {
    node: Webhook!
    cursor: String!
  }

  # Integration Types
  type Integration {
    id: ID!
    name: String!
    type: String!
    category: String!
    status: IntegrationStatus!
    enabled: Boolean!
    config: JSON!
    testable: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastHealthCheck: DateTime
    version: String
  }

  type IntegrationTemplate {
    id: ID!
    name: String!
    type: String!
    description: String!
    category: String!
    requiredFields: [TemplateField!]!
    documentation: String
    authType: String!
    supportedEvents: [String!]
  }

  type TemplateField {
    name: String!
    type: String!
    label: String!
    required: Boolean!
    placeholder: String
    helpText: String
    validation: String
  }

  type IntegrationConnection {
    edges: [IntegrationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type IntegrationEdge {
    node: Integration!
    cursor: String!
  }

  # Organization Types
  type Organization {
    id: ID!
    name: String!
    email: String!
    tier: String!
    seats: Int!
    usedSeats: Int!
    features: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    status: String!
    apiKeysCount: Int!
    webhooksCount: Int!
  }

  # Team Types
  type Team {
    id: ID!
    name: String!
    orgId: ID!
    members: [TeamMember!]!
    permissions: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TeamMember {
    userId: ID!
    email: String!
    name: String!
    role: Role!
    joinedAt: DateTime!
    lastActive: DateTime
  }

  type TeamConnection {
    edges: [TeamEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TeamEdge {
    node: Team!
    cursor: String!
  }

  # API Key Types
  type APIKey {
    id: ID!
    name: String!
    scopes: [String!]!
    active: Boolean!
    lastUsedAt: DateTime
    createdAt: DateTime!
    expiresAt: DateTime
    keyPrefix: String!
  }

  type APIKeyConnection {
    edges: [APIKeyEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type APIKeyEdge {
    node: APIKey!
    cursor: String!
  }

  # Usage & Analytics Types
  type UsageMetrics {
    period: String!
    apiKeyId: ID!
    organizationId: ID!
    requestCount: Int!
    successCount: Int!
    errorCount: Int!
    avgLatencyMs: Float!
    byEndpoint: [EndpointMetrics!]!
  }

  type EndpointMetrics {
    path: String!
    method: String!
    count: Int!
    avgLatencyMs: Float!
    errorRate: Float!
    p95LatencyMs: Float
    p99LatencyMs: Float
  }

  type AlertMetrics {
    period: String!
    organizationId: ID!
    criticalCount: Int!
    highCount: Int!
    mediumCount: Int!
    lowCount: Int!
    totalCount: Int!
    remediatedCount: Int!
  }

  # Alert Types
  type Alert {
    id: ID!
    organizationId: ID!
    severity: AlertSeverity!
    title: String!
    description: String!
    threat: Threat
    createdAt: DateTime!
    acknowledgedAt: DateTime
    acknowledgedBy: String
    metadata: JSON
  }

  type AlertConnection {
    edges: [AlertEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AlertEdge {
    node: Alert!
    cursor: String!
  }

  # Settings Type
  type Settings {
    id: ID!
    organizationId: ID!
    autoRemediation: Boolean!
    notificationThreshold: Int!
    retentionDays: Int!
    customRules: JSON
    updatedAt: DateTime!
  }

  # Batch Operation Types
  type BatchResult {
    requestId: String!
    status: Int!
    body: JSON!
    error: String
  }

  # Generic Response Types
  type OperationResult {
    success: Boolean!
    message: String
    data: JSON
  }

  type ScanStartResult {
    scanId: ID!
    status: ScanStatus!
    createdAt: DateTime!
  }

  type WebhookTestResult {
    success: Boolean!
    statusCode: Int!
    responseTime: Int!
    payload: JSON
    error: String
  }

  # ==================== QUERIES ====================

  type Query {
    # Threat Queries
    threat(id: ID!): Threat
    threats(
      filter: ThreatFilterInput
      pagination: PaginationInput
      sortBy: String
      sortOrder: String
    ): ThreatConnection!
    threatsByOrganization(
      organizationId: ID!
      pagination: PaginationInput
      filter: ThreatFilterInput
    ): ThreatConnection!
    threatsBySource(source: String!, pagination: PaginationInput): ThreatConnection!
    recentThreats(limit: Int!): [Threat!]!
    criticalThreats(organizationId: ID!): [Threat!]!
    threatStats(organizationId: ID!, dateRange: DateRangeInput!): JSON!

    # Scan Queries
    scan(id: ID!): Scan
    scans(
      filter: ScanFilterInput
      pagination: PaginationInput
      sortBy: String
    ): ScanConnection!
    scansByOrganization(
      organizationId: ID!
      pagination: PaginationInput
      filter: ScanFilterInput
    ): ScanConnection!
    recentScans(organizationId: ID!, limit: Int!): [Scan!]!
    scanHistory(organizationId: ID!, limit: Int!): [Scan!]!

    # Organization Queries
    organization(id: ID!): Organization
    organizations(pagination: PaginationInput): [Organization!]!
    currentOrganization: Organization
    organizationTeams(organizationId: ID!): [Team!]!

    # Team Queries
    team(id: ID!): Team
    teams(organizationId: ID!, pagination: PaginationInput): TeamConnection!
    teamMembers(teamId: ID!, pagination: PaginationInput): [TeamMember!]!

    # Integration Queries
    integration(id: ID!): Integration
    integrations(
      organizationId: ID!
      pagination: PaginationInput
    ): IntegrationConnection!
    integrationTemplates(
      category: String
      pagination: PaginationInput
    ): IntegrationConnection!
    availableIntegrations: [IntegrationTemplate!]!
    integrationHealth(integrationId: ID!): JSON!

    # Webhook Queries
    webhook(id: ID!): Webhook
    webhooks(
      organizationId: ID!
      pagination: PaginationInput
    ): WebhookConnection!
    webhookEvents(
      webhookId: ID!
      pagination: PaginationInput
    ): [WebhookEvent!]!

    # API Key Queries
    apiKey(id: ID!): APIKey
    apiKeys(
      organizationId: ID!
      pagination: PaginationInput
    ): APIKeyConnection!

    # Alert Queries
    alert(id: ID!): Alert
    alerts(
      organizationId: ID!
      severity: [AlertSeverity!]
      pagination: PaginationInput
    ): AlertConnection!
    unresolvedAlerts(organizationId: ID!): [Alert!]!

    # Settings Queries
    settings(organizationId: ID!): Settings
    organizationSettings(organizationId: ID!): JSON!

    # Analytics Queries
    usageMetrics(
      organizationId: ID!
      period: String!
      apiKeyId: ID
    ): UsageMetrics
    alertMetrics(
      organizationId: ID!
      dateRange: DateRangeInput!
    ): AlertMetrics!
    threatTrends(organizationId: ID!, days: Int!): JSON!
    threatByType(organizationId: ID!): JSON!

    # Search Queries
    search(query: String!, organizationId: ID!, pagination: PaginationInput): JSON!
    globalSearch(
      query: String!
      documentTypes: [String!]
    ): JSON!
  }

  # ==================== MUTATIONS ====================

  type Mutation {
    # Threat Mutations
    updateThreat(input: UpdateThreatInput!): Threat!
    resolveThreat(threatId: ID!, notes: String): Threat!
    quarantineThreat(threatId: ID!, reason: String): Threat!
    restoreThreat(threatId: ID!): Threat!
    markThreatAsFalsePositive(threatId: ID!, reason: String): Threat!
    addThreatTag(threatId: ID!, tag: String!): Threat!
    removeThreatTag(threatId: ID!, tag: String!): Threat!
    bulkUpdateThreats(threatIds: [ID!]!, status: ThreatStatus!): [Threat!]!

    # Scan Mutations
    createScan(input: CreateScanInput!): ScanStartResult!
    cancelScan(scanId: ID!): OperationResult!
    retryScan(scanId: ID!): ScanStartResult!
    deleteScan(scanId: ID!): OperationResult!

    # Organization Mutations
    createOrganization(input: CreateOrganizationInput!): Organization!
    updateOrganization(id: ID!, name: String, email: String, tier: String): Organization!
    deleteOrganization(id: ID!): OperationResult!

    # Team Mutations
    createTeam(orgId: ID!, name: String!): Team!
    updateTeam(id: ID!, name: String): Team!
    deleteTeam(id: ID!): OperationResult!
    addTeamMember(teamId: ID!, userId: ID!, role: Role!): TeamMember!
    removeTeamMember(teamId: ID!, userId: ID!): OperationResult!
    updateTeamMemberRole(teamId: ID!, userId: ID!, role: Role!): TeamMember!

    # Integration Mutations
    connectIntegration(input: ConnectIntegrationInput!): Integration!
    disconnectIntegration(integrationId: ID!): OperationResult!
    updateIntegration(id: ID!, config: IntegrationConfigInput!): Integration!
    testIntegration(integrationId: ID!): WebhookTestResult!
    enableIntegration(integrationId: ID!): Integration!
    disableIntegration(integrationId: ID!): Integration!

    # Webhook Mutations
    registerWebhook(input: CreateWebhookInput!): Webhook!
    updateWebhook(input: UpdateWebhookInput!): Webhook!
    deleteWebhook(webhookId: ID!): OperationResult!
    testWebhook(webhookId: ID!): WebhookTestResult!
    replayWebhookEvent(webhookEventId: ID!): OperationResult!
    suspendWebhook(webhookId: ID!, reason: String): Webhook!
    resumeWebhook(webhookId: ID!): Webhook!

    # Settings Mutations
    updateSettings(organizationId: ID!, input: UpdateSettingsInput!): Settings!
    resetSettings(organizationId: ID!): Settings!

    # API Key Mutations
    createAPIKey(
      organizationId: ID!
      name: String!
      scopes: [String!]!
      expiresAt: DateTime
    ): APIKey!
    revokeAPIKey(apiKeyId: ID!): OperationResult!
    rotateAPIKey(apiKeyId: ID!): APIKey!

    # Alert Mutations
    acknowledgeAlert(alertId: ID!): Alert!
    dismissAlert(alertId: ID!): Alert!
    bulkAcknowledgeAlerts(alertIds: [ID!]!): [Alert!]!
  }

  # ==================== SUBSCRIPTIONS ====================

  type Subscription {
    # Real-time threat detection
    threatDetected(organizationId: ID!): Threat!

    # Real-time scan completion
    scanCompleted(organizationId: ID!): Scan!

    # Real-time scan progress
    scanProgress(scanId: ID!): JSON!

    # Real-time alert triggers
    alertTriggered(organizationId: ID!): Alert!

    # Webhook event delivery status
    webhookEventStatus(webhookId: ID!): WebhookEvent!

    # Integration health status
    integrationStatusChange(integrationId: ID!): Integration!
  }
`;
