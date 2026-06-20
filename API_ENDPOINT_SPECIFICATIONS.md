# BlockStop API Endpoint Specifications
## Phases 27.2 & 27.3 - Detailed Route Specifications

---

## Phase 27.2: Analytics & Threat Intelligence (6 Endpoints)

### Endpoint 1: Analytics Dashboard Metrics
**Route:** `GET /api/analytics/dashboard-metrics`

#### Purpose
Retrieve comprehensive analytics dashboard metrics with KPIs, trends, and statistical summaries. This is the primary aggregation endpoint for the analytics dashboard.

#### Request
```typescript
// Query Parameters
interface DashboardMetricsQuery {
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;  // ISO 8601
  endDate?: string;    // ISO 8601
  format?: 'summary' | 'detailed';  // default: summary
  excludeCharts?: boolean;  // optimization flag
}
```

#### Response (200 OK)
```typescript
interface DashboardMetricsResponse {
  success: boolean;
  data: {
    timeRange: {
      from: Date;
      to: Date;
      granularity: 'hourly' | 'daily' | 'weekly';
    };
    threatMetrics: {
      total: number;
      byServerity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
      trend: {
        direction: 'up' | 'down' | 'stable';
        percentChange: number;
        previousPeriod: number;
      };
    };
    detectionMetrics: {
      detectionRate: number;  // percentage 0-100
      falsePositiveRate: number;
      truePositives: number;
      falsePositives: number;
      trend: TrendData[];
    };
    incidentMetrics: {
      openIncidents: number;
      resolvedToday: number;
      averageResolutionTime: number;  // minutes
    };
    riskScore: {
      overall: number;  // 0-100
      vulnerability: number;
      exposure: number;
      historical: number;
      benchmark: number;  // industry average
      trend: number;  // percentage change
    };
    topThreats: {
      threatId: number;
      name: string;
      type: string;
      count: number;
      severity: string;
      lastDetected: Date;
    }[];
    topSources: {
      country: string;
      threatCount: number;
      blockCount: number;
      riskScore: number;
      coordinates: [number, number];
    }[];
  };
  meta: {
    requestId: string;
    timestamp: Date;
    duration: number;
    version: string;
  };
}
```

#### Error Responses
```typescript
// 401 Unauthorized - missing/invalid auth
{
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Missing authorization header',
    statusCode: 401,
    requestId: string;
  }
}

// 403 Forbidden - insufficient tier
{
  success: false,
  error: {
    code: 'INSUFFICIENT_SCOPES',
    message: 'Feature requires PRO tier or higher',
    statusCode: 403,
    requestId: string;
  }
}

// 429 Too Many Requests
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    statusCode: 429,
    requestId: string;
    details: {
      limit: 60,
      remaining: 0,
      reset: 1718918400,
      retryAfter: 45
    }
  }
}
```

#### Implementation Notes
- Cache results for 5 minutes per org to reduce database load
- Support custom date ranges (max 2 years)
- Granularity automatically selected: hour (≤7 days), day (≤90 days), week (>90 days)
- Requires `analytics:read` scope
- Rate limits: PRO (60/min), NEO (300/min), MAX (unlimited)

---

### Endpoint 2: Threat Pattern Analysis
**Route:** `POST /api/analytics/threat-patterns`

#### Purpose
Analyze recent threat activity to identify patterns and behavioral signatures. Uses statistical clustering and ML models to detect repeated indicators and attack methodologies.

#### Request
```typescript
interface ThreatPatternRequest {
  // Time window for analysis
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  
  // Pattern detection options
  options: {
    minimumConfidence: number;  // 0-100, default: 70
    minimumFrequency: number;   // minimum matches, default: 5
    clusteringAlgorithm: 'kmeans' | 'dbscan' | 'hierarchical';
    includeRelatedCampaigns: boolean;  // cross-reference with known campaigns
  };
  
  // Filtering
  threatTypes?: string[];  // malware, phishing, ransomware, etc.
  severities?: ('critical' | 'high' | 'medium' | 'low')[];
  sources?: string[];  // countries or ASNs
  
  // Output options
  includeTimeline: boolean;
  includeCorrelations: boolean;
}
```

