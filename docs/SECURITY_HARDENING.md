# Security Hardening Guidelines

**Version:** 1.0  
**Date:** June 2026  
**Status:** Production

## Overview

This document provides detailed hardening guidelines for BlockStop infrastructure, applications, and operations to achieve and maintain A+ security rating.

## Table of Contents

1. [HTTP Security Headers](#http-security-headers)
2. [TLS/SSL Configuration](#tlsssl-configuration)
3. [CORS and CSRF Protection](#cors-and-csrf-protection)
4. [Rate Limiting and DDoS Protection](#rate-limiting-and-ddos-protection)
5. [Cookie Security](#cookie-security)
6. [Infrastructure Hardening](#infrastructure-hardening)
7. [Application Hardening](#application-hardening)
8. [Database Hardening](#database-hardening)
9. [Verification and Testing](#verification-and-testing)

## HTTP Security Headers

All HTTP responses must include the following security headers:

### 1. Content-Security-Policy (CSP)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'strict-dynamic' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; media-src 'self'; object-src 'none'; frame-src 'self'; worker-src 'self'; connect-src 'self' https:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests; block-all-mixed-content;
```

**Implementation:**
- Use Next.js middleware to inject headers
- Test with CSP Evaluator (csp-evaluator.withgoogle.com)
- Monitor CSP violations with report-uri

**Development:**
```typescript
// lib/security/csp-headers.ts
export function getCSPHeaders() {
  return {
    'Content-Security-Policy': buildCSPString(),
    'Content-Security-Policy-Report-Only': buildCSPString() + '; report-uri /api/security/csp-report'
  };
}
```

### 2. X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

Prevents MIME type sniffing attacks.

### 3. X-Frame-Options

```
X-Frame-Options: DENY
```

Prevents clickjacking. Use `SAMEORIGIN` if frames are required.

### 4. X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

Legacy browser XSS filter (modern browsers use CSP).

### 5. Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controls referrer information leakage.

### 6. Permissions-Policy

```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
```

Disables unnecessary APIs.

### 7. Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Setup:**
1. Deploy with 1-month max-age initially
2. Monitor for issues
3. Increase to 1-year
4. Submit to HSTS preload list (hstspreload.org)

## TLS/SSL Configuration

### Target: A+ Rating (ssllabs.com)

### 1. Protocol Version

**Minimum:** TLS 1.2  
**Preferred:** TLS 1.3

```nginx
# nginx configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
```

### 2. Cipher Suites

**TLS 1.3** (in order of preference):
```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
```

**TLS 1.2** (in order of preference):
```
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-CHACHA20-POLY1305
ECDHE-RSA-CHACHA20-POLY1305
```

**nginx Example:**
```nginx
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
```

### 3. Certificate Configuration

**Requirements:**
- Wildcard or SAN certificate
- 2048-bit RSA minimum (4096-bit preferred)
- Issued by trusted CA
- Renewed before expiration (monitor with Sectigo/Let's Encrypt)

**Validation:**
```bash
# Check certificate
openssl x509 -in /etc/ssl/certs/server.crt -text -noout

# Check key strength
openssl rsa -in /etc/ssl/private/server.key -text -noout | grep "Private-Key"

# Verify OCSP stapling
echo | openssl s_client -connect example.com:443 -ocsp 2>/dev/null | grep "OCSP response:"
```

### 4. Session Configuration

```nginx
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
```

### 5. DH Parameters (Forward Secrecy)

```bash
# Generate (once, ~1 hour)
openssl dhparam -out /etc/ssl/dhparam.pem 4096

# nginx configuration
ssl_dhparam /etc/ssl/dhparam.pem;
```

### 6. Testing

```bash
# Full SSL test
openssl s_client -connect example.com:443 -tls1_2

# Test cipher suites
nmap --script ssl-enum-ciphers -p 443 example.com

# Check HSTS preload
curl -I https://example.com | grep Strict-Transport-Security

# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=example.com
```

## CORS and CSRF Protection

### CORS Configuration

**Safe Configuration:**
```typescript
const corsOptions = {
  origin: process.env.NEXT_PUBLIC_APP_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
};
```

**Never use:**
- `origin: '*'` with `credentials: true` (security vulnerability)
- Wildcard origins (`*`)
- Allowing all methods

### CSRF Protection

**Token-based CSRF:**
```typescript
// middleware/csrf.ts
import { hash } from 'crypto';

export function generateCSRFToken(sessionId: string): string {
  return hash('sha256')
    .update(sessionId + Date.now() + Math.random())
    .digest('hex');
}

// Validate on protected endpoints
if (req.body._csrf !== req.session.csrfToken) {
  return res.status(403).json({ error: 'CSRF token invalid' });
}
```

**SameSite Cookie:**
```typescript
res.setHeader(
  'Set-Cookie',
  `sessionId=value; SameSite=Strict; Secure; HttpOnly`
);
```

## Rate Limiting and DDoS Protection

### Application-Level Rate Limiting

```typescript
// lib/middleware/rate-limit.ts
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 min
  const maxRequests = options.maxRequests || 100;
  
  const store = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const record = store.get(key);
    
    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    } else {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
      next();
    }
  };
}
```

### Endpoint-Specific Limits

```typescript
// API endpoints with different limits
const authLimiter = createRateLimiter({ 
  windowMs: 15 * 60 * 1000, 
  maxRequests: 5 // 5 attempts per 15 min
});

const apiLimiter = createRateLimiter({ 
  windowMs: 60 * 1000, 
  maxRequests: 100 // 100 requests per minute
});

app.post('/api/auth/login', authLimiter, loginHandler);
app.get('/api/data', apiLimiter, dataHandler);
```

### Infrastructure DDoS Protection

**CloudFlare/WAF Rules:**
1. Rate limiting rules (requests per IP)
2. Bot management
3. Challenge for suspicious traffic
4. IP reputation blocking

## Cookie Security

### Cookie Attributes

```typescript
res.setHeader('Set-Cookie', [
  `sessionId=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
]);
```

**Required Attributes:**
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: Only send over HTTPS
- `SameSite=Strict`: CSRF protection (or `Lax` for some use cases)
- `Path=/`: Limit to necessary paths
- `Max-Age` or `Expires`: Set explicit expiration

### Cookie Storage Structure

```typescript
// session cookie
{
  sessionId: 'crypto-random-hash',
  expiresAt: timestamp,
  user: { id, role },
  ip: 'stored-ip',
  userAgent: 'stored-user-agent'
}

// verification on request
if (cookies.sessionId) {
  if (request.ip !== session.ip && !vpn) throw UnauthorizedError;
  if (request.headers['user-agent'] !== session.userAgent) throw UnauthorizedError;
}
```

## Infrastructure Hardening

### Linux Server Hardening

```bash
# 1. Update system
sudo apt-get update && apt-get upgrade

# 2. Configure firewall
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 3. SSH hardening
sudo nano /etc/ssh/sshd_config

# Disable password auth
PasswordAuthentication no

# Use SSH keys only
PubkeyAuthentication yes

# Disable root login
PermitRootLogin no

# Change port (optional, security through obscurity)
Port 2222

# 4. Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# 5. Enable automatic security updates
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# 6. Configure file permissions
sudo chmod 600 /etc/shadow
sudo chmod 600 /etc/gshadow
sudo chmod 700 /root

# 7. Enable logging
sudo apt-get install auditd
sudo systemctl enable auditd
```

### Docker Container Hardening

```dockerfile
# Use minimal base image
FROM node:18-alpine

# Don't run as root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Remove unnecessary packages
RUN apk del apk-tools && rm -rf /etc/apk /lib/apk

# Read-only filesystem
RUN mount -o remount,ro /

# Set security headers
ENV NODE_ENV=production
```

## Application Hardening

### Input Validation

```typescript
// Comprehensive input validation
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*]/),
  name: z.string().max(100).regex(/^[a-zA-Z\s]+$/),
});

export async function createUser(data: unknown) {
  const validated = userSchema.parse(data);
  // Process validated data
}
```

### Output Encoding

```typescript
// HTML encoding
import { escapeHtml } from 'escape-html';

export function renderUserName(name: string) {
  return `<h1>${escapeHtml(name)}</h1>`;
}

// JSON encoding (automatic in JSON.stringify)
res.json({ message: userInput });
```

### SQL Injection Prevention

```typescript
// Use parameterized queries - GOOD
const user = await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, 'active']
);

// NEVER string concatenation - BAD
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

## Database Hardening

### PostgreSQL Hardening

```sql
-- 1. Create read-only role
CREATE ROLE readonly WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE blockstop TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- 2. Enable encryption
ALTER DATABASE blockstop SET ssl = on;

-- 3. Create audit trigger
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id INTEGER,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Enable row-level security
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON sensitive_data
  USING (user_id = current_user_id());

-- 5. Configure logging
ALTER SYSTEM SET log_statement = 'ddl';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
```

## Verification and Testing

### SSL/TLS Verification

```bash
#!/bin/bash
# test-ssl.sh

echo "Testing TLS Configuration..."

# Test minimum TLS version
echo -n "TLS 1.2: "
echo | openssl s_client -connect example.com:443 -tls1_2 2>/dev/null | grep "Protocol"

# Test HSTS
echo -n "HSTS: "
curl -sI https://example.com | grep "Strict-Transport-Security"

# Test CSP
echo -n "CSP: "
curl -sI https://example.com | grep "Content-Security-Policy"

# Test CORS
echo "Testing CORS..."
curl -sI -H "Origin: http://evil.com" https://example.com | grep "Access-Control-Allow-Origin"

# Test security headers
echo "Testing Security Headers..."
curl -sI https://example.com | grep -E "X-Content-Type-Options|X-Frame-Options|X-XSS-Protection"
```

### Vulnerability Scanning

```bash
#!/bin/bash
# vulnerability-scan.sh

# SAST - Static code analysis
npm audit
npm audit fix

# Check for known vulnerabilities
snyk test

# DAST - Dynamic scanning
# Use OWASP ZAP
zaproxy -cmd -quickurl https://example.com -quickout /tmp/zap-report.html

# Dependency scanning
npm audit --production
```

### Penetration Testing Checklist

- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CSRF tokens validated
- [ ] Authentication bypass attempts fail
- [ ] Privilege escalation prevented
- [ ] Sensitive data not exposed in errors
- [ ] API rate limiting working
- [ ] SSL/TLS properly configured
- [ ] Security headers present
- [ ] Insecure cookies identified and fixed

---

**Last Updated:** June 2026  
**Next Review:** December 2026
