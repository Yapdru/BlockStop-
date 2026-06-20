# Phase 26: Native App Distribution - Complete Specification

## 🎯 Overview

Phase 26 transforms BlockStop from a web-only application into a **multi-platform native experience** with dedicated iOS and macOS applications while maintaining seamless synchronization with the web platform.

**Core Philosophy:** One unified BlockStop experience across iPhone, iPad, Mac, and Web with tier-based feature access.

---

## 📱 Phase 26.1: iOS App Distribution (IBlock)

### App Name & Branding
- **App Name:** IBlock (BlockStop for iOS)
- **Bundle ID:** `com.blockstop.iblock`
- **Distribution Format:** .ipa file
- **Installation Method:** Feather, AltStore, Xcode, or direct .ipa installation

### Platform Support
```
Device Support by Tier:
┌─────────┬────────────┬────────────┬──────────────┐
│ Tier    │ iPhone     │ iPad       │ Status       │
├─────────┼────────────┼────────────┼──────────────┤
│ FREE    │ ❌ No app  │ ❌ No app  │ Web only     │
│ NEO     │ ❌ No app  │ ❌ No app  │ Web only     │
│ PRO     │ ✅ Yes     │ ❌ No      │ iPhone only  │
│ OFFICE  │ ✅ Yes     │ ✅ Yes     │ Optimized    │
│ HEALTH  │ ✅ Yes     │ ✅ Yes     │ Optimized    │
│ MAX     │ ✅ Yes     │ ✅ Yes     │ Full + Extra │
└─────────┴────────────┴────────────┴──────────────┘
```

### Core Features

**PRO Tier (iPhone Only)**
- Email analysis (DRAR AI)
- File scanning (BetterBot PRO)
- Quick scan from Photos/Files
- Notification alerts
- Basic threat dashboard
- Scan history (local cache)

**OFFICE/HEALTH Tiers (iPhone + iPad)**
- All PRO features
- iPad-optimized interface
  - Split-view multitasking
  - Larger sidebar navigation
  - Expanded detail views
- Team collaboration
- Integration management
- Advanced analytics

**MAX Tier (All Devices + Animations)**
- All OFFICE/HEALTH features
- BetterBot AI chat
  - Natural language threat queries
  - Custom rule suggestions
  - Smart auto-add feature (₹5 per feature)
- Premium animations
  - Slide-in notifications
  - Smooth threat expansion
  - Custom transitions
- Advanced offline capability
- Cross-device sync with CloudKit

### UI/UX Architecture

**Shared Components** (from Phase 25)
- Button, Card, Input, Badge components
- Theme system (light blue primary, yellow accent)
- Animation library

**iOS-Specific Components**
- Bottom tab bar (Email, Scan, Analyze, BetterBot, Settings)
- Swipe gestures (back, dismiss)
- Haptic feedback on threat detection
- Share sheet integration

**iPad-Specific Layout**
- Sidebar navigation (always visible)
- Master-detail split view
- Full-width cards and panels
- Floating panels for modals

### Technical Stack

**Framework:** SwiftUI (iOS 14+)
**Architecture:** MVVM with Combine
**State Management:** @StateObject, @EnvironmentObject
**Data Persistence:** CoreData + CloudKit (MAX tier)
**Networking:** URLSession + async/await
**Authentication:** OAuth 2.0 (shared with web)

### File Structure
```
IBlock/
├── IBlockApp.swift              # App entry point
├── Features/
│   ├── Email/
│   │   ├── EmailCheckerView.swift
│   │   ├── EmailResultView.swift
│   │   └── EmailViewModel.swift
│   ├── FileScanning/
│   │   ├── FileScannerView.swift
│   │   └── FileViewModel.swift
│   ├── BetterBot/
│   │   ├── ChatView.swift (MAX only)
│   │   └── ChatViewModel.swift
│   └── Settings/
│       ├── SettingsView.swift
│       └── AccountView.swift
├── Components/
│   ├── ThreatCard.swift
│   ├── QuickScanButton.swift
│   └── NotificationBanner.swift
├── Models/
│   ├── Threat.swift
│   ├── ScanResult.swift
│   └── User.swift
├── Services/
│   ├── APIService.swift
│   ├── AuthService.swift
│   └── CloudSyncService.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizable.strings
```