#### Response (200 OK)
```typescript
interface ThreatPatternResponse {
  success: boolean;
  data: {
    patterns: {
      patternId: string;
      name: string;  // auto-generated or user-defined
      description: string;
      indicators: {
        ioc: string;
        type: string;
        frequency: number;
        lastSeen: Date;
        confidence: number;
      }[];
      statistics: {
        matchCount: number;
        affectedResources: number;
        timeSpan: {
          firstMatch: Date;
          lastMatch: Date;
        };
        geographicDistribution: {
          country: string;
          matchCount: number;
        }[];
      };
      confidence: number;  // 0-100
      severity: 'critical' | 'high' | 'medium' | 'low';
      linkedCampaigns?: string[];  // campaign IDs if matched
      ttps?: string[];  // MITRE ATT&CK techniques
    }[];
    
    summary: {
      totalPatternsDetected: number;
      newPatterns: number;
      recurringPatterns: number;
      averageConfidence: number;
      topPatternsCount: number;
    };
    
    recommendations: {
      priority: 'critical' | 'high' | 'medium';
      action: string;
      expectedImpact: string;
    }[];
  };
  meta: {
    requestId: string;
    timestamp: Date;
    processingTime: number;  // ms
  };
}
```

#### HTTP Status Codes
- `200 OK` - Patterns successfully analyzed
- `202 Accepted` - Analysis queued (if large dataset, async processing)
- `400 Bad Request` - Invalid time range or options
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient tier (requires NEO/MAX)
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `analytics:read` scope
- Tier access: NEO (limited to 30 days), MAX (unlimited)
- Rate limit: 30 req/min
- For large datasets (>100k events), returns 202 and uses background processing
- Polling endpoint: `GET /api/analytics/threat-patterns/{jobId}`
- ML models cached and lazy-loaded on first use

---

### Endpoint 3: Threat Correlation Analysis
**Route:** `POST /api/analytics/correlation`

#### Purpose
Correlate multiple threats to identify relationships, common infrastructure, shared IOCs, or coordinated activity patterns. Discovers threat groupings and attack campaign connections.

#### Request
```typescript
interface ThreatCorrelationRequest {
  // Required: threats to correlate
  threatIds: number[];  // minimum 2, maximum 100
  
  // Correlation options
  correlationType?: 'temporal' | 'behavioral' | 'infrastructure' | 'all';
  
  // Time window for correlation
  timeWindow?: {
    startDate: Date;
    endDate: Date;
  };
  
  // Advanced options
  options?: {
    includeGraphVisualization: boolean;  // may increase response size
    includeAttributeComparison: boolean;
    calculateSimilarityScore: boolean;
    maxDepth: number;  // how many hops to follow relationships
  };
}
```

#### Response (200 OK)
```typescript
interface ThreatCorrelationResponse {
  success: boolean;
  data: {
    correlations: {
      correlationId: string;
      threatIds: number[];
      correlationType: 'temporal' | 'behavioral' | 'infrastructure';
      confidence: number;  // 0-100
      
      // Shared attributes
      commonAttributes: {
        sharedIOCs: {
          ioc: string;
          type: string;
          firstSeen: Date;
          lastSeen: Date;
        }[];
        sharedInfrastructure: {
          type: 'c2' | 'malware_hosting' | 'phishing' | 'other';
          indicator: string;
        }[];
        sharedTTPs: string[];  // MITRE ATT&CK
        temporalOverlap: {
          type: 'concurrent' | 'sequential' | 'overlapping';
          description: string;
        };
      };
      
      relationshipScore: number;  // 0-100
      estimatedRelationship: string;  // e.g., "likely same threat actor"
    }[];
    
    groupings: {
      groupId: string;
      threatIds: number[];
      correlationScore: number;
      commonPattern: string;
      estimatedCampaign?: string;
      confidence: number;
      severity: 'critical' | 'high' | 'medium' | 'low';
    }[];
    
    graph?: {
      nodes: {
        id: string;
        type: 'threat' | 'campaign' | 'ioc' | 'infrastructure';
        label: string;
        severity: string;
      }[];
      edges: {
        source: string;
        target: string;
        type: string;
        weight: number;
        confidence: number;
      }[];
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
    correlationsFound: number;
    groupingsIdentified: number;
  };
}
```

