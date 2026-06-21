# Analytics API Reference - BlockStop Phase 29.3

## Overview

The Analytics API provides threat data aggregation, predictions, and analysis capabilities for BlockStop.

## Endpoints

### Threat Analytics

#### GET /api/analytics/threats

Retrieve threat statistics and analytics.

**Query Parameters:**
- `period` (string): `24h`, `7d`, `30d`, `90d` (default: `24h`)
- `type` (string, optional): Filter by threat type
- `severity` (string, optional): `low`, `medium`, `high`, `critical`

**Example:**
```bash
curl "http://localhost:3000/api/analytics/threats?period=7d&severity=high"
```

**Response:**
```json
{
  "period": "7d",
  "totalThreats": 245,
  "uniqueThreats": 32,
  "byType": {
    "phishing": 120,
    "malware": 85,
    "ransomware": 40
  },
  "bySeverity": {
    "critical": 5,
    "high": 35,
    "medium": 150,
    "low": 55
  },
  "bySource": {
    "email": 180,
    "network": 45,
    "endpoint": 20
  },
  "trend": {
    "direction": "decreasing",
    "percentChange": -15
  },
  "topThreats": [
    {
      "type": "phishing",
      "severity": "high",
      "count": 120,
      "lastSeen": "2024-01-20T14:30:00Z"
    }
  ],
  "timestamp": "2024-01-20T15:00:00Z"
}
```

#### POST /api/analytics/threats

Record a new threat event.

**Request Body:**
```json
{
  "type": "malware",
  "severity": "high",
  "source": "email_gateway",
  "target": "user@company.com",
  "count": 1
}
```

**Response:**
```json
{
  "success": true,
  "threat": {
    "timestamp": "2024-01-20T15:00:00Z",
    "type": "malware",
    "severity": "high",
    "source": "email_gateway",
    "target": "user@company.com",
    "count": 1
  }
}
```

### Threat Predictions

#### GET /api/analytics/predictions

Generate threat predictions for future periods.

**Query Parameters:**
- `period` (string): `7d`, `14d`, `30d` (default: `7d`)

**Example:**
```bash
curl "http://localhost:3000/api/analytics/predictions?period=14d"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predictionId": "pred-1705779600000",
    "period": "14d",
    "predictions": [
      {
        "date": "2024-01-21",
        "predictedThreats": 18,
        "confidence": 0.8,
        "lowerBound": 12.5,
        "upperBound": 23.5
      },
      {
        "date": "2024-01-22",
        "predictedThreats": 16,
        "confidence": 0.79,
        "lowerBound": 11.2,
        "upperBound": 20.8
      }
    ],
    "modelAccuracy": 0.82,
    "trainingDataPoints": 90,
    "anomalies": [
      {
        "date": "2024-01-25",
        "severity": "high",
        "description": "Predicted threat spike: 35 threats"
      }
    ],
    "recommendations": [
      "Increase monitoring during predicted high-threat periods",
      "Pre-stage additional security resources"
    ]
  },
  "timestamp": "2024-01-20T15:00:00Z"
}
```

#### POST /api/analytics/predictions

Request custom threat predictions with options.

**Request Body:**
```json
{
  "period": "30d",
  "includeAnomalies": true
}
```

### Evidence Retrieval

#### GET /api/hunting/evidence

Retrieve threat hunting evidence.

**Query Parameters:**
- `caseId` (string, optional): Filter by case ID
- `type` (string, optional): `file`, `memory`, `network`, `disk`, `log`

**Example:**
```bash
curl "http://localhost:3000/api/hunting/evidence?type=file"
```

**Response:**
```json
{
  "success": true,
  "evidence": [
    {
      "evidenceId": "evt-001",
      "type": "file",
      "source": "/var/log/auth.log",
      "description": "Authentication log",
      "hash": "a1b2c3d4e5f6...",
      "size": 2048000,
      "collectedAt": "2024-01-20T10:00:00Z",
      "collectedBy": "analyst@company.com",
      "chainOfCustody": [
        {
          "action": "collected",
          "timestamp": "2024-01-20T10:00:00Z",
          "actor": "analyst@company.com"
        }
      ]
    }
  ],
  "count": 1
}
```

