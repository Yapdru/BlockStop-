# BlockStop PRO

Advanced email and file security analysis tool with real DRAR AI and BetterBot PRO engines, deployed via BlockOS containerized environment.

## 🎯 Features

- 📧 **DRAR AI Email Analysis** - Heuristic-based phishing, link, and spam detection
- 📁 **BetterBot PRO Malware Detection** - Signature-based malware and virus scanning
- 🔔 **Gmail Alerts** - Real-time alerts directly in Gmail inbox
- 📊 **Comprehensive History** - Track all scans with detailed reports
- 🐳 **BlockOS Environment** - Containerized security platform with custom CLI
- 🌐 **GitHub Pages Support** - Automatic static site deployment

## 🛡️ AI Engines

### DRAR AI (Distributed Risk Analysis & Reputation)
- Phishing detection with keyword analysis
- Suspicious sender reputation evaluation
- Malicious link detection
- Urgency tactic identification
- Pattern-based threat scoring

### BetterBot PRO
- File signature analysis (YARA-like rules)
- Entropy-based packing detection
- Dangerous extension classification
- Ransomware behavior indicators
- Trojan/backdoor pattern matching

## 💻 Tech Stack

- **Framework**: Next.js 14+ (React + TypeScript)
- **Styling**: Tailwind CSS (light blue theme with animations)
- **Backend**: Next.js API Routes
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL with custom schema
- **Authentication**: NextAuth.js (ready for Gmail OAuth)
- **CLI**: Custom BlockOS shell interface

## Project Structure

