# BlockStop Browser Extension v2.0

Comprehensive threat detection and content scanning for Gmail and web browsing.

## Overview

BlockStop is a modern Chrome extension that provides real-time security scanning for emails, attachments, URLs, and web content. Built with React, TypeScript, and Tailwind CSS, it offers a seamless user experience with advanced threat detection capabilities.

## Features

### Core Scanning
- **Email Security**: Scan Gmail emails for phishing, malware, and suspicious content
- **Attachment Analysis**: Detect malicious files and dangerous file types
- **URL Verification**: Check links for phishing and malicious redirects
- **Real-time Protection**: Automatic scanning of incoming emails with configurable threat levels
- **Sender Reputation**: Verify sender legitimacy against threat intelligence databases

### User Interface
- **Popup Interface**: Quick-access security scanner with compact design
- **Gmail Sidebar**: Integrated panel for email threat analysis
- **Settings Page**: Comprehensive configuration options
- **Threat Badges**: Visual indicators for threat levels on emails
- **Warning Banners**: Clear security warnings with actionable recommendations

### Advanced Features
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+B (scan), Ctrl+Shift+E (email), Ctrl+Shift+S (sidebar)
- **Threat History**: Track scanning results and threat logs
- **Auto Reporting**: Optional automatic threat reporting to improve security database
- **Threat Levels**: Strict, balanced, or permissive detection modes
- **Data Privacy**: Configurable data retention with local-only processing

## Project Structure

```
extension/
├── manifest.json                 # Chrome Manifest V3 configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── .eslintrc.json               # ESLint rules
│
├── src/
│   ├── components/
│   │   ├── EmailScanner.tsx      # Email scanning interface
│   │   ├── QuickScan.tsx         # Quick scan popup component
│   │   ├── Results.tsx           # Results display with threat details
│   │   ├── Settings.tsx          # Extension settings panel
│   │   └── WarningBanner.tsx     # Security warning component
│   │
│   ├── pages/
│   │   ├── popup.html            # Popup page (HTML)
│   │   ├── popup.tsx             # Popup React component
│   │   ├── sidebar.html          # Sidebar page (HTML)
│   │   ├── sidebar.tsx           # Sidebar React component
│   │   ├── options.html          # Options page (HTML)
│   │   └── options.tsx           # Options React component
│   │
│   ├── styles/
│   │   └── content.css           # Content script styles
│   │
│   ├── background.ts             # Service worker background script
│   └── content.ts                # Content script for page injection
│
└── public/
    └── icons/                    # Extension icons (16x16, 48x48, 128x128)
```

## Components

### EmailScanner.tsx
Email scanning interface with threat detection and analysis:
- Email preview display
- Real-time scanning with visual feedback
- Threat level indicators with color coding
- Attachment risk assessment
- Link status analysis with expandable details
- Sender reputation scoring

**Props:**
```typescript
interface EmailScannerProps {
  email?: {
    from: string;
    subject: string;
    body: string;
    attachments?: string[];
    links?: string[];
  };
  onScan?: (result: ScanResult) => void;
}
```

### QuickScan.tsx
Lightweight scanning component for URLs, emails, and text:
- Multiple scan type tabs (URL, email, text)
- Copy-to-clipboard functionality
- Real-time safety score display
- Threat details panel with visual indicators
- Keyboard shortcut hints

