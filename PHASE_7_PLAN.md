# BlockStop Phase 7: Enterprise Integrations

## Overview
Deep integration with enterprise tools and platforms to embed BlockStop threat detection into existing security workflows and communication systems.

---

## 1. SIEM Integration

### Splunk Integration
**Files to Create**:
- `integrations/splunk/addon/` - Splunk add-on (TA-blockstop)
- `integrations/splunk/addon/bin/blockstop_scan.py` - Input script
- `integrations/splunk/addon/default/inputs.conf` - Input configuration
- `integrations/splunk/addon/default/props.conf` - Field extraction
- `integrations/splunk/addon/default/transforms.conf` - Field transformation
- `integrations/splunk/api/route.ts` - Splunk webhook receiver
- `lib/integrations/splunk-client.ts` - Splunk API client

**Implementation**:
```python
# integrations/splunk/addon/bin/blockstop_scan.py
import splunklib
from blockstop_api import BlockStopClient

class BlockStopInput:
    def __init__(self, splunk_service):
        self.splunk = splunk_service
        self.blockstop = BlockStopClient(api_key=os.environ['BLOCKSTOP_API_KEY'])
    
    def scan_files(self, event):
        """Scan files referenced in Splunk events"""
        file_hash = event.get('file_hash')
        if file_hash:
            result = self.blockstop.check_hash(file_hash)
            return {
                'blockstop_threat_level': result['threat_level'],
                'blockstop_threat_types': result['threats'],
                'blockstop_confidence': result['confidence']
            }
    
    def stream_events(self):
        """Stream enriched events back to Splunk"""
        # Implementation
        pass
```

### Elasticsearch/ELK Integration
**Files to Create**:
- `integrations/elk/filebeat-config.yml` - Filebeat configuration
- `integrations/elk/logstash-filter.conf` - Logstash filter
- `integrations/elk/kibana-dashboard.ndjson` - Kibana dashboard
- `app/api/elk/ingest/route.ts` - ELK ingest endpoint
- `lib/integrations/elasticsearch-client.ts` - ES client

**Logstash Filter**:
```
filter {
  if [file_hash] {
    http {
      url => "https://blockstop.example.com/api/threat-intel/check"
      http_method => "post"
      body => '{"hash": "%{file_hash}"}'
      headers => { "Authorization" => "Bearer %{BLOCKSTOP_TOKEN}" }
      target_body => "blockstop_result"
    }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "blockstop-%{+YYYY.MM.dd}"
  }
}
```

### ArcSight Integration
**Files to Create**:
- `integrations/arcsight/connector/` - ArcSight connector
- `integrations/arcsight/connector/blockstop-connector.py` - Connector implementation
- `integrations/arcsight/cef-format.ts` - CEF event formatting
- `app/api/arcsight/cef/route.ts` - CEF receiver

---

## 2. Incident Response Platform Integration

### ServiceNow Integration
**Files to Create**:
- `integrations/servicenow/app/` - ServiceNow app
- `integrations/servicenow/app/blockstop_scan.js` - Scan action
- `integrations/servicenow/app/blockstop_dashboard.html` - Dashboard
- `integrations/servicenow/api/` - REST API endpoints
- `integrations/servicenow/webhooks/incident.ts` - Incident webhook
- `lib/integrations/servicenow-client.ts` - ServiceNow API client

**Implementation**:
```typescript
// lib/integrations/servicenow-client.ts
export class ServiceNowClient {
  async createIncidentFromThreat(threat: ThreatAlert): Promise<Incident> {
    const incident = {
      short_description: `BlockStop: ${threat.threatType} detected`,
      description: `
        Threat Level: ${threat.threatLevel}
        File Hash: ${threat.fileHash}
        Detection Time: ${threat.detectedAt}
        Confidence: ${threat.confidence}
      `,
      urgency: this.mapThreatToUrgency(threat.threatLevel),
      impact: 'medium',
      category: 'security',
      custom_fields: {
        blockstop_threat_id: threat.id,
        blockstop_indicators: threat.indicators.join(','),
        blockstop_recommendation: threat.recommendation
      }
    };
    
    return await this.post('/incident', incident);
  }
  
  async updateIncidentWithFindings(incidentId: string, findings: ForensicFindings): Promise<void> {
    await this.patch(`/incident/${incidentId}`, {
      work_notes: `BlockStop Forensic Analysis:\n${findings.summary}`,
      status: findings.confirmed ? 'confirmed' : 'investigating'
    });
  }
}
```

### Jira Integration
**Files to Create**:
- `integrations/jira/app/` - Jira app
- `integrations/jira/app/blockstop-issue-panel.js` - Issue panel
- `integrations/jira/webhooks/issue.ts` - Issue webhook
- `lib/integrations/jira-client.ts` - Jira API client
- `app/api/jira/scan-attachment/route.ts` - Attachment scan

