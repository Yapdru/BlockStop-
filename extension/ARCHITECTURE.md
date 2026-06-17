# BlockStop Extension Architecture

## System Overview

BlockStop is a Chrome extension built with Manifest V3, React, and TypeScript. The extension provides real-time threat detection for Gmail emails, attachments, and web content.

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
├──────────────────┬──────────────────┬──────────────────────┤
│   Popup UI       │   Sidebar UI     │   Options UI         │
│  (React)         │  (React)         │  (React)             │
└────────┬─────────┴─────────┬────────┴──────────┬───────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
    ┌────▼────────────────┐         ┌───────────▼──────┐
    │  Service Worker     │         │  Content Script  │
    │  (background.ts)    │         │  (content.ts)    │
    │                     │         │                  │
    │ - API Calls        │         │ - Email Parsing  │
    │ - Threat Detection │         │ - DOM Injection  │
    │ - Data Management  │         │ - Link Analysis  │
    │ - Settings Sync    │         │ - Notifications  │
    └──────┬─────────────┘         └──────────────────┘
           │
           │ Messages via chrome.runtime
           │
      ┌────▼────────────────────┐
      │   Chrome Storage API    │
      │  (sync & local)         │
      │                         │
      │ - Settings              │
      │ - Scan History          │
      │ - User Preferences      │
      └─────────────────────────┘
```

## Component Hierarchy

### UI Layer (React Components)

```
popup.tsx (Popup Page)
├── EmailScanner
│   └── ScanResult Display
├── QuickScan
│   └── Result Display
└── Navigation Tabs

sidebar.tsx (Gmail Sidebar)
├── Search Bar
├── Email List
└── Detail Panel
    ├── Email Preview
    ├── Threat Warnings
    └── Actions

options.tsx (Settings Page)
└── Settings
    ├── Scanning Section
    ├── Notifications Section
    └── Privacy Section

Components (Reusable)
├── EmailScanner.tsx
├── QuickScan.tsx
├── Results.tsx
├── Settings.tsx
└── WarningBanner.tsx
```

## Data Flow

### Email Scanning Flow

```
1. User opens Gmail email
   │
   ├─► Content Script detects new email
   │   └─► Extracts email data from DOM
   │       └─► Sends to background script
   │
   ├─► Background Script processes:
   │   ├─► Checks sender reputation
   │   ├─► Detects phishing patterns
   │   ├─► Analyzes attachments
   │   ├─► Verifies links
   │   └─► Calculates threat level
   │
   ├─► Results stored in Chrome Storage
   │
   └─► Content Script displays:
       ├─► Threat badge
       ├─► Highlighted links
       └─► In-page notification

2. User clicks "Scan Email" button
   │
   ├─► Popup/Sidebar sends message to background
   │   └─► Triggers detailed scan
   │
   └─► Results displayed in Results component
```

### Message Flow

```
Content Script (Gmail page)
           │
           │ chrome.runtime.sendMessage({
           │   action: 'scanEmail',
           │   email: {...}
           │ })
           │
           ▼
Background Script (Service Worker)
           │
           ├─► Process threat detection
           ├─► Query threat API
           └─► sendResponse({
                 success: true,
                 result: {...}
               })
           │
           ▼
Content Script / Popup UI
           │
           └─► Update UI with results
```

## File Organization

### Source Structure

```
src/
├── components/                      # Reusable React components
│   ├── EmailScanner.tsx            # Email scanning interface
│   ├── QuickScan.tsx               # Quick scan component
│   ├── Results.tsx                 # Results display
│   ├── Settings.tsx                # Settings panel
│   └── WarningBanner.tsx           # Warning/notification banner
│
├── pages/                          # Full page components
│   ├── popup.tsx                   # Popup page component
│   ├── popup.html                  # Popup page template
│   ├── sidebar.tsx                 # Gmail sidebar component
│   ├── sidebar.html                # Sidebar page template
│   ├── options.tsx                 # Settings page component
│   └── options.html                # Options page template
│
├── styles/
│   └── content.css                 # Content script styles
│
├── background.ts                   # Service worker script
└── content.ts                      # Content script
```

### Configuration Files

```
├── manifest.json                   # Chrome Manifest V3
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                 # Vite build config
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
└── .eslintrc.json                 # ESLint rules
```

## Service Worker (background.ts)

### Responsibilities
1. **Threat Scanning** - Orchestrate email, URL, and file scanning
2. **API Integration** - Call threat intelligence services
3. **Message Handling** - Bridge between UI and content scripts
4. **Data Management** - Store and manage scan history
5. **Settings Sync** - Handle Chrome Storage API

### Key Functions

```typescript
// Scanning Operations
scanEmail(email)           // Full email threat analysis
scanUrl(url)              // URL verification
scanAttachment(file)      // Malware detection