---

## 🖥️ Phase 26.2: macOS App Distribution (MACBlock)

### App Name & Branding
- **App Name:** MACBlock (BlockStop for macOS)
- **Bundle ID:** `com.blockstop.macblock`
- **Distribution Format:** .app (universal binary - Intel + Apple Silicon)
- **Minimum macOS:** 11.0+

### Platform Support
```
macOS Support by Tier:
┌─────────┬──────────────────────────────────────┐
│ Tier    │ Features                             │
├─────────┼──────────────────────────────────────┤
│ FREE    │ ❌ No app (very limited badge only) │
│ NEO     │ ✅ Basic menu bar + limited features│
│ PRO     │ ✅ Full menu bar + all features     │
│ OFFICE  │ ✅ Full + professional integrations │
│ HEALTH  │ ✅ Full + health compliance features│
│ MAX     │ ✅ Full + advanced animations       │
└─────────┴──────────────────────────────────────┘
```

### Core Features

**Menu Bar Experience**
```
┌─ BlockStop ─┐
│    🛡️       │  ← Shield icon in menu bar
│   Quick     │
│   Review    │  ← Shows quick summary
├─────────────┤
│ 3 threats   │
│ 0 critical  │
│             │
│ ┌─────────┐ │
│ │  Full   │ │  ← Opens full app
│ └─────────┘ │
└─────────────┘
```

**Full App Window (Mac-Optimized)**
- Toolbar with quick-access buttons
- Sidebar navigation (persistent)
- Full threat dashboard
- Email/File analysis interface
- Settings panel
- All integrations (Slack, Teams, etc.)

**Features by Tier**

NEO Tier (Basic Menu Bar)
- Shield menu bar icon
- Quick threat count display
- Open app button
- Basic notification badge (degraded appearance)

PRO/OFFICE/HEALTH Tiers (Full Menu Bar + App)
- All NEO features
- Full app window with all analysis tools
- Right-click file context menu option
- Email scanning interface
- Notification center integration
- Keyboard shortcuts (Cmd+Shift+U for quick scan)

MAX Tier (Premium Everything)
- All PRO features
- Advanced animations throughout
- BetterBot AI chat with voice input
- Custom threat intelligence
- Premium notification designs
- Safari extension for web browsing protection

### UI/UX Architecture

**Menu Bar Design**
- Compact shield icon (16x16pt)
- Dropdown menu with stats
- "Full" button to launch main window
- Settings quick access

**Main App Window**
- Menu bar (File, Edit, Security, Help)
- Toolbar (Back, Quick Scan, Settings)
- Three-pane layout:
  1. Sidebar (Email, Files, BetterBot, History)
  2. Main content (analysis/results)
  3. Detail panel (threat breakdown)
- Status bar at bottom (sync status, threat level)

**Mac-Specific Interactions**
- Right-click file → "Scan with BlockStop"
- Drag-drop files to window
- Cmd+Shift+U → Quick scan dialog
- Cmd+N → New analysis
- Cmd+S → Save results

### Technical Stack

**Framework:** SwiftUI + AppKit (for menu bar)
**Architecture:** MVVM with Combine
**Menu Bar:** NSStatusBar + NSMenu
**File System:** FileManager + UTType
**Notifications:** NSUserNotificationCenter + UserNotifications
**Preferences:** UserDefaults + NSPersistentContainer