**Jira Integration**:
```typescript
export class JiraClient {
  async scanIssueAttachments(issueKey: string): Promise<void> {
    const issue = await this.getIssue(issueKey);
    
    for (const attachment of issue.fields.attachment) {
      const scanResult = await blockstop.scanFile({
        url: attachment.content,
        filename: attachment.filename
      });
      
      if (scanResult.threatLevel > 0) {
        await this.addCommentToIssue(issueKey, {
          body: `⚠️ **BlockStop Security Alert**\n` +
                `File: ${attachment.filename}\n` +
                `Threat Level: ${scanResult.threatLevel}\n` +
                `Threats: ${scanResult.threats.join(', ')}`
        });
        
        await this.setIssueSecurity(issueKey, 'HIGH');
      }
    }
  }
}
```

---

## 3. Communication Platform Integration

### Slack Integration
**Files to Create**:
- `integrations/slack/app/` - Slack app
- `integrations/slack/app/app.ts` - Main app handler
- `integrations/slack/commands/scan.ts` - /scan command
- `integrations/slack/actions/review.ts` - Interactive actions
- `integrations/slack/events/file-shared.ts` - File shared event
- `lib/integrations/slack-client.ts` - Slack SDK wrapper

**Implementation**:
```typescript
// integrations/slack/app/app.ts
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Command: /blockstop scan
app.command('/blockstop', async ({ ack, body, respond }) => {
  ack();
  
  const fileUrl = body.text;
  const scanResult = await blockstop.scanFileUrl(fileUrl);
  
  respond({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*BlockStop Scan Results*\nThreat Level: ${scanResult.threatLevel}\nThreats: ${scanResult.threats.join(', ')}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Quarantine" },
            action_id: "quarantine_file"
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Approve" },
            action_id: "approve_file"
          }
        ]
      }
    ]
  });
});

// File shared event
app.event('file_shared', async ({ event, client }) => {
  const file = await client.files.info({ file: event.file_id });
  const scanResult = await blockstop.scanFile(file);
  
  if (scanResult.threatLevel > 50) {
    await client.chat.postMessage({
      channel: event.channel_id,
      text: `⚠️ Potential malware detected in ${file.name}`
    });
  }
});
```

### Microsoft Teams Integration
**Files to Create**:
- `integrations/teams/app/` - Teams app
- `integrations/teams/app/manifest.json` - Teams manifest
- `integrations/teams/tabs/scan-dashboard.tsx` - Scan dashboard tab
- `integrations/teams/messaging-extension/` - Messaging extension
- `lib/integrations/teams-client.ts` - Teams SDK wrapper
- `app/api/teams/webhook/route.ts` - Incoming webhook

**Teams Bot**:
```typescript
export class TeamsBot {
  async handleActivity(context: TurnContext): Promise<void> {
    if (context.activity.type === ActivityTypes.Message) {
      const text = context.activity.text;
      
      if (text.includes('scan file')) {
        const fileUrl = this.extractUrl(text);
        const result = await blockstop.scanFileUrl(fileUrl);
        
        await context.sendActivity({
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                  {
                    type: 'TextBlock',
                    text: 'BlockStop Scan Results',
                    weight: 'bolder'
                  },
                  {
                    type: 'TextBlock',
                    text: `Threat Level: ${result.threatLevel}`
                  },
                  {
                    type: 'TextBlock',
                    text: `Threats: ${result.threats.join(', ')}`
                  }
                ],
                actions: [
                  {
                    type: 'Action.OpenUrl',
                    title: 'View Details',
                    url: `https://blockstop.example.com/scans/${result.id}`
                  }
                ]
              }
            }
          ]
        });
      }
    }
  }
}
```

---

## 4. Email Security Integration

### Microsoft Exchange Integration
**Files to Create**:
- `integrations/exchange/transport-agent/` - Exchange transport agent
- `integrations/exchange/transport-agent/blockstop-agent.cs` - C# agent
- `integrations/exchange/powershell/blockstop-cmdlets.ps1` - PowerShell cmdlets
- `integrations/exchange/webhook/route.ts` - Exchange webhook
- `lib/integrations/exchange-client.ts` - Exchange API client

### Gmail API Integration
**Files to Create**:
- `integrations/gmail/addon/` - Gmail add-on
- `integrations/gmail/addon/appsscript.json` - Apps Script config
- `integrations/gmail/addon/code.gs` - Apps Script code
- `integrations/gmail/labels/malicious.ts` - Malicious label management
- `lib/integrations/gmail-client.ts` - Gmail API client

**Gmail Add-on**:
```javascript
// integrations/gmail/addon/code.gs
function onGmailMessage(e) {
  const accessToken = e.messageMetadata.accessToken;
  const messageId = e.messageMetadata.messageId;
  
  const message = GmailApp.getMessageById(messageId);
  const attachments = message.getAttachments();
  
  const results = [];
  for (const attachment of attachments) {
    const blob = attachment.getBlob();
    const scanResult = scanWithBlockStop(blob);
    
    if (scanResult.threatLevel > 0) {
      results.push({
        filename: attachment.getFileName(),
        threatLevel: scanResult.threatLevel,
        threats: scanResult.threats
      });
    }
  }
  
  return buildEmailWidget(results);
}

