# BlockStop Integration Marketplace Guide

**Last Updated**: June 2026

## Overview

BlockStop integrations connect threat detection capabilities to your existing security tools. The integration marketplace provides pre-built connectors for popular SIEM, EDR, ticketing, and communication platforms.

---

## Featured Integrations

### Communication Integrations

#### Slack
Send real-time threat alerts to Slack channels.

**Setup:**
1. Create a Slack incoming webhook: https://api.slack.com/messaging/webhooks
2. In BlockStop, go to Integrations → Slack
3. Paste webhook URL and select channel
4. Click Connect

**Features:**
- Real-time threat notifications
- Rich message formatting
- Thread replies for discussion
- Interactive buttons for actions

**Example Payload:**
```json
{
  "text": "🚨 New Threat Detected",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Phishing Email Detected*\nSeverity: HIGH\nSender: attacker@malicious.com"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "View Details" },
          "url": "https://blockstop.io/threats/123"
        }
      ]
    }
  ]
}
```

---

#### Microsoft Teams
Send threat alerts to Microsoft Teams channels.

**Setup:**
1. Create Teams incoming webhook
2. In BlockStop, go to Integrations → Teams
3. Paste webhook URL
4. Click Connect

**Features:**
- Adaptive cards for rich formatting
- Threat severity color coding
- Action buttons
- Team notifications

---

#### PagerDuty
Automatically create incidents for critical threats.

**Setup:**
1. Get PagerDuty API token
2. In BlockStop, go to Integrations → PagerDuty
3. Paste API token and select integration key
4. Configure escalation policy
5. Click Connect

**Features:**
- Auto-create incidents for critical threats
- Assign to on-call user
- Link to threat details
- Automatic incident closure on remediation

---

### SIEM Integrations

#### Splunk
Send all threat detections to Splunk for correlation and analysis.

**Setup:**
1. Create Splunk HTTP Event Collector
2. In BlockStop, go to Integrations → Splunk
3. Configure:
   - HEC URL
   - HEC Token
   - Sourcetype
4. Click Connect and Test

**Data Sent:**
- Threat events with full context
- Scan results
- Alert triggers
- API usage metrics

---

#### Datadog
Monitor BlockStop threats and metrics in Datadog.

**Setup:**
1. Get Datadog API key
2. In BlockStop, go to Integrations → Datadog
3. Paste API key
4. Click Connect

**Features:**
- Threat event logging
- Custom metrics
- Dashboard integration
- Alert correlation

---

#### ELK Stack
Send threat data to Elasticsearch.

**Setup:**
1. Configure Elasticsearch endpoint
2. In BlockStop, go to Integrations → ELK
3. Enter Elasticsearch host, port, index
4. Click Connect

**Index Template:**
```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "threat_id": { "type": "keyword" },
      "threat_type": { "type": "keyword" },
      "severity": { "type": "keyword" },
      "detected_at": { "type": "date" },
      "source": { "type": "keyword" },
      "indicators": { "type": "text" }
    }
  }
}
```

---

### Ticketing Integrations

#### Jira
Auto-create Jira tickets for detected threats.

**Setup:**
1. Create Jira API token: https://id.atlassian.com/manage-profile/security/api-tokens
2. In BlockStop, go to Integrations → Jira
3. Configure:
   - Jira URL
   - Username
   - API Token
   - Project key
   - Issue type
4. Click Connect

**Ticket Template:**
```
Title: [THREAT] {threat_type} - {severity}
Description: 
Threat ID: {threat_id}
Type: {threat_type}
Severity: {severity}
Source: {source}
Indicators: {indicators}

Recommendation: {recommendation}

Link: https://blockstop.io/threats/{threat_id}
```

---

#### ServiceNow
Create ServiceNow incidents for critical threats.

**Setup:**
1. Get ServiceNow API credentials
2. In BlockStop, go to Integrations → ServiceNow
3. Configure:
   - Instance URL
   - Username
   - Password
   - Assignment group
   - Impact level mapping
4. Click Connect

**Features:**
- Auto-create incidents
- Auto-assign to groups
- Custom field mapping
- Incident auto-closure

---

#### Linear
Track threat remediation in Linear.

**Setup:**
1. Create Linear API token
2. In BlockStop, go to Integrations → Linear
3. Paste API token
4. Select project and team
5. Click Connect

---

### Cloud Security Integrations

#### AWS Security Hub
Send threat data to AWS Security Hub.

**Setup:**
1. Configure AWS credentials with SecurityHub permissions
2. In BlockStop, go to Integrations → AWS
3. Select region and account ID
4. Click Connect

