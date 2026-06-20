# BlockStop GraphQL API Guide

## Overview

The BlockStop GraphQL API provides a flexible, efficient alternative to REST APIs. Use GraphQL to request exactly the data you need, reduce over-fetching, and combine multiple operations in a single request.

**Endpoint**: `https://api.blockstop.io/v1/graphql`  
**Authentication**: Bearer Token (API Key or OAuth2)  
**GraphQL Version**: 2024-01-01

---

## Getting Started

### Making Your First Query

```bash
curl -X POST https://api.blockstop.io/v1/graphql \
  -H "Authorization: Bearer sk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ user { id email name } }"
  }'
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

## Schema Reference

### Query Type

Root query object for fetching data.

```graphql
type Query {
  # Fetch threats with filtering and pagination
  threats(
    limit: Int
    offset: Int
    severity: String
    source: String
  ): ThreatConnection!
  
  # Fetch single threat by ID
  threat(id: ID!): Threat
  
  # Fetch files with pagination
  files(
    limit: Int
    offset: Int
    scan_result: String
  ): FileConnection!
  
  # Fetch single file by ID
  file(id: ID!): File
  
  # Fetch all connected integrations
  integrations: [Integration!]!
  
  # Fetch single integration by ID
  integration(id: ID!): Integration
  
  # Fetch all webhooks
  webhooks: [Webhook!]!
  
  # Fetch single webhook by ID
  webhook(id: ID!): Webhook
  
  # Fetch API keys
  apiKeys: [APIKey!]!
  
  # Fetch current user
  user: User!
  
  # Health check
  health: HealthStatus!
}
```

### Mutation Type

Root mutation object for modifying data.

```graphql
type Mutation {
  # Webhook management
  createWebhook(input: CreateWebhookInput!): Webhook!
  updateWebhook(id: ID!, input: UpdateWebhookInput!): Webhook!
  deleteWebhook(id: ID!): Boolean!
  
  # Integration management
  connectIntegration(id: String!, credentials: JSON): Integration!
  disconnectIntegration(id: String!): Boolean!
  
  # API key management
  createAPIKey(name: String!, scopes: [String!]!): APIKey!
  revokeAPIKey(id: ID!): Boolean!
}
```

### Types

#### Threat

```graphql
type Threat {
  id: ID!
  type: String!              # malware, phishing, spam, etc.
  severity: String!          # critical, high, medium, low
  source: String!            # email, file, url, network
  detected_at: String!       # ISO 8601 timestamp
  resolved_at: String        # ISO 8601 timestamp
  details: JSON             # Additional threat metadata
}
```

#### ThreatConnection

Pagination wrapper for threats.

```graphql
type ThreatConnection {
  edges: [ThreatEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type ThreatEdge {
  node: Threat!
  cursor: String!
}
```

#### File

```graphql
type File {
  id: ID!
  name: String!
  size: Int!
  mime_type: String!
  scan_result: String!       # clean, infected, suspicious, unknown
  scanned_at: String!        # ISO 8601 timestamp
  threat: Threat             # Associated threat if found
  details: JSON              # Scan details and metadata
}
```

#### FileConnection

```graphql
type FileConnection {
  edges: [FileEdge!]!
  pageInfo: PageInfo!
  total: Int!
}

type FileEdge {
  node: File!
  cursor: String!
}
```

#### Integration

```graphql
type Integration {
  id: ID!
  name: String!
  type: String!              # communication, ticketing, siem, etc.
  status: String!            # connected, disconnected, error
  connected_at: String
  last_sync: String
  config: JSON               # Integration configuration
  health: IntegrationHealth  # Health status
}

type IntegrationHealth {
  status: String!            # healthy, degraded, error
  last_check: String!
  error_message: String
  sync_stats: JSON
}
```

#### Webhook

```graphql
type Webhook {
  id: ID!
  url: String!
  events: [String!]!         # threat.detected, file.scanned, etc.
  active: Boolean!
  created_at: String!
  last_triggered_at: String
  description: String
  headers: JSON             # Custom headers
}
```

#### APIKey

```graphql
type APIKey {
  id: ID!
  name: String!
  key_prefix: String!       # Only prefix visible for security
  scopes: [String!]!
  created_at: String!
  expires_at: String
  last_used_at: String
}
```

#### User

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  plan: String!             # free, pro, enterprise
  created_at: String!
  updated_at: String!
}
```

#### HealthStatus

```graphql
type HealthStatus {
  status: String!           # healthy, degraded, unhealthy
  timestamp: String!
  version: String!
  services: JSON            # Service health details
}
```

#### PageInfo

```graphql
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Input Types

#### CreateWebhookInput

```graphql
input CreateWebhookInput {
  url: String!
  events: [String!]!
  description: String
  headers: JSON
  active: Boolean
}
```

#### UpdateWebhookInput

```graphql
input UpdateWebhookInput {
  url: String
  events: [String!]
  description: String
  headers: JSON
  active: Boolean
}
```

---

## Common Queries

### Fetch All Threats

```graphql
query {
  threats(limit: 20, offset: 0) {
    edges {
      node {
        id
        type
        severity
        source
        detected_at
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    total
  }
}
```

### Fetch Threat with Details

```graphql
query {
  threat(id: "threat_abc123") {
    id
    type
    severity
    source
    detected_at
    details
  }
}
```

### Fetch Files by Type

```graphql
query {
  files(limit: 50, scan_result: "infected") {
    edges {
      node {
        id
        name
        size
        scan_result
        threat {
          id
          type
          severity
        }
      }
    }
    total
  }
}
```

### Fetch User and Integrations

Combine multiple queries in one request:

```graphql
query {
  user {
    id
    email
    name
    plan
  }
  
  integrations {
    id
    name
    status
    connected_at
  }
}
```

### Fetch Webhooks with Events

```graphql
query {
  webhooks {
    id
    url
    events
    active
    created_at
    last_triggered_at
  }
}
```

---

## Common Mutations

### Create Webhook

```graphql
mutation {
  createWebhook(input: {
    url: "https://example.com/webhooks/threats"
    events: ["threat.detected", "threat.resolved"]
    description: "Main threat webhook"
    active: true
  }) {
    id
    url
    events
    created_at
  }
}
```

### Update Webhook

```graphql
mutation {
  updateWebhook(
    id: "wh_123"
    input: {
      events: ["threat.detected", "file.scanned"]
      active: true
    }
  ) {
    id
    events
    active
    updated_at
  }
}
```

### Delete Webhook

```graphql
mutation {
  deleteWebhook(id: "wh_123")
}
```

### Create API Key

```graphql
mutation {
  createAPIKey(
    name: "Integration Key"
    scopes: ["webhooks:write", "integrations:read"]
  ) {
    id
    name
    key_prefix
    scopes
    created_at
  }
}
```

### Connect Integration

```graphql
mutation {
  connectIntegration(
    id: "jira"
    credentials: {
      url: "https://company.atlassian.net"
      email: "user@company.com"
      api_token: "token"
    }
  ) {
    id
    name
    status
    connected_at
  }
}
```

### Disconnect Integration

```graphql
mutation {
  disconnectIntegration(id: "slack")
}
```

---

## Pagination

Use cursor-based pagination for efficient data fetching.

```graphql
query {
  threats(limit: 20, offset: 0) {
    edges {
      node {
        id
        type
        severity
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    total
  }
}
```

**Parameters:**
- `limit`: Items per page (default: 50, max: 100)
- `offset`: Starting position (default: 0)

---

## Variables and Aliases

### Using Variables

```graphql
query GetThreats($limit: Int!, $severity: String) {
  threats(limit: $limit, severity: $severity) {
    edges {
      node {
        id
        type
        severity
      }
    }
  }
}
```

**Variables JSON:**
```json
{
  "limit": 20,
  "severity": "high"
}
```

### Using Aliases

Fetch multiple datasets in one query:

```graphql
query {
  criticalThreats: threats(severity: "critical", limit: 10) {
    total
  }
  
  highThreats: threats(severity: "high", limit: 10) {
    total
  }
  
  mediumThreats: threats(severity: "medium", limit: 10) {
    total
  }
}
```

---

## Error Handling

GraphQL errors are returned with the response:

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED` - Missing or invalid credentials
- `FORBIDDEN` - Insufficient permissions
- `BAD_REQUEST` - Invalid query syntax
- `NOT_FOUND` - Resource not found
- `GRAPHQL_ERROR` - General GraphQL error
- `INTERNAL_SERVER_ERROR` - Server error

---

## Introspection

Query the schema to discover available types and fields:

```graphql
query {
  __schema {
    queryType {
      name
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
}
```

---

## Best Practices

1. **Use Variables for Dynamic Values**
   ```graphql
   query GetThreat($id: ID!) {
     threat(id: $id) {
       id
       type
     }
   }
   ```

2. **Request Only Required Fields**
   ```graphql
   # Good - only needed fields
   query {
     threats(limit: 10) {
       edges {
         node {
           id
           type
         }
       }
     }
   }
   ```

3. **Use Aliases for Multiple Requests**
   Instead of multiple queries, use aliases to get different data in one request.

4. **Implement Error Handling**
   Always check for errors in responses, even successful HTTP 200 responses.

5. **Cache Responses**
   Use HTTP caching headers and implement client-side caching for frequently requested data.

---

## Examples

See the examples directory for complete implementations in JavaScript, Python, and Node.js.
