# AdminBlock - BlockStop Admin Dashboard

AdminBlock is a production-grade admin dashboard for BlockStop operations. It provides real-time monitoring of payments, users, servers, and system health with secure passcode authentication.

## Features

### 🔐 Security
- **Passcode Authentication** - Secure admin-only access with bcrypt hashing
- **Session Management** - 30-minute timeout with automatic logout
- **Rate Limiting** - 5 failed attempts max, 15-minute lockout
- **Security Headers** - HSTS, X-Frame-Options, XSS Protection
- **Encrypted Sessions** - JWT-signed session tokens

### 📊 Real-time Monitoring
- **Dashboard** - Overview cards with revenue, users, and system health
- **Payment Tracking** - Real-time payment list with filtering and export
- **User Management** - Active users with kick/disconnect capability
- **Server Status** - CPU, memory, latency, and connection monitoring
- **Activity Logs** - Comprehensive audit trail with filtering

### 💰 Revenue Management
- **Payment Analytics** - Success rate, refunds, and revenue trends
- **Export to CSV** - Download payment history
- **Tier Tracking** - Free, Pro, and Enterprise user breakdown
- **Revenue Dashboard** - This month vs last month comparisons

### 🖥️ System Monitoring
- **Server Health** - Real-time CPU, memory, and request metrics
- **Database Status** - Connection count and cache hit rate
- **API Latency** - Real-time latency monitoring
- **Error Tracking** - System-wide error rate and alerts

## Quick Start

### Installation

1. **Install dependencies:**
```bash
cd AdminBlock
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Default credentials (development only):**
- Passcode: `AdHey22@8`
- **IMPORTANT**: Change this immediately in production

### Development

```bash
npm run dev
```

Access the dashboard at `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## Environment Configuration

### Critical Variables

```env
# Admin passcode hash (bcrypt)
ADMIN_PASSCODE_HASH=$2a$10$...

# Session token secret (strong random string)
SESSION_TOKEN_SECRET=super-secret-key

# BlockStop API connection
BLOCKSTOP_API_URL=http://localhost:3000/api
BLOCKSTOP_API_KEY=your-api-key

# Client-side API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Architecture

### Core Modules

**Authentication (`lib/auth/passcode-auth.ts`)**
- Passcode hashing and verification
- Session management
- Rate limiting
- Cookie handling

**NetAdmin (`lib/NetAdmin.ts`)**
- Real-time server monitoring
- Payment aggregation
- User tracking
- System health checks
- Data caching with TTL

**API Client (`lib/api-client.ts`)**
- Type-safe API requests
- Error handling
- File uploads
- Admin endpoint helpers

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Login page |
| `/dashboard` | Overview and metrics |
| `/payments` | Payment tracking and analytics |
| `/users` | Active user management |
| `/servers` | Server monitoring |
| `/logs` | Activity log viewer |

### Components

- **AdminLayout** - Main navigation and layout
- **PaymentCard** - Payment record display
- **UserList** - User listing with filters
- **ServerStatus** - Server health cards
- **RealtimeChart** - Chart.js powered graphs

## API Endpoints

### Authentication
```
POST /api/admin/auth/verify - Verify passcode
POST /api/admin/auth/logout - Clear session
```

### Data Endpoints (requires session)
```
GET /api/admin/users - Active users
GET /api/admin/payments - Payment list
GET /api/admin/servers - Server status
GET /api/admin/revenue - Revenue stats
GET /api/admin/logs - Activity logs
GET /api/admin/health - System health
```

## Styling

AdminBlock uses a custom dark admin theme with Tailwind CSS:

```css
colors:
  - admin-bg: #0f1419 (background)
  - admin-card: #1a1f2e (cards)
  - admin-border: #2d3142 (borders)
  - admin-text: #e4e6eb (text)
  - admin-text-muted: #8a8d99 (muted text)
  - admin-accent: #3b82f6 (accent/blue)
  - admin-success: #10b981 (green)
  - admin-warning: #f59e0b (orange)
  - admin-danger: #ef4444 (red)
```

## Security Best Practices

1. **Passcode**
   - Change default immediately
   - Use bcrypt for hashing
   - Minimum 8 characters recommended
   - Rotate periodically

2. **Session**
   - 30-minute timeout enforced
   - Secure cookies (httpOnly, sameSite=strict)
   - HTTPS only in production
   - JWT validation on every request

3. **Rate Limiting**
   - 5 failed attempts triggers 15-minute lockout
   - IP-based tracking
   - Auto-cleanup of expired entries

4. **Logging**
   - All access attempts logged
   - Failed login tracking
   - Session management audit trail

5. **Network**
   - HSTS enforced
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - XSS Protection enabled

## Performance

- **Caching** - 5-second TTL for most data
- **Real-time Updates** - WebSocket ready
- **Lazy Loading** - Code splitting per page
- **Image Optimization** - Next.js image component

## Monitoring

AdminBlock monitors:
- Payment success/failure rates
- Active user sessions
- Server CPU and memory usage
- Database connection counts
- API latency
- Error rates
- Cache hit rates
- System uptime

## Troubleshooting

### "Invalid passcode" after correct entry
- Check bcrypt hash format in .env.local
- Verify ADMIN_PASSCODE_HASH is set correctly
- Test hash with: `npx bcrypt-cli hash "AdHey22@8"`

### Session timeout too quick
- Increase SESSION_TIMEOUT in `lib/auth/passcode-auth.ts`
- Default is 30 minutes (adjust as needed)

### API connection errors
- Verify BLOCKSTOP_API_URL is accessible
- Check BLOCKSTOP_API_KEY is valid
- Ensure API endpoint returns expected format

### Rate limit locked
- Check lock duration in `lib/auth/passcode-auth.ts`
- Default lockout: 15 minutes
- Wait or clear from memory store

## Development Notes

### Adding New Pages

1. Create route in `app/[section]/page.tsx`
2. Wrap with `<AdminLayout>`
3. Add to nav in `components/AdminLayout.tsx`
4. Fetch data via `getNetAdmin()`

### Adding New Components

1. Create in `components/`
2. Use `'use client'` for client-side features
3. Follow naming convention: `PascalCase.tsx`
4. Use Framer Motion for animations

### API Integration

```typescript
import { getNetAdmin } from '@/lib/NetAdmin';

const netAdmin = getNetAdmin();
const users = await netAdmin.getActiveUsers();
```

## Deployment

### Vercel
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Secrets
Set in production:
- ADMIN_PASSCODE_HASH
- SESSION_TOKEN_SECRET
- BLOCKSTOP_API_KEY

## Contributing

1. Follow TypeScript strict mode
2. Use Tailwind for styling
3. Implement error handling
4. Add logging for debugging
5. Test with actual API endpoints

## License

Proprietary - BlockStop Inc.

## Support

For issues or questions:
1. Check logs in browser console
2. Review environment configuration
3. Verify API endpoint connectivity
4. Check rate limit status

---

**Version:** 1.0.0
**Last Updated:** 2024
**Maintainer:** BlockStop Admin Team