#### HTTP Status Codes
- `200 OK` - Correlation analysis complete
- `400 Bad Request` - Invalid threat IDs or parameters
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient tier (requires NEO for limited, MAX for full)
- `404 Not Found` - One or more threat IDs not found
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `analytics:read` scope
- Tier access: NEO (≤10 threats at a time), MAX (≤100)
- Rate limit: 20 req/min
- Uses graph database (or in-memory graph if using PostgreSQL)
- Results cached for 1 hour per unique threat set
- Graph visualization adds ~50-200ms to response time

---

### Endpoint 4: Security Health Score
**Route:** `GET /api/analytics/health-score`

#### Purpose
Calculate and return organization's security health score across multiple dimensions. Provides actionable insights and recommendations for improving security posture.

#### Request
```typescript
// Query Parameters
interface HealthScoreQuery {
  detailed?: boolean;  // include component breakdown
  includeTrends?: boolean;  // historical trend data
  trendDays?: number;  // default: 30
  includeRecommendations?: boolean;  // default: true
}
```

#### Response (200 OK)
```typescript
interface HealthScoreResponse {
  success: boolean;
  data: {
    organization: {
      id: number;
      name: string;
      tier: 'PRO' | 'NEO' | 'MAX';
    };
    
    overallScore: {
      score: number;  // 0-100
      rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      trend: {
        direction: 'improving' | 'stable' | 'declining';
        percentChange: number;
        previousScore: number;
      };
      benchmark: {
        industryAverage: number;
        percentile: number;  // 1-100
      };
    };
    
    components: {
      detection: {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        metrics: {
          detectionRate: number;
          mtd: number;  // mean time to detect (hours)
          threatsCoverage: number;  // percentage of threats detected
        };
      };
      prevention: {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        metrics: {
          blockRate: number;
          mtblpr: number;  // mean time between preventable attacks (days)
          securityToolCoverage: number;
        };
      };
      response: {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        metrics: {
          mttc: number;  // mean time to contain (hours)
          mttr: number;  // mean time to resolve (hours)
          automationLevel: number;  // percentage
        };
      };
      visibility: {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        metrics: {
          loggingCoverage: number;
          logRetentionDays: number;
          integrationCount: number;
        };
      };
    };
    
    trends?: {
      dates: Date[];
      scores: number[];
      components: Record<string, number[]>;
    };
    
    recommendations: {
      priority: 'critical' | 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      estimatedImpactPoints: number;  // expected score improvement
      estimatedEffort: 'low' | 'medium' | 'high';
      action: string;
    }[];
  };
  meta: {
    requestId: string;
    timestamp: Date;
    lastCalculated: Date;
    nextUpdate: Date;
  };
}
```

#### HTTP Status Codes
- `200 OK` - Health score successfully calculated
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Access denied
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `analytics:read` scope
- Tier access: PRO+ (all tiers)
- Rate limit: 300 req/min (high because commonly polled)
- Results cached for 1 hour
- Calculation includes last 90 days of data
- Recommendations cached separately, regenerated weekly

---

### Endpoint 5: Report Generation & Export
**Route:** `POST /api/analytics/exports`

#### Purpose
Generate comprehensive analytical reports in multiple formats. Supports scheduled/recurring exports and email delivery for enterprise users.

#### Request
```typescript
interface ExportRequest {
  // Report configuration
  reportType: 'threat-summary' | 'incident-report' | 'compliance' | 'executive' | 'custom';
  
  // Time range
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  
  // Format options
  format: 'pdf' | 'xlsx' | 'csv' | 'json';
  
  // Content options
  content: {
    includeThreatData: boolean;
    includeCharts: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    customTitle?: string;
    customHeader?: string;
    customFooter?: string;
  };
  
  // Compliance options
  compliance?: {
    framework: 'pci-dss' | 'hipaa' | 'gdpr' | 'sox' | 'cis';
    includeGaps: boolean;
  };
  
  // Delivery options
  delivery?: {
    format: 'immediate' | 'email' | 'sftp' | 'webhook';
    recipients?: string[];
    scheduleRecurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      dayOfWeek?: number;
      dayOfMonth?: number;
      time?: string;
    };
  };
}
```

