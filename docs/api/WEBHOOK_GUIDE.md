# BlockStop Webhook Guide

**Last Updated**: June 2026

## Overview

Webhooks allow you to receive real-time notifications when important events occur in BlockStop. When an event happens, BlockStop sends an HTTP POST request to your registered webhook URL with details about the event.

## Getting Started

### 1. Register a Webhook

First, create a webhook endpoint that can receive POST requests:

```bash
curl -X POST https://api.blockstop.io/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/blockstop/webhooks",
    "events": ["threat.detected", "scan.completed"]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "url": "https://your-server.com/blockstop/webhooks",
    "events": ["threat.detected", "scan.completed"],
    "secret": "whsec_live_abc123xyz789",
    "is_active": true,
    "created_at": "2026-06-18T10:00:00Z"
  }
}
```

### 2. Implement Webhook Handler

Create an endpoint that accepts POST requests:

**Node.js/Express Example:**

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'whsec_live_abc123xyz789';

app.post('/blockstop/webhooks', (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-blockstop-signature'];
  const timestamp = req.headers['x-blockstop-timestamp'];
  const payload = JSON.stringify(req.body);

  if (!verifySignature(signature, timestamp, payload)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  const event = req.body;
  console.log('Received event:', event.type);

  switch (event.type) {
    case 'threat.detected':
      handleThreatDetected(event.data);
      break;
    case 'scan.completed':
      handleScanCompleted(event.data);
      break;
  }

  // Respond with 200 to acknowledge receipt
  res.json({ received: true });
});

function verifySignature(signature, timestamp, payload) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const expected = hmac.update(`${timestamp}.${payload}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function handleThreatDetected(data) {
  // Handle threat detected event
  console.log(`New threat: ${data.threat_type} (${data.risk_score})`);
}

function handleScanCompleted(data) {
  // Handle scan completed event
  console.log(`Scan ${data.scan_id} completed with ${data.threats_detected} threats`);
}

app.listen(3000);
```

**Python Example:**

```python
from flask import Flask, request
import hmac
import hashlib
import json
from datetime import datetime, timedelta

app = Flask(__name__)
WEBHOOK_SECRET = 'whsec_live_abc123xyz789'

@app.route('/blockstop/webhooks', methods=['POST'])
def handle_webhook():
    # Verify signature
    signature = request.headers.get('X-BlockStop-Signature')
    timestamp = request.headers.get('X-BlockStop-Timestamp')
    
    if not verify_signature(signature, timestamp, request.get_data()):
        return {'error': 'Invalid signature'}, 401
    
    # Check timestamp is within 5 minutes
    ts = datetime.fromtimestamp(int(timestamp))
    if datetime.utcnow() - ts > timedelta(minutes=5):
        return {'error': 'Timestamp too old'}, 401
    
    event = request.json
    
    if event['type'] == 'threat.detected':
        handle_threat_detected(event['data'])
    elif event['type'] == 'scan.completed':
        handle_scan_completed(event['data'])
    
    return {'received': True}, 200

def verify_signature(signature, timestamp, payload):
    message = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

def handle_threat_detected(data):
    print(f"New threat: {data['threat_type']}")

def handle_scan_completed(data):
    print(f"Scan completed: {data['threats_detected']} threats")

if __name__ == '__main__':
    app.run(port=3000)
```

---

## Webhook Events

### threat.detected

Emitted when BlockStop detects a new threat.

**Event Payload:**
```json
{
  "id": "evt_abc123",
  "type": "threat.detected",
  "timestamp": "2026-06-18T10:05:00Z",
  "org_id": 123,
  "data": {
    "threat_id": 456,
    "threat_type": "phishing",
    "risk_score": 0.95,
    "source": "email",
    "sender": "attacker@malicious.com",
    "subject": "Urgent: Click here to verify your account",
    "indicators": [
      "attacker@malicious.com",
      "http://phishing-site.com"
    ],
    "affected_users": 5
  }
}
```

### scan.completed

Emitted when a scan completes.

**Event Payload:**
```json
{
  "id": "evt_def456",
  "type": "scan.completed",
  "timestamp": "2026-06-18T10:15:00Z",
  "org_id": 123,
  "data": {
    "scan_id": 789,
    "scan_type": "email",
    "status": "completed",
    "threats_detected": 3,
    "duration_seconds": 45,
    "results": [
      {
        "threat_type": "phishing",
        "severity": "high",
        "confidence": 0.98,
        "indicators": ["malicious@example.com"]
      }
    ]
  }
}
```

### alert.triggered

Emitted when an alert condition is met.

**Event Payload:**
```json
{
  "id": "evt_ghi789",
  "type": "alert.triggered",
  "timestamp": "2026-06-18T10:20:00Z",
  "org_id": 123,
  "data": {
    "alert_id": 101,
    "severity": "critical",
    "alert_type": "multiple_threats_detected",
    "message": "5 threats detected in the last hour",
    "threshold": 3,
    "actual_count": 5
  }
}
```

### organization.created

Emitted when a new organization is created.

**Event Payload:**
```json
{
  "id": "evt_jkl012",
  "type": "organization.created",
  "timestamp": "2026-06-18T10:25:00Z",
  "org_id": 999,
  "data": {
    "org_id": 999,
    "name": "Acme Corp",
    "tier": "pro",
    "created_by": "admin@blockstop.io"
  }
}
```

### integration.connected

Emitted when an integration is successfully connected.

**Event Payload:**
```json
{
  "id": "evt_mno345",
  "type": "integration.connected",
  "timestamp": "2026-06-18T10:30:00Z",
  "org_id": 123,
  "data": {
    "integration_id": 202,
    "integration_type": "slack",
    "status": "connected",
    "connected_by": "user@company.com"
  }
}
```

### api.rate_limit_exceeded

Emitted when an API rate limit is exceeded.

**Event Payload:**
```json
{
  "id": "evt_pqr678",
  "type": "api.rate_limit_exceeded",
  "timestamp": "2026-06-18T10:35:00Z",
  "org_id": 123,
  "data": {
    "api_key_id": 303,
    "limit": 100,
    "exceeded_by": 15,
    "reset_time": "2026-06-18T10:36:00Z"
  }
}
```

### security.breach_detected

Emitted when a critical security breach is detected.

**Event Payload:**
```json
{
  "id": "evt_stu901",
  "type": "security.breach_detected",
  "timestamp": "2026-06-18T10:40:00Z",
  "org_id": 123,
  "data": {
    "breach_id": 404,
    "severity": "critical",
    "description": "Credentials for 100+ users exposed",
    "affected_records": 120,
    "recommendation": "Reset all user passwords immediately"
  }
}
```

---

## Webhook Signature Verification

All webhooks include an HMAC-SHA256 signature in the `X-BlockStop-Signature` header for security verification.

**Signature Format:**
```
X-BlockStop-Signature: <hex_encoded_hmac>
X-BlockStop-Timestamp: <unix_timestamp>
```

**Verification Process:**

1. Extract signature and timestamp from headers
2. Verify timestamp is within 5 minutes of current time
3. Construct message: `{timestamp}.{request_body}`
4. Compute HMAC-SHA256 with your webhook secret
5. Compare with signature using timing-safe comparison

---

## Retry Logic

BlockStop automatically retries failed webhook deliveries with exponential backoff:

| Attempt | Delay | Description |
|---------|-------|-------------|
| 1 | Immediate | First attempt |
| 2 | 5 seconds | 1st retry |
| 3 | 25 seconds | 2nd retry |
| 4 | 2 minutes | 3rd retry |
| 5 | 10 minutes | 4th retry |
| 6 | 50 minutes | 5th retry |
| 7 | 4 hours | 6th retry |

After 7 failed attempts, the event is moved to the dead letter queue.

**Success Criteria:**
- HTTP 2xx status code
- Response received within 30 seconds

---

## Testing Webhooks

### Manual Test

```bash
curl -X POST https://api.blockstop.io/api/v1/webhooks/101/test \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "success",
    "status_code": 200,
    "delivery_time_ms": 145,
    "event_type": "threat.detected",
    "timestamp": "2026-06-18T10:45:00Z"
  }
}
```

### Local Testing with ngrok

```bash
# Start local server
npm start  # Your webhook handler on localhost:3000

# In another terminal, expose to internet
ngrok http 3000
# Get your public URL: https://abc123.ngrok.io

# Register webhook with ngrok URL
curl -X POST https://api.blockstop.io/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "url": "https://abc123.ngrok.io/blockstop/webhooks",
    "events": ["threat.detected"]
  }'

# Trigger test webhook
curl -X POST https://api.blockstop.io/api/v1/webhooks/101/test
```

---

## Best Practices

1. **Acknowledge Quickly**: Return 200 OK immediately, process asynchronously
2. **Idempotency**: Handle duplicate deliveries gracefully (check event ID)
3. **Verify Signatures**: Always verify webhook signatures
4. **Secure URLs**: Always use HTTPS for webhook endpoints
5. **Monitor Deliveries**: Check webhook delivery status regularly
6. **Error Logging**: Log all failed deliveries for debugging
7. **Timeout Handling**: Set appropriate timeout values (default 30s)

---

## Troubleshooting

### Webhooks Not Being Delivered

1. Check if webhook is active: `GET /api/v1/webhooks/{id}`
2. Verify URL is accessible from the internet
3. Ensure endpoint returns 2xx status code
4. Check delivery logs: `GET /api/v1/webhooks/{id}/events`

### Signature Verification Failing

1. Verify you're using the correct webhook secret
2. Check timestamp is within 5-minute window
3. Ensure you're using SHA256 HMAC
4. Verify request body hasn't been modified

---

## Support

For webhook issues, contact: webhooks-support@blockstop.io