### File Structure
```
MACBlock/
├── MACBlockApp.swift            # App entry point
├── MenuBar/
│   ├── StatusItemManager.swift
│   ├── MenuBarView.swift
│   └── QuickReviewPanel.swift
├── MainWindow/
│   ├── MainWindowController.swift
│   ├── ContentView.swift
│   └── Toolbar.swift
├── Features/
│   ├── Email/
│   │   ├── EmailCheckerView.swift
│   │   └── EmailViewModel.swift
│   ├── FileScanning/
│   │   ├── FileScannerView.swift
│   │   └── FileViewModel.swift
│   ├── QuickActions/
│   │   ├── ContextMenu.swift
│   │   └── QuickScanDialog.swift
│   └── Settings/
│       └── PreferencesWindow.swift
├── Components/
│   ├── ThreatCard.swift
│   ├── StatusBar.swift
│   └── NotificationBanner.swift
├── Services/
│   ├── APIService.swift
│   ├── FileWatcher.swift
│   └── MenuBarService.swift
└── Resources/
    ├── Assets.xcassets
    ├── Localizable.strings
    └── Icons/
        └── MenuBarIcon.pdf
```

---

## ⚠️ CLARIFICATION QUESTIONS - PHASES 26.3 to 26.6

### Phase 26.3: Cloud Sync & Cross-Device Synchronization

**Question 1: Real-Time Sync Strategy**
- Should iOS/macOS apps sync scan history with web app in real-time?
- **Options:**
  - A) Real-time sync (every action pushes to cloud immediately)
  - B) Periodic sync (batch sync every 5 minutes)
  - C) Manual sync (user-initiated button)
  - D) Hybrid (automatic sync when device connected to WiFi)

**Question 2: Unified Account Experience**
- For PRO users (Mac only): Should the Mac app share the same account/subscription as their web account?
- **Options:**
  - A) Yes, one OAuth login shared everywhere
  - B) Separate credentials for native apps
  - C) Linked accounts (same email, separate passwords)

**Question 3: MAX Tier Multi-Device Sync**
- For MAX users (all devices): How should we sync custom rules, threat feeds, and BetterBot conversations?
- **Options:**
  - A) CloudKit (Apple's proprietary sync)
  - B) Custom backend server
  - C) Both (user choice)
  - D) WebSockets for real-time sync

**Question 4: Offline Mode**
- How many scans should native apps store locally?
- **Options:**
  - A) Last 50 scans
  - B) Last 100 scans
  - C) All scans (unlimited storage)
  - D) Configurable per user

---

### Phase 26.4: Advanced macOS Features

**Question 1: Context Menu Integration**
- Should users right-click on files → "Scan with BlockStop"?
- **Options:**
  - A) Yes, for all users
  - B) Yes, but only for PRO+ tiers
  - C) No, security risk
  - D) Optional toggle in settings

**Question 2: Safari Extension**
- Should MACBlock offer a Safari extension for scanning links before visiting?
- **Options:**
  - A) Yes, for all users
  - B) Yes, but only MAX tier
  - C) No, too complex
  - D) Phase 27 feature

**Question 3: Mail App Integration**
- Should MACBlock integrate with Apple Mail for automatic scanning?
- **Options:**
  - A) Yes, scan all incoming emails
  - B) Yes, but with user approval per email
  - C) No, privacy concerns
  - D) Only for OFFICE/HEALTH tiers

**Question 4: Accessibility**
- Should we support VoiceOver (macOS screen reader)?
- **Options:**
  - A) Yes, full WCAG 2.1 AAA compliance
  - B) Yes, basic support
  - C) No, out of scope
  - D) Phase 26.5 feature

---

### Phase 26.5: iOS Advanced Features

**Question 1: URL Schemes & Deep Linking**
- Should IBlock support `blockstop://scan?file=...` for deep linking from Safari?
- **Options:**
  - A) Yes, full URI scheme support
  - B) Yes, limited to open app only
  - C) No, security risk
  - D) Only for MAX tier

**Question 2: Share Extension**
- Should users be able to scan files directly from Files app share menu?
- **Options:**
  - A) Yes, for all users
  - B) Yes, but limited to PRO+
  - C) No, too complex
  - D) Phase 26.6 feature