**Features:**
- Finding normalization
- Compliance mapping
- Automated insights

---

#### Azure Sentinel
Integrate with Azure Sentinel for threat correlation.

**Setup:**
1. Create Log Analytics workspace
2. Get workspace ID and shared key
3. In BlockStop, go to Integrations → Azure Sentinel
4. Enter workspace credentials
5. Click Connect

---

#### Google Cloud Security Command Center
Send findings to Google Cloud SCC.

**Setup:**
1. Enable Security Command Center API
2. Create service account
3. In BlockStop, go to Integrations → GCP
4. Upload service account JSON
5. Click Connect

---

### Threat Intelligence Integrations

#### VirusTotal
Enrich threat data with VirusTotal intelligence.

**Setup:**
1. Get VirusTotal API key: https://www.virustotal.com/gui/my-apikey
2. In BlockStop, go to Integrations → VirusTotal
3. Paste API key
4. Click Connect

**Features:**
- File hash lookups
- URL analysis
- IP reputation
- Threat enrichment

---

#### AlienVault OTX
Correlate threats with AlienVault threat intelligence.

**Setup:**
1. Create AlienVault account and get API key
2. In BlockStop, go to Integrations → AlienVault
3. Paste API key
4. Click Connect

---

## Managing Integrations

### List Connected Integrations

```bash
curl -X GET https://api.blockstop.io/api/v1/integrations \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "integration_type": "slack",
      "status": "connected",
      "health_status": "healthy",
      "last_sync": "2026-06-18T10:05:00Z",
      "config": {
        "webhook_url": "https://hooks.slack.com/services/...",
        "channel": "#security"
      }
    }
  ]
}
```

### Check Integration Health

```bash
curl -X GET https://api.blockstop.io/api/v1/integrations/1/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "integration_id": 1,
    "health_status": "healthy",
    "latency_ms": 125,
    "error_count": 0,
    "success_count": 234,
    "last_sync": "2026-06-18T10:05:00Z"
  }
}
```

### Disconnect Integration

```bash
curl -X DELETE https://api.blockstop.io/api/v1/integrations/1 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Building Custom Integrations

### Integration Framework

Create custom integrations using the BlockStop Integration SDK:

**Base Integration Class:**
```typescript
export abstract class BlockStopIntegration {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  abstract authenticate(config: any): Promise<void>;
  abstract healthCheck(): Promise<HealthStatus>;
  abstract onThreatDetected(threat: Threat): Promise<void>;
  abstract onScanCompleted(scan: Scan): Promise<void>;
}
```

**Example Custom Integration:**
```typescript
import { BlockStopIntegration, Threat, Scan, HealthStatus } from '@blockstop/sdk';

export class CustomTicketingIntegration extends BlockStopIntegration {
  name = 'Custom Ticketing System';
  version = '1.0.0';
  description = 'Send threats to custom ticketing system';

  async authenticate(config: any) {
    // Validate credentials
    const response = await fetch(`${config.api_url}/auth/test`, {
      headers: {
        'Authorization': `Bearer ${config.api_token}`
      }
    });
    
    if (!response.ok) throw new Error('Authentication failed');
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.config.api_url}/health`);
      return response.ok ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  }

  async onThreatDetected(threat: Threat) {
    // Create ticket in custom system
    await fetch(`${this.config.api_url}/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Security Alert: ${threat.threat_type}`,
        description: `Threat ${threat.id} detected with severity ${threat.severity}`,
        priority: this.mapSeverity(threat.severity),
        tags: [threat.threat_type, threat.source]
      })
    });
  }

  async onScanCompleted(scan: Scan) {
    // Handle scan completion
  }

  private mapSeverity(severity: string): string {
    const map: Record<string, string> = {
      'critical': 'p1',
      'high': 'p2',
      'medium': 'p3',
      'low': 'p4'
    };
    return map[severity] || 'p3';
  }
}
```

### Publishing Custom Integration

1. Package your integration
2. Submit to BlockStop marketplace
3. Pass security review
4. Go live in marketplace
5. Earn revenue share (30%)

---

## Troubleshooting

### Integration Not Connecting
- Verify credentials are correct
- Check firewall/network connectivity
- Ensure endpoint URLs are accessible
- Review integration logs for errors

### Health Status Degraded
- Check endpoint availability
- Verify authentication hasn't expired
- Review rate limits
- Check network connectivity

### Missed Events
- Verify webhook is active
- Check webhook delivery logs
- Confirm event filters are correct
- Review integration configuration

---

## Support

For integration support, contact: integrations-support@blockstop.io
Visit the integration marketplace: https://blockstop.io/marketplace
