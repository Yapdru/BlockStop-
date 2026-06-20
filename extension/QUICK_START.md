# BlockStop Browser Extension - Quick Start Guide

## Installation for Development

```bash
cd extension
npm install
npm run build
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/extension/dist` folder
5. Extension appears in Chrome toolbar

## Key Commands

```bash
npm run build       # Production build
npm run type-check  # TypeScript validation
npm run lint        # ESLint
npm run dev        # Dev server (if configured)
```

## Important Directories

```
extension/
├── src/
│   ├── background/      # Service worker (5 files)
│   │   ├── worker.ts           # Main worker
│   │   ├── auth-service.ts     # OAuth + tokens
│   │   ├── offline-db.ts       # IndexedDB
│   │   ├── tier-gating.ts      # Feature access
│   │   └── sync-manager.ts     # Offline sync
│   ├── content/         # Content scripts (3 files)
│   │   ├── email-injector.ts   # Gmail integration
│   │   ├── link-checker.ts     # Hover previews
│   │   └── file-monitor.ts     # Download monitoring
│   └── shared/          # Shared utilities (3 files)
│       ├── types.ts            # Type definitions
│       ├── storage.ts          # Chrome Storage wrapper
│       └── api-client.ts       # API client
├── manifest.json        # Extension manifest (MV3)
└── vite.config.ts       # Build config
```

## Debugging

### Service Worker Logs
1. Go to `chrome://extensions`
2. Find "BlockStop" extension
3. Click "Service Worker" link → Opens DevTools

### Content Script Logs
1. Open any website
2. Press F12 (DevTools)
3. Content script logs in Console

### Storage Inspector
- Open `chrome://storage-internals`
- Select extension ID
- Browse sync/local storage + IndexedDB

## Architecture at a Glance

```
Content Scripts
    ↓ chrome.runtime.sendMessage()
Service Worker (Main Logic)
    ├→ Auth Service (OAuth)
    ├→ Offline DB (IndexedDB)
    ├→ Tier Gating (Feature Access)
    ├→ Sync Manager (Offline Queue)
    └→ API Client (Network Calls)
    ↓ chrome.storage API
Chrome Storage
    ├ Sync (100KB) - Auth, settings
    └ Local (10MB) - History, cache
IndexedDB (Unlimited) - Threat signatures
```

## Key Features

### Authentication
- OAuth with Google
- Auto-refresh tokens
- Logout capability

### Offline Threat Detection
- Local threat database (IndexedDB)
- Phishing pattern matching
- Link signature lookup
- Only for MAX/NEO/PRO tiers

### Email Scanning
- Gmail integration
- Threat badges
- Dangerous link highlighting
- Auto-scan on email open

### Link Checking
- Hover previews
- 24-hour cache
- Risk scoring
- Visual indicators

### Download Monitoring
- Auto-scan on download
- Inline notifications
- Threat status display

## Testing

### Manual Checklist
```
[ ] Install extension successfully
[ ] OAuth login works
[ ] Scan Gmail email
[ ] See threat badge
[ ] Hover over link
[ ] See link preview
[ ] Download file
[ ] See scan notification
[ ] Check settings persist
[ ] Test offline mode
```

### Network Testing
1. Open DevTools
2. Throttle network (offline)
3. Try email scan
4. Should use offline DB if tier supports it

### Storage Testing
1. Open `chrome://storage-internals`
2. Check Chrome Storage usage
3. Monitor IndexedDB size
4. Verify sync queue empty after online

## Rate Limits

```
FREE:     10 scans/day
NEO:      50 scans/day
PRO:      200 scans/day
OFFICE:   10,000 scans/day
MAX:      Unlimited
```

## File Size Targets

- Extension package: < 5MB
- Memory usage: < 20MB
- Startup time: < 500ms
- Email scan: < 1s
- Link check: < 200ms (cached)

## Common Issues

### Extension Won't Load
- Check `chrome://extensions` errors
- Validate manifest.json syntax
- Ensure all files in dist/

### Storage Full
- Check quota: `chrome://storage-internals`
- Clear scan history: Options page
- Remove old cache entries

### Messages Not Working
- Verify content script injected
- Check message handler exists
- Look in Service Worker logs

### OAuth Loop
- Clear cookies for auth.blockstop.io
- Check redirect URI matches
- Verify extension ID in config

## Deployment

### Chrome Web Store
```bash
npm run build
zip -r blockstop-extension.zip dist/ manifest.json
# Upload to https://chrome.google.com/webstore/devconsole
```

### Firefox Add-ons
```bash
# Adapt manifest.json for Firefox
# Rename to web-ext
npm run build
web-ext sign --api-key={key} --api-secret={secret}
```

### Testing in Different Browsers
- **Chrome:** Load unpacked
- **Firefox:** `about:debugging` → Load Temporary Add-on
- **Safari:** Xcode → SwiftUI app wrapper

## Useful Links

- Manifest V3 Docs: https://developer.chrome.com/docs/extensions/mv3/
- Chrome Storage API: https://developer.chrome.com/docs/extensions/reference/storage/
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- OAuth: https://auth.blockstop.io/docs

## Next Steps

1. **Implement Popup UI** (uses existing React components)
2. **Add Options Page** (settings, tier info)
3. **Implement Sidebar** (persistent panel)
4. **Add Advanced Filters** (search, date range)
5. **Push Notifications** (critical alerts)

---

**Ready to extend?** Check `IMPLEMENTATION.md` for full architecture details.