**Props:**
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
```

### Results.tsx
Comprehensive threat results display:
- Security score visualization (0-100)
- Threat breakdown by severity (critical, high, medium, low)
- Expandable threat details with metadata
- Threat dismissal and reporting actions
- Export scan results functionality
- Clean card-based layout

**Props:**
```typescript
interface ResultsProps {
  threats: ThreatDetail[];
  overallScore: number;
  timestamp?: number;
  onExport?: () => void;
  onDismiss?: (threatId: string) => void;
}
```

### Settings.tsx
Comprehensive settings and preferences panel:
- **Scanning Options**: Auto-scan, attachment scanning, link checking
- **Protection Features**: Phishing highlighting, suspicious sender blocking
- **Threat Level**: Strict, balanced, or permissive detection modes
- **Notifications**: Push notifications and keyboard shortcuts
- **Privacy**: Data retention duration and threat reporting
- Settings persistence with Chrome Storage API

### WarningBanner.tsx
Reusable warning/notification component:
- Four severity levels (info, warning, critical, error)
- Color-coded styling with appropriate icons
- Optional dismissal capability
- Expandable details section
- Action buttons with variants
- Pre-built preset components (PhishingWarning, MalwareWarning, etc.)

## Pages

### Popup (popup.html + popup.tsx)
400px wide popup interface with:
- User authentication check
- Tab navigation (Scan, Quick Scan, History)
- Email scanning functionality
- Quick scan component integration
- Scan history display
- User account information

### Sidebar (sidebar.html + sidebar.tsx)
Split-panel Gmail sidebar with:
- Email list with search functionality
- Threat statistics dashboard
- Detailed email preview pane
- Threat analysis for selected emails
- Email-specific actions and reporting
- Responsive split layout

### Options (options.html + options.tsx)
Full-page settings interface:
- All extension settings and preferences
- Real-time validation and updates
- Help and support links
- Settings reset functionality
- Cloud sync via Chrome Storage API

## Background Script (background.ts)

Service worker handling:
- **Threat Scanning**: Email, URL, and attachment scanning orchestration
- **API Communication**: Integration with BlockStop threat intelligence API
- **Message Handling**: Communication bridge between content scripts and UI
- **Threat Detection**: Phishing indicators, sender reputation, malware detection
- **Data Management**: Scan history storage and retention
- **Keyboard Commands**: Shortcut handler implementation

### Key Functions
- `scanEmail(email)`: Full email threat analysis
- `scanUrl(url)`: URL verification against threat database
- `scanAttachment(file)`: File malware detection
- `checkSenderReputation(email)`: Sender verification
- `detectPhishingIndicators(body)`: Pattern-based phishing detection
- `saveScanResult(result)`: Store scan history locally
- `reportThreat(threat)`: Send threat reports to BlockStop servers

## Content Script (content.ts)

Gmail page injection and interaction:
- **Email Extraction**: Parse and extract email data from Gmail DOM
- **Threat Visualization**: Add threat badges to email threads
- **Link Analysis**: Highlight suspicious URLs in emails
- **Scan Button**: Inject toolbar button for manual scanning
- **DOM Monitoring**: Detect new emails and auto-scan
- **Notifications**: Display in-page threat notifications
- **User Interaction**: Handle clicks and scan triggers

## Security Features

### Threat Detection Levels
1. **Strict**: Maximum detection sensitivity, may flag legitimate emails
2. **Balanced** (Default): Recommended balance of security and usability
3. **Permissive**: Minimum false positives, may miss some threats

### Scanning Capabilities
- Phishing pattern detection
- Malware file detection
- Suspicious link identification
- Sender reputation verification
- Attachment risk assessment
- Domain mismatches
- Unusual call-to-action language

### Privacy & Data
- Local-only email processing (no content stored on servers)
- Configurable data retention (default 30 days)
- Optional threat reporting for security improvement
- Chrome Storage API for settings synchronization
- No third-party tracking or analytics

## Installation & Setup

### Build from Source
```bash
cd extension
npm install
npm run build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` directory

### Development
```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## API Integration

BlockStop integrates with threat intelligence APIs:

```
POST /api/scan/url
POST /api/scan/file
POST /api/reputation/email
POST /api/threats/report
```

Configure API endpoint in background.ts.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+B | Quick security scan |
| Ctrl+Shift+E | Scan current email |
| Ctrl+Shift+S | Toggle sidebar panel |

Customizable in Chrome Extensions settings.

## Architecture Highlights

### React Component Design
- Functional components with hooks
- TypeScript for type safety
- Reusable, composable components
- Proper prop interfaces

### State Management
- Chrome Storage API for persistent state
- Local component state with useState
- Chrome messages for inter-process communication

### Styling
- Tailwind CSS utility classes
- Custom threat-level color system
- Responsive design
- Dark mode support

### Performance
- Lazy loading of email content
- Efficient DOM queries and caching
- Debounced scan operations
- Memory cleanup in content script

## Dependencies

### Runtime
- `react@18.2.0`: UI framework
- `react-dom@18.2.0`: DOM rendering
- `lucide-react@0.263.1`: Icon library

### Development
- `typescript@5.2.2`: Type safety
- `vite@5.0.0`: Build tool
- `tailwindcss@3.3.5`: CSS framework
- `@types/chrome`: Chrome API types
- `eslint`: Code linting

## Browser Support

- Chrome 90+
- Edge 90+ (Chromium-based)
- Brave, Opera, and other Chromium browsers

## License

Proprietary - BlockStop Security

## Support

For issues, questions, or feature requests:
- Documentation: [blockstop.io/docs](https://blockstop.io/docs)
- Support: [support@blockstop.io](mailto:support@blockstop.io)
- GitHub Issues: [blockstop-ai/extension](https://github.com/blockstop-ai/extension/issues)

## Changelog

### v2.0.0 (2024)
- Complete redesign with React and TypeScript
- Gmail sidebar integration
- Advanced threat detection with multiple severity levels
- Keyboard shortcuts and quick actions
- Improved UI/UX with Tailwind CSS
- Chrome Storage API integration
- Enhanced email scanning capabilities

### v1.0.0 (2023)
- Initial release
- Basic email scanning
- Simple UI

---

**Version 2.0.0** | Built with React, TypeScript & Tailwind CSS | Manifest V3