// Analysis
checkSenderReputation(email)        // Sender verification
detectPhishingIndicators(body)      // Pattern detection
calculateThreatLevel(threats)       // Risk assessment
calculateSecurityScore(threats)     // Score calculation

// Data Management
saveScanResult(result)    // Store scan history
getScanHistory(limit)     // Retrieve history
clearScanHistory()        // Clear local data

// Communication
handleMessage()           // Message router
reportThreat()           // Send reports to API
```

### Message Protocol

```typescript
// Request Format
{
  action: 'scanEmail' | 'scanUrl' | 'scanAttachment' | 'reportThreat',
  email?: {...},
  url?: string,
  file?: {...},
  threat?: {...}
}

// Response Format
{
  success: boolean,
  result?: {...},
  error?: string
}
```

## Content Script (content.ts)

### Responsibilities
1. **DOM Integration** - Inject UI into Gmail
2. **Email Extraction** - Parse email data from DOM
3. **DOM Monitoring** - Detect new emails
4. **Threat Visualization** - Display threat indicators
5. **User Interaction** - Handle button clicks and actions

### Key Functions

```typescript
// Setup
init()                              // Initialize content script
setupGmailIntegration()            // Add Gmail UI elements
observeGmailUpdates()              // Monitor DOM changes

// Email Processing
extractEmailFromElement(element)    // Parse email from DOM
extractEmailsFromDOM()             // Get all visible emails
scanEmailContent(email)            // Trigger background scan

// UI Updates
addThreatBadge()                   // Add threat indicator
highlightDangerousLinks()          // Mark suspicious links
showNotification()                 // Display in-page message

// Analysis
isSuspiciousLink(url)              // Check URL patterns
performQuickScan()                 // Scan selected text
```

## React Components

### EmailScanner.tsx
```typescript
interface ScanResult {
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  threats: string[];
  attachmentRisks: string[];
  linkStatus: Array<{url, status, reason?}>;
  senderReputation: {score, verified};
}

// Component manages:
- Email scanning workflow
- Threat display with severity colors
- Link expansion/details
- Email preview
- Loading states
```

### QuickScan.tsx
```typescript
interface QuickScanProps {
  onScan?: (content: string) => void;
  loading?: boolean;
  result?: {
    isSafe: boolean;
    score: number;
    details: string;
  };
}

