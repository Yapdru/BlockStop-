# BlockStop Setup Guide

Complete guide to setting up BlockStop for production.

## 1. Database Migrations

### Option A: Using Node.js (Recommended)

```bash
# Install dependencies if needed
npm install pg

# Run migrations
node scripts/migrate.js
```

### Option B: Using psql

```bash
bash scripts/run-migrations.sh
```

**What gets created:**
- `users_neo` - NEO tier user accounts
- `unified_transactions` - All payment transactions
- `paytm_orders` - PayTM payment orders
- `upi_transactions` - UPI QR code transactions
- `user_settings` - User preferences
- `user_integrations` - Connected services (23 providers)
- `enterprise_integrations` - Enterprise connectors
- `subscriptions` - Active subscriptions

---

## 2. OAuth Setup (Google)

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "BlockStop"
3. Enable APIs:
   - Google+ API
   - Google Drive API
   - Gmail API
   - Google Calendar API

4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://your-domain.com/api/auth/callback/google
     ```

5. Copy:
   - `Client ID`
   - `Client Secret`

### Step 2: Update Environment Variables

Create `.env.local`:

```bash
# OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blockstop_db

# PayTM
PAYTM_MERCHANT_ID=your_merchant_id
PAYTM_MERCHANT_KEY=your_merchant_key
PAYTM_CALLBACK_URL=https://your-domain.com/api/billing/paytm/callback
```

### Step 3: Test OAuth

```bash
npm run dev
# Go to http://localhost:3000/login
# Click "Sign in with Google"
```

---

## 3. Testing

### Run Tests

```bash
# Unit tests
npm test

# With coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

### Test Files

```
__tests__/
├── auth/
│   ├── login.test.ts
│   └── oauth.test.ts
├── billing/
│   ├── paytm.test.ts
│   └── payments.test.ts
├── integrations/
│   └── providers.test.ts
└── api/
    └── routes.test.ts
```

### Create Test Suite

```bash
mkdir -p __tests__/{auth,billing,integrations,api}
npm test
```

---

## 4. Deployment

### Option A: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Configure in Vercel dashboard:**
- Environment variables (.env.local)
- Database connection
- Custom domain

### Option B: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and deploy:

```bash
docker build -t blockstop .
docker run -p 3000:3000 blockstop
```

### Option C: Self-Hosted (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Clone and setup
git clone <repo> blockstop
cd blockstop
npm install

# Build
npm run build

# Run with PM2
npm install -g pm2
pm2 start "npm start" --name blockstop
```

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] OAuth credentials set up
- [ ] PayTM merchant account active
- [ ] Tests passing
- [ ] Build succeeds (`npm run build`)
- [ ] SSL certificate configured
- [ ] Domain pointing to server
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## 5. Next Steps / Post-Deployment

### Immediate (Week 1)

- [ ] Monitor application logs
- [ ] Test payment flows end-to-end
- [ ] Verify email notifications
- [ ] Check BetterBot AI responses
- [ ] Monitor database performance

### Short-term (Month 1)

- [ ] Set up analytics (Mixpanel, Amplitude)
- [ ] Configure error tracking (Sentry)
- [ ] Enable CDN (Cloudflare, AWS CloudFront)
- [ ] Set up daily backups
- [ ] Create admin dashboard

### Medium-term (3 months)

- [ ] Implement 2FA for users
- [ ] Add advanced threat hunting
- [ ] Create mobile apps (iOS/Android)
- [ ] Partner integrations
- [ ] Advanced reporting

### Long-term (6+ months)

- [ ] Machine learning improvements
- [ ] Enterprise on-prem options
- [ ] API marketplace
- [ ] Custom threat intelligence
- [ ] Global threat correlation

---

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW()"

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### OAuth Not Working

```bash
# Check credentials in .env.local
# Verify redirect URI in Google Cloud Console
# Clear browser cookies
```

### Payments Not Processing

```bash
# Verify PayTM credentials
# Check payment logs: /api/billing/paytm/callback
# Test with PayTM sandbox first
```

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

---

## Support

- Documentation: `/docs`
- API Reference: `/api`
- Status Page: `https://status.blockstop.app`
- Support: `support@blockstop.app`

---

**Last Updated:** 2024
**Version:** 1.0.0
