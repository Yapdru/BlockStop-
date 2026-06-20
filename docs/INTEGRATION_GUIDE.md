# BlockStop Integration Guide

## Overview

BlockStop provides pre-built integrations with popular enterprise security and incident management platforms. This guide covers:

- SIEM Integrations (Splunk, ELK, Datadog, New Relic)
- Incident Response (ServiceNow, Jira, PagerDuty)
- Communication (Slack, Teams, Discord, Telegram)
- Threat Intelligence (VirusTotal, AlienVault, Recorded Future)
- Cloud Platforms (AWS, Azure, GCP)

---

## SIEM Integrations

### Splunk

#### Setup

1. In BlockStop admin panel, go to **Integrations** > **SIEM**
2. Click **Configure Splunk**
3. Enter your Splunk instance URL and HTTP Event Collector token

#### Configuration

```json
{
  "apiEndpoint": "https://splunk.example.com:8089",
  "apiKey": "your-hec-token",
  "index": "blockstop_threats",
  "sourcetype": "_json"
}
```

#### Data Flow

BlockStop threats are sent to Splunk with the following fields:

```
{
  "threatId": "threat-001",
  "threatType": "phishing",
  "severity": "high",
  "status": "open",
  "source": "email",
  "senderEmail": "attacker@example.com",
  "timestamp": "2024-06-18T10:00:00Z",
  "indicators": ["malicious.com"],
  "analysis": {
    "spamScore": 0.95,
    "phishingScore": 0.87
  }
}
```

#### Splunk Queries

```spl
index=blockstop_threats severity=high status=open
| stats count by threatType
```

```spl
index=blockstop_threats source=email
| timechart count(threatId) by severity
```

---

### Elasticsearch

#### Setup

1. In BlockStop admin panel, go to **Integrations** > **SIEM**
2. Click **Configure Elasticsearch**
3. Enter your Elasticsearch endpoint and credentials

#### Configuration

```json
{
  "apiEndpoint": "https://elastic.example.com:9200",
  "username": "elastic",
  "password": "password",
  "index": "blockstop-threats"
}
```

#### Kibana Dashboard Example

```json
{
  "dashboard": {
    "title": "BlockStop Threats Overview",
    "panels": [
      {
        "title": "Threats by Severity",
        "visualization": "pie",
        "field": "severity"
      },
      {
        "title": "Threats Over Time",
        "visualization": "line",
        "timeField": "timestamp"
      }
    ]
  }
}
```

---

### Datadog

#### Setup

1. Create a Datadog API key and App key
2. In BlockStop, configure with API endpoint and keys
3. BlockStop will send custom events to Datadog

#### Configuration

```json
{
  "apiKey": "your-datadog-api-key",
  "appKey": "your-datadog-app-key",
  "site": "datadoghq.com"
}
```

#### Custom Metrics

BlockStop sends the following custom events:

- `blockstop.threat.detected`
- `blockstop.threat.severity.critical`
- `blockstop.threat.source.email`

---

### New Relic

#### Setup

1. Create New Relic Insert API key
2. Configure BlockStop with your account ID
3. Threats appear as custom events

#### Configuration

```json
{
  "apiKey": "your-nr-insert-key",
  "accountId": "123456"
}
```

---

## Incident Response Integrations

### Jira

#### Setup

1. Create Jira API token
2. In BlockStop, go to **Integrations** > **Incident Management**
3. Click **Configure Jira**
4. Enter instance URL, API key, and project key

#### Configuration

```json
{
  "apiEndpoint": "https://jira.example.com",
  "apiKey": "your-api-token",
  "projectKey": "SEC"
}
```

#### Auto-Create Issues

When enabled, BlockStop automatically creates Jira issues for:
- Critical threats
- High severity threats (configurable)
- Threats from specific sources

#### Custom Issue Types

Create a custom Jira issue type "Security Threat" with fields:
- Threat ID
- Threat Type
- Severity
- Source
- Indicators

---

### ServiceNow

#### Setup

1. Create ServiceNow API user account
2. In BlockStop, configure with instance URL and API key
3. Map threat types to incident categories

#### Configuration

```json
{
  "apiEndpoint": "https://dev123456.service-now.com",
  "apiKey": "your-api-key",
  "assignmentGroup": "Security Team"
}
```

#### Incident Mapping

```javascript
{
  "threat.type": {
    "phishing": "Incident",
    "malware": "Problem",
    "ransomware": "Critical Problem"
  },
  "threat.severity": {
    "critical": 1,
    "high": 2,
    "medium": 3,
    "low": 4
  }
}
```

---

### PagerDuty

#### Setup

1. Create PagerDuty integration key
2. In BlockStop, configure with routing key
3. Incidents appear in PagerDuty with proper escalation

#### Configuration