#### Response (202 Accepted)
```typescript
interface ExportResponse {
  success: boolean;
  data: {
    exportId: string;  // polling identifier
    status: 'processing' | 'queued' | 'completed' | 'failed';
    reportType: string;
    format: string;
    estimatedCompletionTime: number;  // seconds
    
    // When completed
    result?: {
      url: string;
      fileName: string;
      size: number;  // bytes
      expiresAt: Date;
      downloadToken: string;
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
  };
}
```

#### Polling Endpoint
**Route:** `GET /api/analytics/exports/{exportId}`

```typescript
interface ExportStatusResponse {
  success: boolean;
  data: {
    exportId: string;
    status: 'processing' | 'completed' | 'failed';
    progress?: number;  // 0-100
    result?: {
      url: string;
      expiresAt: Date;
    };
    error?: {
      code: string;
      message: string;
    };
  };
}
```

#### HTTP Status Codes
- `202 Accepted` - Export job queued successfully
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient tier (requires PRO+)
- `413 Payload Too Large` - Time range too large
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `analytics:read` scope
- Tier access: PRO (basic formats/summary), NEO (all), MAX (all + scheduled)
- Rate limit: 10 req/min
- Async processing: returns 202, client polls for completion
- Results stored for 7 days then deleted
- Large exports may take 5-30 minutes
- For scheduled exports, requires recurring payment

---

### Endpoint 6: Threat Predictions & Forecasting
**Route:** `GET /api/analytics/predictions`

#### Purpose
Provide ML-driven threat predictions based on historical data, patterns, and global threat intelligence. Forecasts future threat volumes and types.

#### Request
```typescript
// Query Parameters
interface PredictionQuery {
  threatType?: string;  // malware, phishing, ransomware, etc.
  period: 'next-week' | 'next-month' | 'next-quarter';
  includeConfidenceInterval?: boolean;
  includeFactors?: boolean;
  limit?: number;  // top N predictions
}
```

#### Response (200 OK)
```typescript
interface PredictionResponse {
  success: boolean;
  data: {
    predictions: {
      predictionId: string;
      threatType: string;
      predictionPeriod: Date[];  // start and end dates
      
      forecast: {
        expectedCount: number;
        confidenceInterval: {
          lower: number;
          upper: number;
          confidence: number;  // 0.8 = 80% confidence interval
        };
        likelihood: number;  // 0-100
        trend: 'increasing' | 'stable' | 'decreasing';
      };
      
      factors: {
        name: string;
        contribution: number;  // percentage of total prediction
        weight: number;  // 0-1
        description: string;
      }[];
      
      historicalContext: {
        averageCountLastPeriod: number;
        averageCountLastYear: number;
        trend: number;  // percentage
      };
      
      recommendations: {
        priority: 'critical' | 'high' | 'medium' | 'low';
        action: string;
        expectedMitigationValue: number;  // percentage reduction
      }[];
      
      modelMetadata: {
        modelVersion: string;
        lastTraining: Date;
        accuracy: number;  // historical accuracy of this model
      };
    }[];
    
    summary: {
      overallThreatTrend: 'increasing' | 'stable' | 'decreasing';
      highestRiskType: string;
      mostLikelyPeriod: string;  // e.g., "Q3 2024"
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
    modelVersion: string;
  };
}
```

#### HTTP Status Codes
- `200 OK` - Predictions successfully generated
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient tier (requires MAX only)
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `analytics:read` scope
- Tier access: MAX only (exclusive feature)
- Rate limit: 60 req/min
- Uses ensemble ML models (neural nets + time series forecasting)
- Results cached for 24 hours
- Models retrained weekly with new data
- Confidence intervals based on model uncertainty estimation

---

## Phase 27.3: Enterprise Features (6 Endpoints)

### Endpoint 1: Organization Management
**Route:** `GET /api/enterprise/organizations`

#### Purpose
List and retrieve organization configurations. Admin-only endpoint for multi-tenant management.

#### Request
```typescript
// Query Parameters
interface OrganizationQuery {
  search?: string;  // search by name
  tier?: 'PRO' | 'NEO' | 'MAX';
  status?: 'active' | 'suspended' | 'archived';
  limit?: number;  // default: 50, max: 100
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'tier';
  sortOrder?: 'asc' | 'desc';
}
```

