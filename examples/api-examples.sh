#!/bin/bash

# BlockStop API Examples
# This file contains curl examples for all major API endpoints

BASE_URL="https://api.blockstop.io/v1"
API_KEY="bs_your_api_key_here"

echo "BlockStop API Examples"
echo "======================"

# ==================== API KEY MANAGEMENT ====================
echo -e "\n=== API Key Management ==="

# Create API Key
echo "Creating API Key..."
curl -X POST "$BASE_URL/api-keys" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["threats:read", "webhooks:write"],
    "expiresIn": 365
  }'

# List API Keys
echo "Listing API Keys..."
curl -X GET "$BASE_URL/api-keys" \
  -H "Authorization: Bearer $API_KEY"

# ==================== THREAT MANAGEMENT ====================
echo -e "\n=== Threat Management ==="

# List Threats
echo "Listing Threats..."
curl -X GET "$BASE_URL/threats?limit=10&severity=high&status=open" \
  -H "Authorization: Bearer $API_KEY"

# Get Single Threat
echo "Getting Threat..."
curl -X GET "$BASE_URL/threats/threat-001" \
  -H "Authorization: Bearer $API_KEY"

# Create Threat
echo "Creating Threat..."
curl -X POST "$BASE_URL/threats" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "phishing",
    "source": "email",
    "subject": "Suspicious Email",
    "senderEmail": "attacker@malicious.com",
    "recipientEmail": "user@example.com",
    "indicators": ["malicious.com", "attacker@malicious.com"]
  }'

# Update Threat
echo "Updating Threat..."
curl -X PUT "$BASE_URL/threats/threat-001" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "investigating",
    "severity": "critical"
  }'

# Delete Threat
echo "Deleting Threat..."
curl -X DELETE "$BASE_URL/threats/threat-001" \
  -H "Authorization: Bearer $API_KEY"

# ==================== WEBHOOK MANAGEMENT ====================
echo -e "\n=== Webhook Management ==="

# Register Webhook
echo "Registering Webhook..."
curl -X POST "$BASE_URL/webhooks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/blockstop",
    "eventTypes": ["threat.detected", "threat.updated"],
    "secret": "your-webhook-secret"
  }'

# List Webhooks
echo "Listing Webhooks..."
curl -X GET "$BASE_URL/webhooks" \
  -H "Authorization: Bearer $API_KEY"

# Test Webhook
echo "Testing Webhook..."
curl -X POST "$BASE_URL/webhooks/webhook-123/test" \
  -H "Authorization: Bearer $API_KEY"

# Update Webhook
echo "Updating Webhook..."
curl -X PUT "$BASE_URL/webhooks/webhook-123" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypes": ["threat.detected"],
    "active": true
  }'

# Delete Webhook
echo "Deleting Webhook..."
curl -X DELETE "$BASE_URL/webhooks/webhook-123" \
  -H "Authorization: Bearer $API_KEY"

# ==================== INTEGRATION MANAGEMENT ====================
echo -e "\n=== Integration Management ==="

# List Available Templates
echo "Listing Integration Templates..."
curl -X GET "$BASE_URL/integrations/templates?type=siem" \
  -H "Authorization: Bearer $API_KEY"

# List Active Integrations
echo "Listing Integrations..."
curl -X GET "$BASE_URL/integrations?enabled=true" \
  -H "Authorization: Bearer $API_KEY"

# Create Integration (Splunk)
echo "Creating Splunk Integration..."
curl -X POST "$BASE_URL/integrations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Splunk Instance",
    "type": "siem",
    "category": "splunk",
    "config": {
      "apiEndpoint": "https://splunk.example.com:8089",
      "parameters": {
        "apiKey": "your-splunk-hec-token",
        "index": "blockstop_threats"
      }
    }
  }'

# Create Integration (Slack)
echo "Creating Slack Integration..."
curl -X POST "$BASE_URL/integrations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Security Alerts Slack",
    "type": "communication",
    "category": "slack",
    "config": {
      "webhook": "https://hooks.slack.com/services/...",
      "parameters": {
        "channel": "#security-alerts"
      }
    }
  }'

# Create Integration (Jira)
echo "Creating Jira Integration..."
curl -X POST "$BASE_URL/integrations" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JIRA Security Project",
    "type": "ticketing",
    "category": "jira",
    "config": {
      "apiEndpoint": "https://jira.example.com",
      "parameters": {
        "apiKey": "your-jira-api-token",
        "projectKey": "SEC"
      }
    }
  }'

# Test Integration
echo "Testing Integration..."
curl -X POST "$BASE_URL/integrations/integration-123/test" \
  -H "Authorization: Bearer $API_KEY"

# Update Integration
echo "Updating Integration..."
curl -X PUT "$BASE_URL/integrations/integration-123" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "config": {
      "parameters": {
        "channel": "#new-channel"
      }
    }
  }'

# ==================== BATCH OPERATIONS ====================
echo -e "\n=== Batch Operations ==="

# Batch Request
echo "Executing Batch Request..."
curl -X POST "$BASE_URL/batch" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "id": "req-1",
        "method": "GET",
        "path": "/threats/threat-001"
      },
      {
        "id": "req-2",
        "method": "POST",
        "path": "/threats",
        "body": {
          "type": "malware",
          "source": "file",
          "subject": "Suspicious File"
        }
      },
      {
        "id": "req-3",
        "method": "PUT",
        "path": "/threats/threat-002",
        "body": {
          "status": "investigating"
        }
      }
    ],
    "sequential": false,
    "stopOnError": false
  }'

# ==================== GRAPHQL EXAMPLES ====================
echo -e "\n=== GraphQL Examples ==="

# GraphQL Query
echo "GraphQL Query - List Threats..."
curl -X POST "$BASE_URL/../graphql" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { threats(limit: 10, severity: HIGH) { items { id type severity status source timestamp } } }"
  }'

# GraphQL Mutation
echo "GraphQL Mutation - Create Threat..."
curl -X POST "$BASE_URL/../graphql" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createThreat(type: PHISHING, source: \"email\", subject: \"Test Email\") { id type severity status } }"
  }'

# ==================== VERIFICATION EXAMPLES ====================
echo -e "\n=== Verification Examples ==="

# Verify API Key
echo "Verifying API Key..."
curl -X GET "$BASE_URL/api-keys" \
  -H "Authorization: Bearer $API_KEY" \
  -w "\nStatus: %{http_code}\n"

# Check Rate Limits
echo "Checking Rate Limits..."
curl -X GET "$BASE_URL/threats?limit=1" \
  -H "Authorization: Bearer $API_KEY" \
  -i | grep -E "X-RateLimit|X-Request-Id"

echo -e "\n\nAll examples completed!"
echo "Replace API_KEY and URLs with your actual values."