```json
{
  "routingKey": "your-integration-key",
  "serviceId": "pXXXXXX"
}
```

---

## Communication Integrations

### Slack

#### Setup

1. Create Slack incoming webhook in your workspace
2. In BlockStop, click **Configure Slack**
3. Paste webhook URL

#### Configuration

```json
{
  "webhook": "https://hooks.slack.com/services/...",
  "channel": "#security-alerts"
}
```

#### Message Format

Threats appear as rich Slack messages with:
- Color-coded severity
- Threat details
- Quick action buttons
- Timestamp

#### Example Message

```
🚨 CRITICAL - Phishing Email Detected

Threat ID: threat-001
Type: Phishing
Severity: Critical
Source: Email
Sender: attacker@malicious.com

Indicators:
- malicious.com
- attacker@malicious.com
```

---

### Microsoft Teams

#### Setup

1. Create Teams incoming webhook
2. In BlockStop, configure with webhook URL
3. Messages appear in designated channel

#### Configuration

```json
{
  "webhook": "https://outlook.webhook.office.com/..."
}
```

---

### Discord

#### Setup

1. Create Discord webhook in your server
2. In BlockStop, configure with webhook URL

#### Configuration

```json
{
  "webhook": "https://discordapp.com/api/webhooks/..."
}
```

---

### Telegram

#### Setup

1. Create Telegram bot via BotFather
2. Get chat ID of target group/channel
3. In BlockStop, configure with bot token and chat ID

#### Configuration

```json
{
  "botToken": "your-telegram-bot-token",
  "chatId": "your-chat-id"
}
```

---

## Threat Intelligence Integrations

### VirusTotal

#### Setup

1. Get VirusTotal API key from your account
2. In BlockStop, configure with API key
3. File hashes and URLs are automatically enriched

#### Configuration

```json
{
  "apiKey": "your-virustotal-api-key"
}
```

#### Auto-Enrichment

When a threat contains:
- File hash → VirusTotal file reputation check
- URL → VirusTotal URL analysis
- Domain → Domain reputation check

#### Response Data

```json
{
  "detections": {
    "malicious": 45,
    "suspicious": 5,
    "undetected": 50
  },
  "lastAnalysis": "2024-06-18T10:00:00Z"
}
```

---

### AlienVault OTX

#### Setup

1. Get AlienVault OTX API key
2. In BlockStop, configure with API key
3. Indicators are checked against OTX feeds

#### Configuration

```json
{
  "apiKey": "your-otx-api-key"
}
```

#### Supported Indicators

- IP addresses
- Domains
- File hashes
- URLs
- Email addresses

---

### Recorded Future

#### Setup

1. Get Recorded Future API token
2. In BlockStop, configure with token
3. Risk scores and intelligence are fetched

#### Configuration

```json
{
  "apiKey": "your-recorded-future-token"
}
```

---

## Custom Integrations

### Create Custom Integration

#### 1. Choose Template

```typescript
const customIntegration = {
  name: "My Custom Integration",
  type: "custom",
  endpoints: [
    {
      name: "send-threat",
      method: "POST",
      path: "/api/threats"
    }
  ]
};
```

#### 2. Configure Fields

```typescript
const fields = [
  {
    name: "apiEndpoint",
    type: "string",
    label: "API Endpoint",
    required: true
  },
  {
    name: "apiKey",
    type: "string",
    label: "API Key",
    required: true
  },
  {
    name: "customField",
    type: "string",
    label: "Custom Field",
    required: false
  }
];
```

#### 3. Implement Handler

```typescript
export class CustomIntegration {
  async sendEvent(threat: any): Promise<boolean> {
    const response = await fetch(
      `${this.config.apiEndpoint}/api/threats`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(threat)
      }
    );
    return response.ok;
  }
}
```

---

## Testing Integrations

### Test Connection

Before activating any integration, test the connection:

```bash
POST /integrations/{id}/test
```

### View Logs

Each integration maintains a log of:
- Successful deliveries
- Failed deliveries
- Retry attempts
- Configuration changes

### Webhook Testing

For webhook integrations, test using:

```bash
POST /webhooks/{id}/test
```

---

## Troubleshooting

### Integration Not Connecting

1. Verify API credentials
2. Check firewall/network access
3. Review rate limits
4. Check integration logs

### Missing Fields

Ensure all required fields are properly configured:

```bash
GET /integrations/{id}
```

### Event Delivery Failures

Check webhook DLQ (Dead Letter Queue):

```bash
GET /webhooks/dlq
```

Retry failed events:

```bash
POST /webhooks/dlq/{eventId}/replay
```

---

## Support

- Documentation: https://docs.blockstop.io/integrations
- Status Page: https://status.blockstop.io
- Support: support@blockstop.io