**Question 3: Siri Shortcuts**
- Should Siri support "Scan file with BlockStop"?
- **Options:**
  - A) Yes, full automation support
  - B) Yes, basic commands only
  - C) No, not planned
  - D) Only for MAX tier

**Question 4: Background Scanning**
- Should IBlock run periodic scans in the background?
- **Options:**
  - A) Yes, every hour (battery intensive)
  - B) Yes, every 4 hours
  - C) Yes, only when charging
  - D) No, manual scans only
  - E) User-configurable

---

### Phase 26.6: Distribution & Update Strategy

**Question 1: App Store vs Side-Loading**
- Distribution strategy for IBlock and MACBlock:
- **Options:**
  - A) App Store only (safest, reaches most users)
  - B) Side-loading only (more control, less reach)
  - C) Both (App Store + direct .ipa/.app downloads)
  - D) Staggered rollout (TestFlight → App Store)

**Question 2: Auto-Update Mechanism**
- How should native apps stay updated?
- **Options:**
  - A) In-app update checker (manual user approval)
  - B) OS-level auto-update (iOS/macOS background)
  - C) Both (offer both options)
  - D) Require update on launch if outdated

**Question 3: Beta Testing**
- Should we have a beta testing program?
- **Options:**
  - A) iOS TestFlight + macOS separate beta builds
  - B) iOS TestFlight only
  - C) No beta, release when ready
  - D) Private beta (GitHub releases only)

**Question 4: License Verification**
- How should native apps verify tier/subscription status?
- **Options:**
  - A) API token exchange (user logs in, gets JWT)
  - B) OAuth flow (use existing web credentials)
  - C) In-app purchase verification
  - D) Local cached token (verify online when possible)

---

## 📊 Phase 26 Timeline Estimate

| Task | Effort | Notes |
|------|--------|-------|
| Phase 26.1: iOS App (PRO) | 80 hours | Single iPhone target |
| Phase 26.1: iPad Support (MAX) | 40 hours | iPad optimization |
| Phase 26.2: macOS Menu Bar | 60 hours | Menu bar + main window |
| Phase 26.3: Cloud Sync | 40 hours | Depends on answers |
| Phase 26.4: macOS Extensions | 50 hours | Context menu, Safari |
| Phase 26.5: iOS Extensions | 40 hours | Shortcuts, Share ext |
| Phase 26.6: Distribution | 30 hours | App Store, certificates |
| **Total** | **280-320 hours** | **~7-8 weeks full-time** |

---

## 🎯 Success Criteria for Phase 26

✅ **Phase 26.1 Complete When:**
- IBlock runs on iPhone (all tiers that support it)
- All DRAR AI and BetterBot PRO features work
- Scan history persists locally
- Notifications work

✅ **Phase 26.2 Complete When:**
- MACBlock menu bar icon appears
- Quick review dropdown works
- Full app window launches seamlessly
- File context menu option works

✅ **Phase 26.3 Complete When:**
- Data syncs between native and web apps
- Offline mode works
- Tier verification works across platforms

✅ **Phase 26.4-26.6 Complete When:**
- All clarification questions answered
- Architecture documented
- Release plan finalized
- Beta testing prepared

---

## 🚀 Next Steps

1. **Answer the 12 clarification questions above** (Sections 26.3-26.6)
2. Based on answers, create detailed technical specifications for each phase
3. Set up native development environment:
   - Xcode project for iOS (Swift Package Manager)
   - Xcode project for macOS (Swift Package Manager)
   - Shared code via Swift Package
4. Create CI/CD pipeline for native apps
5. Set up App Store Connect accounts (if needed)

---

**Phase 26 Status:** ⏳ Awaiting clarification responses
**Branch:** claude/epic-gates-76aa17
**Ready for:** Architecture decisions based on Q&A responses