function buildEmailWidget(results) {
  const sections = [];
  
  if (results.length > 0) {
    sections.push(CardService.newCardSection()
      .setHeader('⚠️ BlockStop Security Alert')
      .addWidget(CardService.newTextParagraph()
        .setText(`Found ${results.length} suspicious attachment(s)`)));
    
    for (const result of results) {
      sections.push(CardService.newCardSection()
        .setHeader(result.filename)
        .addWidget(CardService.newTextParagraph()
          .setText(`Threat Level: ${result.threatLevel}\nThreats: ${result.threats.join(', ')}`)));
    }
  }
  
  return CardService.newCardBuilder()
    .addSection(CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText('BlockStop Mail Security')))
    .addSection(...sections)
    .build();
}
```

---

## 5. VPN & Network Integration

### Cisco Umbrella Integration
**Files to Create**:
- `integrations/cisco/umbrella/` - Cisco Umbrella integration
- `lib/integrations/cisco-umbrella-client.ts` - API client
- `app/api/cisco/threat-intelligence/route.ts` - Threat intelligence endpoint

### Palo Alto Networks Integration
**Files to Create**:
- `integrations/paloalto/xsoar/` - XSOAR integration
- `integrations/paloalto/cortex/` - Cortex integration
- `lib/integrations/paloalto-client.ts` - API client

---

## 6. Webhook & Custom Integration Framework

**Files to Create**:
- `lib/integrations/webhook-manager.ts` - Webhook management
- `lib/integrations/webhook-validator.ts` - Webhook validation
- `app/api/webhooks/route.ts` - Webhook receiver
- `app/api/integrations/custom/route.ts` - Custom integration builder
- `components/integrations/webhook-tester.tsx` - Webhook testing UI
- `lib/integrations/custom-integration-builder.ts` - Builder

**Webhook Manager**:
```typescript
export class WebhookManager {
  async registerWebhook(orgId: string, config: WebhookConfig): Promise<Webhook> {
    const webhook = {
      id: generateId(),
      orgId,
      url: config.url,
      events: config.events,
      secret: generateSecret(),
      active: true,
      retries: 3,
      timeout: 30000
    };
    
    // Verify webhook URL
    await this.verifyUrl(webhook.url);
    
    return await db.webhooks.create(webhook);
  }
  
  async triggerWebhook(webhook: Webhook, event: SecurityEvent): Promise<void> {
    const payload = JSON.stringify(event);
    const signature = this.generateSignature(payload, webhook.secret);
    
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BlockStop-Signature': signature,
        'X-BlockStop-Timestamp': Date.now().toString()
      },
      body: payload
    });
    
    if (!response.ok && webhook.retries > 0) {
      await this.retryWebhook(webhook, event, webhook.retries - 1);
    }
  }
}
```

---

## Phase 7 Technology Stack

### Integration Frameworks
- Zapier API, Make.com API, IFTTT API
- Webhooks (incoming/outgoing)
- OAuth 2.0, API keys

### Enterprise Tools
- Splunk SDK, Elasticsearch API
- ServiceNow API, Jira REST API
- Slack Bolt, Microsoft Teams SDK
- Microsoft Exchange API, Gmail API

### Protocols
- CEF (Common Event Format)
- STIX 2.0 (Structured Threat Information Expression)
- OpenIOC (Open Indicators of Compromise)

---

## Phase 7 Deliverables

### New Directories & Files
- `integrations/splunk/` - Splunk add-on (8 files)
- `integrations/elk/` - Elasticsearch integration (5 files)
- `integrations/servicenow/` - ServiceNow app (6 files)
- `integrations/jira/` - Jira integration (5 files)
- `integrations/slack/` - Slack app (6 files)
- `integrations/teams/` - Teams app (5 files)
- `integrations/gmail/` - Gmail add-on (4 files)
- `integrations/exchange/` - Exchange integration (5 files)
- `lib/integrations/` - Integration clients (15 files)
- `app/api/integrations/` - Integration endpoints (8 files)

### Total New Files: 70+
### Estimated LOC: 2,500+

---

## Phase 7 Success Criteria

- ✅ Splunk integration fully functional
- ✅ ServiceNow incident creation working
- ✅ Jira issue creation and scanning working
- ✅ Slack bot responding to commands and events
- ✅ Teams bot sending threat alerts
- ✅ Gmail add-on scanning attachments
- ✅ Exchange transport agent working
- ✅ Custom webhook framework operational
- ✅ Integration testing passing
- ✅ All APIs documented

---

## Timeline
**Estimated Duration**: 18-22 hours
**Parallel Work**: Integrations can be built in parallel with agents

---

Generated: 2026-06-16 16:00 UTC
