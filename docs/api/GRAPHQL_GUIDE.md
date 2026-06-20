# BlockStop GraphQL API Guide

**API Version**: v1  
**Endpoint**: `https://api.blockstop.io/api/v1/graphql`  
**Last Updated**: June 2026

## Overview

The BlockStop GraphQL API provides a flexible query interface for accessing threat detection, scan management, and integration data. GraphQL allows you to request exactly the fields you need, reducing bandwidth and improving performance.

## Authentication

Include your API key or OAuth2 token in the Authorization header:

```bash
curl -X POST https://api.blockstop.io/api/v1/graphql \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ threats { id threatType } }"}'
```

## Basic Query

### Query Threats

```graphql
query {
  threats(first: 10) {
    edges {
      node {
        id
        threatType
        severity
        source
        detectedAt
        status
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Response:
```json
{
  "data": {
    "threats": {
      "edges": [
        {
          "node": {
            "id": "threat_1",
            "threatType": "PHISHING",
            "severity": "HIGH",
            "source": "EMAIL",
            "detectedAt": "2026-06-18T10:00:00Z",
            "status": "ACTIVE"
          },
          "cursor": "YXJyYXljb25uZWN0aW9uOjA="
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "YXJyYXljb25uZWN0aW9uOjk="
      }
    }
  }
}
```

### Query Scans

```graphql
query {
  scans(status: COMPLETED, first: 20) {
    edges {
      node {
        id
        scanType
        status
        threatsDetected
        completedAt
        results {
          threatType
          severity
          confidence
        }
      }
    }
  }
}
```

### Query Organizations

```graphql
query {
  organization(id: "org_123") {
    id
    name
    tier
    threats {
      totalCount
      edges {
        node {
          id
          threatType
          severity
        }
      }
    }
    integrations {
      totalCount
      edges {
        node {
          id
          integrationType
          status
        }
      }
    }
    stats {
      totalThreatsDetected
      totalScans
      criticalThreats
      averageScanTime
    }
  }
}
```

## Mutations

### Create Scan

```graphql
mutation {
  createScan(input: {
    scanType: EMAIL
    emailAddress: "user@company.com"
    priority: HIGH
  }) {
    scan {
      id
      scanType
      status
      createdAt
      estimatedCompletion
    }
    errors {
      field
      message
    }
  }
}
```

### Register Webhook

```graphql
mutation {
  registerWebhook(input: {
    url: "https://your-system.com/webhooks"
    events: [THREAT_DETECTED, SCAN_COMPLETED]
  }) {
    webhook {
      id
      url
      events
      isActive
      createdAt
      secret
    }
    errors {
      field
      message
    }
  }
}
```

### Connect Integration

```graphql
mutation {
  connectIntegration(input: {
    integrationType: SLACK
    config: {
      webhookUrl: "https://hooks.slack.com/services/..."
      channel: "#security"
    }
  }) {
    integration {
      id
      integrationType
      status
      healthStatus
      connectedAt
    }
    errors {
      field
      message
    }
  }
}
```

## Real-Time Subscriptions

### Subscribe to Threat Detection

```graphql
subscription {
  threatDetected {
    id
    threatType
    severity
    source
    detectedAt
    indicators
  }
}
```

### Subscribe to Scan Completion

```graphql
subscription {
  scanCompleted {
    scan {
      id
      scanType
      status
      threatsDetected
      completedAt
    }
  }
}
```

## Schema Documentation

### Threat Type

```graphql
type Threat {
  id: ID!
  threatType: ThreatType!
  severity: Severity!
  source: String!
  status: ThreatStatus!
  detectedAt: DateTime!
  indicators: [String!]!
  affectedUsers: Int
  confidenceScore: Float!
  description: String
  remediationStatus: RemediationStatus
  updatedAt: DateTime!
}

enum ThreatType {
  PHISHING
  MALWARE
  RANSOMWARE
  VULNERABILITY
  CREDENTIAL_THEFT
  DATA_EXFILTRATION
  SOCIAL_ENGINEERING
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ThreatStatus {
  DETECTED
  ACTIVE
  CONTAINED
  REMEDIATED
  FALSE_POSITIVE
}
```

### Scan Type

```graphql
type Scan {
  id: ID!
  scanType: ScanType!
  status: ScanStatus!
  createdAt: DateTime!
  completedAt: DateTime
  threatsDetected: Int!
  results: [ScanResult!]!
  estimatedCompletion: DateTime
  priority: Priority!
}

enum ScanType {
  EMAIL
  FILE
  URL
  ENDPOINT
  CLOUD
}

enum ScanStatus {
  QUEUED
  IN_PROGRESS
  COMPLETED
  FAILED
  CANCELLED
}

type ScanResult {
  threatType: ThreatType!
  severity: Severity!
  confidence: Float!
  indicators: [String!]!
}
```

### Integration Type

```graphql
type Integration {
  id: ID!
  integrationType: IntegrationType!
  integrationName: String!
  status: IntegrationStatus!
  healthStatus: HealthStatus!
  config: JSON!
  connectedAt: DateTime!
  lastSyncAt: DateTime
  lastError: String
}

enum IntegrationType {
  SLACK
  TEAMS
  JIRA
  SERVICENOW
  SPLUNK
  DATADOG
  PAGERDUTY
}

enum IntegrationStatus {
  CONNECTED
  DISCONNECTED
  ERROR
  UNHEALTHY
}

enum HealthStatus {
  HEALTHY
  DEGRADED
  UNHEALTHY
}
```

### Webhook Type

```graphql
type Webhook {
  id: ID!
  url: String!
  events: [WebhookEvent!]!
  isActive: Boolean!
  lastDeliveryAt: DateTime
  deliveryStatus: DeliveryStatus!
  retryCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum WebhookEvent {
  THREAT_DETECTED
  SCAN_COMPLETED
  ALERT_TRIGGERED
  ORGANIZATION_CREATED
  INTEGRATION_CONNECTED
  RATE_LIMIT_EXCEEDED
  SECURITY_BREACH_DETECTED
}

enum DeliveryStatus {
  PENDING
  SUCCESS
  FAILED
}
```

## Query Complexity

Queries are limited to a complexity score of 1000. Complex nested queries may hit this limit:

```graphql
# This query has a complexity of ~150
query {
  threats(first: 100) {
    edges {
      node {
        id
        threatType
        severity
      }
    }
  }
  scans(first: 50) {
    edges {
      node {
        id
        results {
          threatType
          severity
        }
      }
    }
  }
}
```

## Error Handling

GraphQL errors follow this format:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "status": 401
      }
    }
  ]
}
```

## Best Practices

1. **Request Only Needed Fields**: GraphQL allows precise field selection
2. **Use Aliases**: Avoid multiple similar queries with aliases
3. **Fragment Usage**: Reuse fragments for common field selections
4. **Pagination**: Use cursor-based pagination for large datasets
5. **Caching**: Implement client-side caching for frequently accessed data

### Example Fragment

```graphql
fragment ThreatFields on Threat {
  id
  threatType
  severity
  detectedAt
  indicators
}

query {
  activeThreats: threats(status: ACTIVE, first: 10) {
    edges {
      node {
        ...ThreatFields
      }
    }
  }
  
  recentThreats: threats(first: 10) {
    edges {
      node {
        ...ThreatFields
      }
    }
  }
}
```

## Introspection

Query the schema for available types and fields:

```graphql
query {
  __schema {
    types {
      name
      description
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

## Rate Limits

GraphQL requests count against your rate limit. Complex queries may consume more tokens:
- Simple query: 1 token
- Moderate query: 5-10 tokens
- Complex query: 20+ tokens

---

## Support

For API support, contact: api-support@blockstop.io