#### Response (200 OK)
```typescript
interface OrganizationListResponse {
  success: boolean;
  data: {
    organizations: {
      id: string;
      name: string;
      slug: string;
      tier: 'PRO' | 'NEO' | 'MAX';
      status: 'active' | 'suspended' | 'archived';
      userCount: number;
      scanCount: number;
      createdAt: Date;
      updatedAt: Date;
      ssoEnabled: boolean;
      features: {
        analytics: boolean;
        threatIntel: boolean;
        whitelabeling: boolean;
        customIntegrations: boolean;
      };
    }[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
  };
}
```

#### HTTP Status Codes
- `200 OK` - Organizations successfully retrieved
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions (requires admin)
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `org:admin` scope
- Tier access: MAX only
- Rate limit: 300 req/min
- Audit logged for compliance
- Supports cursor pagination for large result sets

---

### Endpoint 2: Role-Based Access Control Management
**Route:** `POST /api/enterprise/rbac/roles`

#### Purpose
Create custom roles with granular permissions for organization-specific access control.

#### Request
```typescript
interface RoleCreationRequest {
  name: string;  // "Security Analyst", "Audit Manager", etc.
  description: string;
  
  permissions: {
    resource: string;  // 'threats', 'scans', 'reports', 'organization'
    actions: ('read' | 'write' | 'delete' | 'admin' | 'execute')[];
    
    fieldLevelAccess?: {
      fields: string[];
      allowed: boolean;
    }[];
    
    conditions?: {
      timeBasedAccess?: {
        daysOfWeek: number[];
        startTime: string;  // HH:mm
        endTime: string;    // HH:mm
      };
      dataScope?: 'own' | 'team' | 'organization';  // scoped data access
      ipRestriction?: string[];
    };
  }[];
}
```

#### Response (201 Created)
```typescript
interface RoleResponse {
  success: boolean;
  data: {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    permissions: {
      resource: string;
      actions: string[];
      conditions?: Record<string, unknown>;
    }[];
    isCustom: true;
    createdAt: Date;
    createdBy: string;
    memberCount: number;
  };
  meta: {
    requestId: string;
    timestamp: Date;
  };
}
```

#### HTTP Status Codes
- `201 Created` - Role successfully created
- `400 Bad Request` - Invalid permission structure
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions
- `409 Conflict` - Role name already exists
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `org:admin` scope
- Tier access: MAX only
- Rate limit: 50 req/min
- Audit logged with full permission details
- Max 100 custom roles per organization
- Built-in roles (Admin, Analyst, Auditor, Viewer) cannot be modified

---

### Endpoint 3: SSO Configuration
**Route:** `POST /api/enterprise/sso/configure`

#### Purpose
Configure SSO/SAML provider for organization. Enables federated authentication.

#### Request
```typescript
interface SSOConfigurationRequest {
  provider: 'okta' | 'azure-ad' | 'google-workspace' | 'custom';
  
  config: {
    // Standard SAML fields
    entityId: string;  // Service Provider Entity ID
    assertionConsumerServiceUrl: string;  // ACS URL
    singleLogoutUrl?: string;
    
    // Identity Provider config
    identityProviderEntityId: string;
    identityProviderSSOUrl: string;
    publicCertificate: string;  // PEM format
    
    // Provider-specific
    clientId?: string;  // for OAuth providers
    clientSecret?: string;  // encrypted
    
    // Advanced options
    encryptionEnabled: boolean;
    signatureAlgorithm: 'sha1' | 'sha256' | 'sha512';
    nameIdFormat: 'emailAddress' | 'persistent' | 'transient';
    
    // Group mapping
    groupAttribute?: string;
    groupMapping?: {
      samlGroup: string;
      blockStopRole: string;
    }[];
  };
  
  // Organization settings
  enforced: boolean;  // require SSO for all users
  allowLocalFallback: boolean;  // allow password auth if SSO fails
}
```

#### Response (201 Created)
```typescript
interface SSOConfigResponse {
  success: boolean;
  data: {
    id: string;
    organizationId: string;
    provider: string;
    enabled: true;
    enforced: boolean;
    
    // Metadata for IdP configuration
    metadata: {
      entityId: string;
      acsUrl: string;
      sloUrl?: string;
      certificate: string;
      metadataXml: string;  // full SAML metadata
    };
    
    status: 'configured';
    validatedAt: Date;
    createdAt: Date;
  };
  meta: {
    requestId: string;
    timestamp: Date;
  };
}
```

