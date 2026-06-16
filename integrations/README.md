# BlockStop Enterprise Integrations

This directory contains all enterprise tool integrations for BlockStop PRO.

## Directory Structure

### SIEM Integrations
- **splunk/** - Splunk add-on for BlockStop
  - `addon/` - Add-on structure with configuration files
  - `blockstop_scan.py` - Python script for event collection
  - Configuration: `inputs.conf`, `props.conf`, `transforms.conf`

- **elk/** - Elasticsearch/Logstash/Kibana integration
  - `filebeat-config.yml` - Filebeat configuration
  - `logstash-filter.conf` - Event processing filters

- **arcsight/** - ArcSight CEF format integration
  - `cef-format.ts` - CEF event formatter

### Incident Response
- **servicenow/** - ServiceNow ITSM integration
- **jira/** - Jira issue tracking integration

### Communication
- **slack/** - Slack bot integration
  - Commands: `/blockstop-scan`, `/blockstop-status`, `/blockstop-help`
  - File sharing events
  - Interactive actions

- **teams/** - Microsoft Teams integration
  - Adaptive cards
  - Channel messages
  - File processing

### Email Security
- **gmail/** - Gmail add-on for Gmail/G Suite
  - Attachment scanning
  - Threat actions
  - Apps Script-based

- **exchange/** - Microsoft Exchange integration
  - Transport rules
  - PowerShell cmdlets
  - Attachment processing

## Configuration

### Environment Variables

All integrations require specific environment variables:

```bash
# SIEM
SPLUNK_URL=https://splunk.example.com:8088
SPLUNK_HEC_TOKEN=your-hec-token
SPLUNK_INDEX=main
SPLUNK_VERIFY_SSL=true

ELASTICSEARCH_URL=https://elasticsearch.example.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=password

# Incident Response
SERVICENOW_URL=https://instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=password

JIRA_URL=https://jira.example.com
JIRA_EMAIL=admin@example.com
JIRA_TOKEN=your-api-token
JIRA_PROJECT=SEC

# Communication
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret

TEAMS_BOT_ID=your-bot-id
TEAMS_BOT_PASSWORD=your-bot-password

# Email
GMAIL_ACCESS_TOKEN=your-access-token
EXCHANGE_ACCESS_TOKEN=your-access-token
```

## Integration APIs

### SIEM Ingest
```bash
POST /api/siem/ingest
```
Send scan events to configured SIEM platforms.

### Incident Response
```bash
POST /api/incident-response/create-ticket
POST /api/incident-response/update-ticket
POST /api/incident-response/auto-remediate
```

### Webhooks
```bash
POST /api/webhooks                  # Register webhook
GET /api/webhooks                   # List webhooks
PUT /api/webhooks/[id]              # Update webhook
DELETE /api/webhooks/[id]           # Delete webhook
POST /api/webhooks/test             # Test webhook
```

## Health Checks

Each integration provides health check endpoints:

```bash
GET /api/siem/ingest/health          # SIEM health
POST /api/webhooks/test/[webhookId]  # Webhook test
```

## Development

### Adding a New Integration

1. Create integration client in `lib/integrations/`
2. Create API route in `app/api/[integration]/`
3. Add environment variables to `.env.local.example`
4. Implement error handling and retry logic
5. Add audit logging
6. Create tests

### Testing

```bash
# Test SIEM ingest
curl -X POST http://localhost:3000/api/siem/ingest \
  -H "Content-Type: application/json" \
  -d '{"scanId":"test","timestamp":1234567890}'

# Test webhook
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"webhookId":"webhook-id"}'
```

## Security Considerations

1. **API Keys**: Store in environment variables, never in code
2. **HTTPS**: Always use HTTPS for integration endpoints
3. **Rate Limiting**: Implemented in webhook manager
4. **Signature Validation**: All webhooks validate HMAC-SHA256 signatures
5. **IP Whitelisting**: Optional IP filtering for webhooks
6. **Audit Logging**: All integration actions are logged

## Troubleshooting

### Splunk Connection Issues
- Verify HEC token is valid
- Check Splunk firewall rules
- Ensure index exists and is accessible

### Elasticsearch Connection Issues
- Verify credentials are correct
- Check SSL certificate validation
- Ensure index templates are created

### Slack/Teams Issues
- Verify bot tokens are active
- Check app is installed in workspace/team
- Review app permissions

## Support

For integration issues, check:
1. Environment variables are set correctly
2. Endpoints are accessible from the server
3. Credentials/tokens are valid
4. Network/firewall rules allow outbound connections
5. Logs for detailed error messages