// Provides:
- Multi-type scanning (URL, email, text)
- Real-time score visualization
- Copy-to-clipboard
- Keyboard shortcuts
```

### Results.tsx
```typescript
interface ThreatDetail {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Features:
- Overall security score
- Threat breakdown by severity
- Expandable threat details
- Export functionality
- Threat dismissal
```

### Settings.tsx
```typescript
interface SettingsConfig {
  enableAutoScan: boolean;
  enableNotifications: boolean;
  scanAttachments: boolean;
  checkLinks: boolean;
  blockSuspiciousSenders: boolean;
  highlightPhishingIndicators: boolean;
  enableKeyboardShortcuts: boolean;
  threatLevel: 'strict' | 'balanced' | 'permissive';
  autoReportThreats: boolean;
  dataRetentionDays: number;
}

// Manages:
- All extension preferences
- Chrome Storage sync
- Settings validation
- Reset to defaults
```

### WarningBanner.tsx
```typescript
interface WarningBannerProps {
  level: 'info' | 'warning' | 'critical' | 'error';
  title: string;
  message: string;
  details?: string;
  actions?: Array<{label, onClick, variant?}>;
  dismissible?: boolean;
}

// Pre-built warnings:
- PhishingWarning
- MalwareWarning
- SuspiciousLinkWarning
- InfoBanner
```

## Chrome APIs Used

### Manifest V3 APIs

| API | Purpose |
|-----|---------|
| `chrome.storage.sync` | Persistent user settings |
| `chrome.storage.local` | Scan history and cache |
| `chrome.runtime` | Message passing |
| `chrome.tabs` | Tab access and injection |
| `chrome.commands` | Keyboard shortcuts |
| `chrome.sidePanel` | Gmail sidebar integration |

### Permissions

```json
{
  "permissions": [
    "storage",        // Chrome Storage API
    "activeTab",      // Active tab access
    "scripting",      // Content script injection
    "tabs",           // Tab information
    "webRequest"      // Web request monitoring
  ],
  "host_permissions": [
    "https://mail.google.com/*",
    "https://gmail.google.com/*",
    "*://*/*"         // All websites
  ]
}
```

## Styling Architecture

### Tailwind CSS Integration

```
tailwind.config.js
├── Custom threat color palette
│   ├── critical: #dc2626 (red)
│   ├── high: #ea580c (orange)
│   ├── medium: #eab308 (yellow)
│   ├── low: #2563eb (blue)
│   └── safe: #16a34a (green)
│
├── Animation keyframes
│   ├── slideIn/slideOut
│   └── pulse
│
└── Component utilities
    ├── threat-shadow-sm/md/lg
    └── Custom spacing
```

### Content Script Styles

```css
components/
├── .blockstop-threat-badge    /* Threat indicator */
├── .blockstop-notification    /* Toast notifications */
├── .blockstop-scan-btn        /* Scan button */
└── .blockstop-threat-highlight /* Highlighted elements */

animations/
├── @slideIn                   /* Message enter */
├── @slideOut                  /* Message exit */
├── @pulse                     /* Loading indicator */
└── @spin                      /* Rotating loader */
```

## Build Process

### Vite Configuration

```
vite.config.ts
├── Input:
│   ├── popup.html → popup.tsx
│   ├── sidebar.html → sidebar.tsx
│   ├── options.html → options.tsx
│   ├── background.ts
│   └── content.ts
│
└── Output:
    ├── dist/
    │   ├── popup.js
    │   ├── sidebar.js
    │   ├── options.js
    │   ├── background.js
    │   ├── content.js
    │   └── index.css
    └── manifest.json (copied)
```

### Build Steps

1. **TypeScript Compilation**: .ts/.tsx → .js
2. **React Transform**: JSX → JavaScript
3. **CSS Processing**: Tailwind → Optimized CSS
4. **Bundling**: Code splitting per entry point
5. **Minification**: Terser for production
6. **Source Maps**: Debug symbols generated

## Security Considerations

### Data Privacy
- Email content never sent to external servers
- Local-only processing and storage
- Configurable data retention
- No user tracking or analytics

### Threat Detection
- Multiple detection layers
- Pattern-based phishing detection
- Reputation API integration
- File type validation
- URL domain verification

### Chrome Extension Security
- Manifest V3 compliance
- Content Security Policy adherence
- Safe message passing
- CORS-compliant API calls
- No eval() or unsafe JavaScript

## Performance Optimizations

### Memory Management
- Lazy loading of email content
- Event listener cleanup
- DOM node recycling
- Storage quota management

### Scanning Efficiency
- Parallel threat checks
- Cached sender reputation
- Debounced DOM scanning
- Batch email processing

### UI Responsiveness
- Async background operations
- Progress indicators
- Non-blocking scans
- Smooth animations

## Testing & Quality

### Type Safety
- Full TypeScript coverage
- Strict mode enabled
- Interface validation

### Code Quality
- ESLint configuration
- Strict rules for consistency
- No unused variables
- Proper error handling

### Development Tools
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run type-check    # Type checking
npm run lint          # Linting
```

## Future Enhancements

- [ ] Advanced ML-based threat detection
- [ ] Integration with VirusTotal API
- [ ] Custom blocklist management
- [ ] Browser history scanning
- [ ] Attachment quarantine
- [ ] Multi-device sync
- [ ] Dark mode improvements
- [ ] Offline functionality
- [ ] Accessibility improvements
- [ ] Localization support

---

**Architecture Version 2.0** | Manifest V3 | React + TypeScript