#### HTTP Status Codes
- `201 Created` - SSO successfully configured
- `200 OK` - SSO updated
- `400 Bad Request` - Invalid configuration
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions
- `422 Unprocessable Entity` - Certificate validation failed
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `org:admin` scope
- Tier access: MAX only
- Rate limit: 10 req/min
- Validation: Calls IdP metadata endpoint to verify connectivity
- Returns SAML metadata for IdP configuration
- Audit logged with before/after state (secrets redacted)
- Configuration cached for 1 hour

---

### Endpoint 4: Audit Log Retrieval
**Route:** `GET /api/enterprise/audit-logs`

#### Purpose
Retrieve organization audit logs with filtering and pagination for compliance and security reviews.

#### Request
```typescript
// Query Parameters
interface AuditLogQuery {
  // Filtering
  action?: string;  // create, delete, role_assignment, sso_configured
  resource?: string;  // user, role, integration, organization
  userId?: string;
  startDate?: string;  // ISO 8601
  endDate?: string;    // ISO 8601
  ipAddress?: string;
  status?: 'success' | 'failure';
  
  // Pagination
  limit?: number;  // default: 100, max: 1000
  offset?: number;
  cursor?: string;  // for cursor-based pagination
  
  // Sorting
  sortBy?: 'timestamp' | 'action' | 'user';
  sortOrder?: 'asc' | 'desc';
}
```

#### Response (200 OK)
```typescript
interface AuditLogResponse {
  success: boolean;
  data: {
    logs: {
      id: string;
      timestamp: Date;
      action: string;
      resource: string;
      resourceId?: string;
      userId?: string;
      userName?: string;
      status: 'success' | 'failure';
      ipAddress: string;
      userAgent: string;
      
      // Change tracking
      changes?: {
        before: Record<string, unknown>;
        after: Record<string, unknown>;
        changesSummary: string;
      };
      
      details?: Record<string, unknown>;
    }[];
    
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      cursor?: string;
      nextCursor?: string;
    };
  };
  meta: {
    requestId: string;
    timestamp: Date;
    retentionDays: number;  // org setting
  };
}
```

#### HTTP Status Codes
- `200 OK` - Logs successfully retrieved
- `400 Bad Request` - Invalid filter parameters
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions (requires auditor role)
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `audit:read` scope (only Auditor/Admin roles)
- Tier access: MAX only
- Rate limit: 300 req/min
- Immutable logs: stored separately, never modified
- Retention: configurable per organization (default: 90 days)
- Pagination: supports both offset and cursor-based
- Large queries (>30 days) may trigger async processing

---

### Endpoint 5: API Key Management
**Route:** `POST /api/enterprise/api-management/keys`

#### Purpose
Create and manage API keys for organization. Keys have org-level rate limits and permissions.

#### Request
```typescript
interface APIKeyCreationRequest {
  name: string;
  
  scopes: (
    | 'analytics:read'
    | 'threats:read'
    | 'threats:write'
    | 'scans:read'
    | 'scans:write'
    | 'audit:read'
    | 'org:admin'
    | 'webhooks:manage'
    | 'integrations:manage'
  )[];
  
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstAllowance: number;
  };
  
  ipWhitelist?: string[];  // CIDR notation
  
  expiresIn?: number;  // days, null for no expiration (not recommended)
}
```

#### Response (201 Created)
```typescript
interface APIKeyResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    key: string;  // pk_org_xxx (only returned here)
    secret: string;  // sk_org_xxx (only returned here, never again)
    scopes: string[];
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: null;
  };
  meta: {
    requestId: string;
    timestamp: Date;
    warning: 'Save this key securely. You will not be able to view the secret again.';
  };
}
```

#### HTTP Status Codes
- `201 Created` - API key successfully created
- `400 Bad Request` - Invalid scopes
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions (requires org admin)
- `429 Too Many Requests` - Rate limited