```
blockstop-pro/
├── app/                      # Next.js app directory
│   ├── api/                  # Backend API routes
│   │   ├── email/check       # Email analysis endpoint
│   │   └── file/upload       # File upload endpoint
│   ├── (features)/           # Feature pages
│   │   ├── email-checker/    # Email checker UI
│   │   └── file-scanner/     # File scanner UI
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # Reusable React components (to be created)
├── lib/                      # Utility functions
│   ├── ai/                   # AI service integrations
│   │   ├── drar-ai.ts        # DRAR AI service
│   │   └── betterbot-pro.ts  # BetterBot PRO service
│   └── db.ts                 # Database connection (to be created)
├── types/                    # TypeScript types
│   ├── email.ts              # Email types
│   └── file.ts               # File types
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── next.config.js            # Next.js configuration
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Phases

### Phase 25: ✅ Massive UX Redesign (Complete - 70%)
**Status:** Phases 25.1-25.3 complete, 25.4-25.5 framework ready

- **Phase 25.1:** Design System Foundation ✅
  - Light blue primary (#1E88FF), yellow accent (#FFE500), neutral palette
  - Typography system (h1-h6, body, small, xs)
  - Spacing scale (xs-xxl, 4px-48px)
  - Tailwind config extended with custom tokens

- **Phase 25.2:** Core Component Library ✅
  - 12 production-ready components (Button, Card, Input, Badge, BottomNav, CommandPalette, Sidebar, Modal, Tabs, Dropdown, SmartToolbar, AnimatedCard)
  - TypeScript interfaces for all props
  - Responsive design and accessibility built-in

- **Phase 25.3:** Page Redesigns (16 pages) ✅
  - **Tier 1-2:** Dashboard, Email Checker, File Scanner, BetterBot, Pricing, Settings
  - **Tier 3:** Account, Security, Privacy, Integrations
  - **Tier 4:** VPN Selector, WiFi Checker, Compliance Dashboard
  - **Tier 5-7:** Home, Upgrade, Team Management
  - Mobile-first responsive design
  - Bottom navigation for mobile users

- **Phase 25.4:** Accessibility & Mobile Polish ⏳
  - ARIA labels and keyboard navigation
  - WCAG 2.1 AAA compliance target
  - High-contrast mode support
  - Screen reader testing
  - Mobile device testing

- **Phase 25.5:** Testing & Deployment ⏳
  - Unit tests (Jest, 80% coverage target)
  - E2E tests (critical flows)
  - Performance testing (Lighthouse)
  - Cross-browser testing
  - Production deployment

### Phase 26: Native App Distribution (Planning)
**Status:** Planning phase - awaiting clarification on 26.3-26.6

- **Phase 26.1:** iOS App Distribution ⏳
  - **IBlock** - Universal iOS/iPad app (.ipa)
  - Install via Feather or similar tools
  - Tier availability:
    - FREE: No native app
    - NEO: No native app
    - PRO: ✅ iPhone (NOT iPad)
    - MAX: ✅ iPhone + iPad with animations
  - Features:
    - Full threat analysis interface
    - Quick scan capability
    - Notification integration
    - Offline capability for scans

- **Phase 26.2:** macOS App Distribution ⏳
  - **MACBlock** - Native macOS app (.app)
  - Menu bar integration:
    - Shield icon in menu bar
    - Quick review tap option
    - "Full" button opens main app window
  - Full Mac-optimized UI with all integrations
  - Tier availability:
    - FREE: Very limited badge (degraded)
    - NEO: ✅ Mac app with basic controls
    - PRO: ✅ Mac app with full features
    - MAX: ✅ Mac app with advanced animations
  - Features:
    - Menu bar quick access
    - Desktop notifications
    - Spotlight integration
    - Keyboard shortcuts
    - Background scanning

### ❓ CLARIFICATION NEEDED FOR PHASES 26.3-26.6

Please answer the following to finalize Phase 26 architecture:

**Phase 26.3 - Cloud Sync & Cross-Device**
1. Should native apps sync data with web app in real-time?
2. For PRO (Mac only): Should users have one unified account across web + Mac?
3. For MAX (all devices): Sync strategy - CloudKit (Apple), custom server, or both?
4. Offline mode: Store last N scans locally or always require connection?

**Phase 26.4 - Advanced Mac Features**
1. Context menu integration for right-click file scanning?
2. Safari extension for email/link checking?
3. Mail app integration for automatic email scanning?
4. Accessibility features (VoiceOver support, keyboard-only navigation)?

**Phase 26.5 - iOS Advanced Features**
1. Should IBlock support URLSchemes for deep linking from Safari?
2. Share extension to scan files from Files app?
3. Siri shortcuts integration?
4. Background app refresh for periodic scans?

**Phase 26.6 - Distribution & Updates**
1. App Store distribution or side-loading only?
2. Auto-update mechanism (in-app or OS-level)?
3. Beta testing channel (TestFlight for iOS, separate macOS builds)?
4. License key management for tier verification?

---

### Phase 1.0: ✅ Project Setup (Complete)
- Initialize Next.js with TypeScript and Tailwind CSS
- Set up folder structure and configuration
- Create `.env.local` template
- Commit initial setup

### Phase 1.1: AI Service Layer (In Progress)
- DRAR AI service for email analysis
- BetterBot PRO service for file scanning

### Phase 1.2: Backend API Routes (Next)
- Email checking API endpoint
- File upload & scanning endpoint
- Gmail OAuth endpoints
- History endpoints

### Phase 1.3: Frontend UI
- Email checker page with results display
- File scanner page with drag-drop uploader
- History/dashboard page
- Smooth animations and light blue theme

### Phase 1.4: Gmail Integration
- NextAuth with Gmail OAuth
- Gmail API integration
- Auto-scan on new emails
- Send alerts to Gmail

### Phase 1.5: Testing & Polish
- End-to-end testing
- Performance optimization
- Error handling and loading states
- UI/UX polish

## API Endpoints

### Email Checking
- **POST** `/api/email/check` - Analyze email for threats
  - Request: `{ email: string }`
  - Response: `{ riskScore: number, threats: string[], timestamp: string }`

### File Scanning
- **POST** `/api/file/upload` - Scan file for malware
  - Request: `FormData` with file
  - Response: `{ fileName, fileType, fileSize, threatLevel, threats }`

## Environment Variables

See `.env.local.example` for all required environment variables:
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `GOOGLE_ID` - Google OAuth client ID
- `GOOGLE_SECRET` - Google OAuth secret
- `DATABASE_URL` - PostgreSQL connection URL

## Future Phases

- **Phase 2**: Browser Extension (Chrome/Firefox)
- **Phase 3**: Desktop App (Electron)
- **Phase 4**: Mobile App (React Native)
- **Phase 5**: Advanced features and real AI integration

## BlockStop Neo

After Phase 1-5 completion, BlockStop Neo will introduce advanced threat intelligence, collaborative security, and enterprise features.

## License

ISC

## Support

For issues, questions, or suggestions, please create a GitHub issue.