#### POST /api/hunting/evidence

Add new evidence to investigation.

**Request Body:**
```json
{
  "type": "file",
  "source": "/etc/passwd",
  "description": "System password file",
  "hash": "abcd1234...",
  "size": 4096,
  "collectedBy": "analyst@company.com"
}
```

### Report Generation

#### POST /api/reporting/generate

Generate custom security report.

**Request Body:**
```json
{
  "reportType": "executive",
  "format": "pdf",
  "timeRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "includeCharts": true,
  "includeBranding": true
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "reportId": "report-1705779600000",
    "type": "executive",
    "format": "pdf",
    "generatedAt": "2024-01-20T15:00:00Z",
    "title": "Executive Security Report",
    "summary": {
      "totalFindings": 47,
      "criticalFindings": 3,
      "highFindings": 12
    }
  },
  "downloadUrl": "/api/reporting/download/report-1705779600000",
  "expiresAt": "2024-01-21T15:00:00Z"
}
```

## Data Models

### Threat Record

```typescript
{
  timestamp: Date;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  target?: string;
  count: number;
}
```

### Prediction

```typescript
{
  date: string;
  predictedThreats: number;
  confidence: number; // 0-1
  lowerBound: number;
  upperBound: number;
}
```

### Evidence

```typescript
{
  evidenceId: string;
  type: "file" | "memory" | "network" | "disk" | "log";
  source: string;
  description: string;
  hash: string;
  size: number;
  collectedAt: Date;
  collectedBy: string;
  chainOfCustody: Array<{
    action: string;
    timestamp: Date;
    actor: string;
  }>;
}
```

### Report Request

```typescript
{
  reportType: "executive" | "technical" | "forensics" | "hunting";
  format: "pdf" | "excel" | "json" | "csv";
  timeRange?: {
    start: Date;
    end: Date;
  };
  includeCharts?: boolean;
  includeBranding?: boolean;
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid period. Must be 7d, 14d, or 30d"
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to retrieve threat analytics"
}
```

## Rate Limiting

- **Standard Tier**: 100 requests/minute
- **Premium Tier**: 1000 requests/minute
- **Enterprise Tier**: Unlimited

## Authentication

All endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer your_api_token" \
  "http://localhost:3000/api/analytics/threats"
```

## Example Workflows

### Get Threat Summary and Predictions

```javascript
// Get current threats
const threats = await fetch('/api/analytics/threats?period=7d')
  .then(r => r.json());

// Get predictions
const predictions = await fetch('/api/analytics/predictions?period=7d')
  .then(r => r.json());

// Analyze together
const criticalThreats = threats.bySeverity.critical;
const predictedSpike = predictions.data.anomalies.length > 0;

if (predictedSpike && criticalThreats > 5) {
  console.warn("Potential escalation detected");
}
```

### Evidence Investigation

```javascript
// Get all evidence for type
const evidence = await fetch('/api/hunting/evidence?type=file')
  .then(r => r.json());

// Add new evidence
const newEvidence = await fetch('/api/hunting/evidence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'file',
    source: '/path/to/file',
    description: 'Suspicious file',
    hash: 'abc123...',
    size: 1024,
    collectedBy: 'analyst@company.com'
  })
}).then(r => r.json());
```

### Generate and Download Report

```javascript
// Generate report
const report = await fetch('/api/reporting/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reportType: 'executive',
    format: 'pdf',
    includeCharts: true
  })
}).then(r => r.json());

// Download
window.location.href = report.downloadUrl;
```

## Performance Tips

1. **Use appropriate time ranges** - Smaller ranges load faster
2. **Filter by severity** - Reduce result set size
3. **Cache predictions** - Reuse recent predictions
4. **Batch evidence requests** - Minimize API calls
5. **Schedule large reports** - Generate during off-peak hours

## Support

For API issues, contact: api-support@blockstop.io