#### Implementation Notes
- Requires `org:admin` scope
- Tier access: MAX only
- Rate limit: 50 req/min
- Keys follow format: `pk_[org_id]_[random_string]`
- Secrets never stored in plaintext: hashed with bcrypt
- Audit logged on creation
- Max 100 active keys per organization
- Keys support both org-level and project-level scopes

---

### Endpoint 6: Webhook Management
**Route:** `POST /api/enterprise/webhooks`

#### Purpose
Configure webhooks for event notifications. Supports delivery to external systems and retry logic.

#### Request
```typescript
interface WebhookCreationRequest {
  url: string;  // must be HTTPS in production
  
  events: (
    | 'threat.detected'
    | 'threat.updated'
    | 'threat.resolved'
    | 'scan.completed'
    | 'alert.triggered'
    | 'user.created'
    | 'user.deleted'
    | 'role.changed'
    | 'integration.connected'
    | 'integration.failed'
  )[];
  
  headers?: Record<string, string>;  // custom headers
  
  retryPolicy?: {
    maxRetries: number;  // default: 5
    initialDelayMs: number;  // default: 1000
    maxDelayMs: number;  // default: 60000
    backoffMultiplier: number;  // default: 2
  };
  
  active: boolean;  // default: true
}
```

#### Response (201 Created)
```typescript
interface WebhookResponse {
  success: boolean;
  data: {
    id: string;
    organizationId: string;
    url: string;
    events: string[];
    secret: string;  // for HMAC signature verification
    active: true;
    
    delivery: {
      retryPolicy: {
        maxRetries: number;
        initialDelayMs: number;
      };
      lastDeliveryAt?: Date;
      lastDeliveryStatus?: 'success' | 'failed';
      failureCount: number;
    };
    
    createdAt: Date;
    updatedAt: Date;
  };
  meta: {
    requestId: string;
    timestamp: Date;
  };
}
```

#### HTTP Status Codes
- `201 Created` - Webhook successfully created
- `400 Bad Request` - Invalid URL or events
- `401 Unauthorized` - Auth failed
- `403 Forbidden` - Insufficient permissions
- `422 Unprocessable Entity` - URL not reachable
- `429 Too Many Requests` - Rate limited

#### Webhook Payload Format
```typescript
interface WebhookPayload {
  id: string;  // delivery ID
  timestamp: Date;
  event: string;  // event type
  organizationId: string;
  data: {
    resourceType: string;
    resourceId: string;
    action: string;
    changes?: Record<string, unknown>;
  };
  signature: string;  // HMAC-SHA256(payload, secret)
}
```

#### Implementation Notes
- Requires `webhooks:manage` scope
- Tier access: MAX only
- Rate limit: 30 req/min
- Webhook delivery retries with exponential backoff
- Max 50 webhooks per organization
- Payload signed with organization secret
- Delivery timeout: 30 seconds
- All webhook events logged for audit trail
- Failed deliveries queued for manual retry

---

## Cross-Phase Integration Points

### Shared Infrastructure
1. **Authentication:** All endpoints use same `APIMiddleware` for auth
2. **Rate Limiting:** Org-level limits enforced via `rateLimiter` service
3. **Audit Logging:** All state-changing operations logged via `AuditLogger`
4. **Error Handling:** Standardized error responses across all endpoints
5. **Response Format:** Consistent `{ success, data, meta }` structure

### Tier-Based Gateway Pattern
```typescript
// Applied to all endpoints
async function tierGate(context: APIContext, requiredTier: Tier) {
  if (!isAccessible(context.tier, requiredTier)) {
    throw new APIError('Insufficient tier', 403);
  }
}
```

### Database Query Patterns
- All queries filtered by `organization_id` for multi-tenancy
- Indexes on `(organization_id, created_at)` for log retrieval
- Full-text search on `threat_patterns` and `audit_logs` tables
- Partitioning by date for large audit log table (monthly partitions)

---

## Testing Checklist

- [ ] Test all rate limit boundaries per tier
- [ ] Verify org isolation in multi-tenant queries
- [ ] Test async export processing and polling
- [ ] Validate SAML/OAuth flows with sample IdPs
- [ ] Audit log immutability verification
- [ ] API key secret rotation testing
- [ ] Webhook retry logic with various failure scenarios
- [ ] Performance testing on large datasets (100k+ events)
- [ ] Permission matrix validation for custom roles

