# IBlock - BlockStop iOS App

Production-ready native iOS/iPadOS application for threat detection and file scanning.

## Specifications

- **Target:** iOS 14.0+
- **Architecture:** MVVM + Combine
- **Framework:** SwiftUI
- **Bundle ID:** com.blockstop.iblock
- **Phase:** 26.1

## Supported Tiers

| Tier | iPhone | iPad | Features |
|------|--------|------|----------|
| FREE | ❌ | ❌ | Web only |
| NEO | ❌ | ❌ | Web only |
| PRO | ✅ | ❌ | Email, File scan, Dashboard |
| OFFICE | ✅ | ✅ | All PRO + Team features |
| HEALTH | ✅ | ✅ | All PRO + Health compliance |
| MAX | ✅ | ✅ | All features + BetterBot AI |

## Core Features

### FREE/NEO Tier
- None (web only)

### PRO Tier (iPhone)
- Email analysis using DRAR AI
- File scanning using BetterBot PRO
- Quick scan from Photos/Files
- Notification alerts
- Basic threat dashboard
- Scan history (local cache)

### OFFICE/HEALTH Tiers (iPhone + iPad)
- All PRO features
- iPad-optimized split-view interface
- Team collaboration
- Integration management
- Advanced analytics

### MAX Tier (All Devices)
- All OFFICE/HEALTH features
- BetterBot AI chat
- Premium animations
- Advanced offline capability
- Cross-device sync with CloudKit

## Project Structure

```
IBlock/
├── App/
│   ├── IBlockApp.swift              # Entry point
│   └── AppDelegate.swift
├── Scenes/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   ├── BiometricAuthView.swift
│   │   └── AuthViewModel.swift
│   ├── Main/
│   │   └── MainTabView.swift
│   ├── Email/
│   │   ├── EmailCheckerView.swift
│   │   ├── EmailResultView.swift
│   │   └── EmailViewModel.swift
│   ├── Files/
│   │   ├── FileScannerView.swift
│   │   ├── FileScanResultView.swift
│   │   └── FileViewModel.swift
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── ThreatDetailsView.swift
│   │   └── DashboardViewModel.swift
│   ├── BetterBot/
│   │   ├── ChatView.swift
│   │   ├── ChatViewModel.swift
│   │   └── MessageView.swift
│   └── Settings/
│       ├── SettingsView.swift
│       ├── AccountView.swift
│       └── SettingsViewModel.swift
├── Components/
│   ├── ThreatCard.swift
│   ├── QuickScanButton.swift
│   ├── NotificationBanner.swift
│   ├── ResultCard.swift
│   ├── StatusBadge.swift
│   ├── LoadingView.swift
│   └── ErrorView.swift
├── Models/
│   ├── User.swift
│   ├── Threat.swift
│   ├── ScanResult.swift
│   ├── ChatMessage.swift
│   └── AppSettings.swift
├── Services/
│   ├── APIService.swift
│   ├── AuthService.swift
│   ├── LocalStorageService.swift
│   ├── KeychainService.swift
│   ├── CloudSyncService.swift
│   ├── NotificationService.swift
│   └── LoggerService.swift
├── Utilities/
│   ├── Constants.swift
│   ├── Extensions.swift
│   ├── Validators.swift
│   └── Formatters.swift
├── Resources/
│   ├── Assets.xcassets
│   ├── Localizable.strings
│   └── Colors.swift
└── SupportingFiles/
    ├── Info.plist
    └── iBlockConfiguration.plist
```

## Architecture Details

### MVVM Pattern
- **View:** SwiftUI views for UI
- **ViewModel:** @StateObject for logic, Combine publishers
- **Model:** Plain Swift structs with Codable

### State Management
- `@StateObject` for ViewModel lifecycle
- `@EnvironmentObject` for global app state
- `@ObservedObject` for child view models
- Combine `@Published` properties for reactivity

### Dependency Injection
- Environment objects for services
- Manual initialization in App entry point
- Testable without mocking frameworks

## Authentication

1. **OAuth 2.0 Flow**
   - Redirect to BlockStop web OAuth endpoint
   - Receive and store JWT token in Keychain
   - Refresh token automatically

2. **Biometric Authentication**
   - Face ID / Touch ID support
   - Fallback to passcode
   - Local toggle in Settings

3. **Session Management**
   - Automatic token refresh
   - Session timeout (15 minutes)
   - Auto-logout on token expiry

## Data Persistence

### CoreData
- Used for: Scan history, cached threat data
- Local-only (no sync to other devices)
- Automatic cleanup of old data (>30 days)

### CloudKit (MAX Tier Only)
- Used for: BetterBot conversations, custom rules, threat feeds
- Private database per user
- Automatic sync when online

### Keychain
- Used for: JWT tokens, OAuth refresh tokens
- Encrypted at device level
- Secure deletion on logout

## Feature Gating

Feature availability determined by:
1. User tier (from API)
2. Device type (iPhone vs iPad)
3. iOS version (some features require iOS 15+)

```swift
if user.tier.hasBetterBot {
    ChatView()
} else {
    LockedFeatureView()
}
```

## Error Handling

All errors follow a unified pattern:
- Custom `AppError` enum
- Meaningful user messages
- Automatic retry for network failures
- Detailed logging for debugging

## Logging

Structured logging using unified format:
```
[TIMESTAMP] [LEVEL] [MODULE] Message
2024-01-15 14:23:45 [INFO] [AuthService] User logged in successfully
```

## Dependencies

### Swift Package Manager
- Alamofire (networking)
- KeychainAccess (secure storage)
- CloudKit (MAX tier sync)
- Combine (reactive programming)

### System Frameworks
- SwiftUI
- Combine
- CoreData
- CloudKit
- LocalAuthentication (biometrics)
- UserNotifications
- PhotosUI
- DocumentPickerUI

## Build Configuration

### Schemes
- Debug (local development)
- Release (app store)
- TestFlight (beta testing)

### Certificates
- App ID: com.blockstop.iblock
- Development certificate required
- Distribution certificate for App Store
- Provisioning profiles managed via Xcode

## Testing Strategy

- Unit tests for ViewModels and Services
- UI tests for critical user flows
- Integration tests for API communication
- Manual testing on physical devices

## Security Considerations

1. **Network Security**
   - HTTPS only (no cleartext)
   - Certificate pinning for API
   - Timeout: 30 seconds

2. **Data Security**
   - All sensitive data in Keychain
   - CoreData encryption
   - No logs containing sensitive data

3. **Authentication Security**
   - Biometric prompt every time
   - OAuth state validation
   - PKCE flow for redirect

## Performance Targets

- Launch time: <2 seconds
- Email scan: <5 seconds
- File scan: depends on file size
- Dashboard load: <1 second
- Memory: <100MB average

## Future Enhancements

- Phase 26.5: Share extension, URL schemes, Siri shortcuts
- Phase 26.6: App Store distribution, auto-updates
- Phase 27: Safari extension, Mail app integration

## Building & Running

```bash
# Open in Xcode
open IBlock.xcodeproj

# Build for simulator
xcodebuild -scheme IBlock -destination 'platform=iOS Simulator,name=iPhone 15'

# Build for device
xcodebuild -scheme IBlock -destination generic/platform=iOS
```

## Release Process

1. Update version in Info.plist
2. Create changelog entry
3. Build Release scheme
4. Generate .ipa file
5. Sign with distribution certificate
6. Upload to TestFlight / App Store

---

Phase 26 Implementation - Complete iOS Native App
