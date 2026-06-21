# IBlock iOS App - Implementation Guide

## Overview

IBlock is a production-ready native iOS/iPadOS application for threat detection and security analysis. Built with SwiftUI and Combine, it provides a seamless experience for users across different subscription tiers.

## Architecture

### MVVM + Combine Pattern

```
View (SwiftUI) <-> ViewModel (@StateObject) <-> Model (Codable structs)
                          |
                    Observable Objects
                          |
                    Services & Repositories
```

### Service Layer

- **AuthService**: OAuth 2.0, session management, token refresh
- **APIService**: RESTful API communication with retry logic
- **TierGatingService**: Feature access control based on subscription
- **BiometricAuthService**: Face ID / Touch ID authentication
- **NotificationService**: Local & push notifications with haptic feedback
- **CacheService**: Local data persistence and caching

## Project Structure

```
IBlock/
├── App/
│   ├── IBlockApp.swift                 # Entry point
│   └── AppDelegate.swift               # App lifecycle
│
├── Scenes/                             # Feature screens
│   ├── Auth/
│   │   └── AuthContainerView.swift     # Login/Signup/OAuth
│   ├── Main/
│   │   └── MainTabView.swift           # Tab navigation
│   ├── Email/
│   ├── Files/
│   ├── Dashboard/
│   ├── BetterBot/
│   └── Settings/
│
├── Core/
│   ├── Models/
│   │   ├── AppError.swift             # Error types
│   │   └── DataModels.swift           # All data structures
│   ├── Services/
│   │   ├── AuthService.swift          # OAuth, session
│   │   ├── APIService.swift           # API communication
│   │   ├── TierGatingService.swift    # Feature access
│   │   ├── BiometricAuthService.swift # Face/Touch ID
│   │   ├── NotificationService.swift  # Push notifications
│   │   └── CacheService.swift         # Local cache
│   └── Utilities/
│       ├── Constants.swift
│       ├── Extensions.swift
│       └── Validators.swift
│
├── Components/                         # Reusable UI
│   ├── ThreatCard.swift
│   ├── QuickScanButton.swift
│   ├── ResultCard.swift
│   └── StatusBadge.swift
│
├── Data/
│   ├── Persistence/
│   │   ├── CoreDataStack.swift
│   │   ├── Models/
│   │   └── Repositories/
│   └── CloudKit/
│       └── CloudSyncService.swift
│
├── Resources/
│   ├── Assets.xcassets
│   ├── Localizable.strings
│   └── Colors.swift
│
├── Supporting Files/
│   ├── Info.plist
│   ├── Entitlements.plist
│   └── iBlockConfiguration.plist
│
└── Configuration/
    └── BuildConfiguration.swift
```

## Authentication Flow

### 1. App Launch
1. Check for existing token in Keychain
2. If token exists and not expired, load user info
3. If token expired, attempt refresh
4. If no token, show login view

### 2. OAuth 2.0 Login
1. User taps "Google" or "GitHub" button
2. `AuthService.initiateOAuth(provider:)` generates state token for CSRF protection
3. Opens secure browser session with OAuth provider
4. User logs in at provider
5. App intercepts callback: `blockstop://oauth-callback?code=...&state=...`
6. Exchange auth code for tokens via `handleOAuthCallback(code:)`
7. Store tokens securely in Keychain
8. Fetch and cache user info
9. Transition to main tab view

### 3. Biometric Setup (Optional)
1. After OAuth login, prompt to enable Face ID/Touch ID
2. `BiometricAuthService.setupBiometric()` handles authentication
3. Store preference in UserDefaults
4. User is re-authenticated on app relaunch

### 4. Session Management
1. Token refresh timer runs in background
2. Refreshes token 5 minutes before expiration
3. On app foreground, validate session is still active
4. If token invalid, clear session and return to login

## Feature Gating

### Tier-Based Access Control

```swift
// Check feature availability
if tierGatingService.canAccessFeature("emailAnalysis") {
    EmailCheckerView()
} else {
    LockedFeatureView()
}

// Check device support
if tierGatingService.canAccessOnDevice() {
    ContentView()
} else {
    UnsupportedDeviceView()
}

// Require minimum tier
try tierGatingService.requireMinimumTier(.pro)
```

### Tier Matrix

| Feature | FREE | NEO | PRO | OFFICE | HEALTH | MAX |
|---------|------|-----|-----|--------|--------|-----|
| Email Analysis | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| File Scanning | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Team Collab | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| BetterBot | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| iPhone Support | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| iPad Support | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

## Data Persistence

### Keychain (Tokens)
- Access token
- Refresh token
- Token expiration date
- Biometric preference

### UserDefaults (Preferences)
- Notifications enabled
- Biometric enabled
- Theme selection
- Cached tier info

### CoreData (Local Cache)
- Threat entities
- Scan result entities
- Offline queue items

### CloudKit (MAX Tier Only)
- BetterBot conversation history
- Custom threat rules
- Cross-device sync

## API Integration

### Base Configuration
- **Base URL**: `https://api.blockstop.app`
- **API Version**: `v1`
- **Timeout**: 30 seconds
- **Retry Policy**: 3 attempts with exponential backoff

### Key Endpoints

```
Authentication:
  POST   /v1/oauth/authorize
  POST   /v1/oauth/token
  POST   /v1/oauth/refresh
  POST   /v1/oauth/logout

Scanning:
  POST   /v1/scans/email
  POST   /v1/scans/file
  GET    /v1/scans/email/history
  GET    /v1/scans/file/history

User:
  GET    /v1/user/info
  GET    /v1/user/tier
  PUT    /v1/user/settings

Threats:
  GET    /v1/threats
  GET    /v1/threats/{id}
  POST   /v1/threats/{id}/block

Dashboard:
  GET    /v1/dashboard/stats
  GET    /v1/analytics

BetterBot:
  POST   /v1/betterbot/chat
  GET    /v1/betterbot/history
  DELETE /v1/betterbot/history
```

## Error Handling

### Error Hierarchy

```
AppError (enum)
├── Authentication (authenticationFailed, sessionExpired, etc.)
├── Network (networkUnavailable, networkTimeout, etc.)
├── Data (decodingError, invalidData, etc.)
├── Tier/Features (insufficientTier, tierGatingBlocked, etc.)
├── Files (fileNotFound, fileTooLarge, etc.)
└── Storage (keychainError, coreDataError, etc.)
```

### Retry Logic

Network errors are automatically retried with exponential backoff:
- Connection errors: 2 second delay
- Timeout: 5 second delay
- 429 (Rate limited): 60 second delay
- 5xx Server errors: 5 second delay

## Notifications

### Local Notifications
- **Threat Detected**: Immediate notification with threat severity
- **Scan Complete**: Notification when scan finishes
- **Silent Updates**: Background updates without user notification

### Haptic Feedback
- Critical threats: Strong double vibration
- High threats: Medium vibration
- Medium threats: Light vibration
- Low threats: Subtle success feedback

### Notification Actions
- Block threat (authentication required)
- View threat details
- Review scan results

## Build & Release

### Xcode Configuration
- Target: iOS 14.0+
- Swift: 5.9+
- Deployment: iPhone/iPad
- Signing: Automatic (Xcode managed)

### Build Schemes
- **Debug**: Local development, verbose logging
- **Release**: App Store build, optimizations enabled
- **TestFlight**: Beta testing, crash reporting

### Info.plist Entries
```xml
<key>NSCameraUsageDescription</key>
<string>Required for document scanning</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Required for file selection</string>

<key>NSFaceIDUsageDescription</key>
<string>Biometric authentication for security</string>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>blockstop</string>
    </array>
  </dict>
</array>
```

## Testing Strategy

### Unit Tests
- Model serialization/deserialization
- Service logic (tier gating, validation)
- Error mapping

### Integration Tests
- OAuth flow with mock server
- API request/response handling
- Token refresh logic

### UI Tests
- Navigation between tabs
- Feature gating enforcement
- Login/logout flows

### Manual Testing
- Physical device testing (iPhone/iPad)
- Biometric authentication
- Network error scenarios
- Tier upgrade flows

## Performance Optimization

### Targets
- App launch: < 2 seconds
- Email scan: < 5 seconds
- File scan: size dependent
- Dashboard load: < 1 second
- Memory: < 100MB average

### Strategies
- Lazy loading for lists
- Image caching (Kingfisher)
- Database query optimization
- Network request batching

## Security Considerations

### Network Security
- HTTPS only (no cleartext)
- Certificate pinning (optional)
- Timeout on all requests

### Data Security
- Sensitive data in Keychain (Secure Enclave)
- CoreData encryption
- No sensitive logs
- Secure deletion on logout

### Authentication Security
- OAuth 2.0 with PKCE
- State token for CSRF protection
- Biometric on every access
- Automatic logout on session expiry

## Deployment Checklist

### Pre-Release
- [ ] Update version in Info.plist
- [ ] Create changelog
- [ ] Run full test suite
- [ ] Performance profile
- [ ] Security audit

### Release
- [ ] Build Release scheme
- [ ] Generate .ipa file
- [ ] Sign with distribution certificate
- [ ] Upload to TestFlight
- [ ] Run automated tests
- [ ] Manual testing on physical devices

### Post-Release
- [ ] Monitor crash logs
- [ ] Track performance metrics
- [ ] Gather user feedback
- [ ] Plan next release

## Future Enhancements

### Phase 26.5: iOS Extensions
- Share extension for Files app
- URL schemes for deep linking
- Siri shortcuts integration

### Phase 26.6: Distribution
- App Store submission
- Auto-update mechanism
- Beta testing program
- License verification

### Phase 27: Advanced Features
- Share extension UI
- iCloud sync optimization
- Advanced offline mode
- Custom threat rules

## Logging

Structured logging is used throughout the app:

```swift
Logger.info("User logged in successfully")
Logger.warning("Biometric verification failed")
Logger.error("API request timeout: \(error)")
Logger.debug("Cached \(threats.count) threats")
```

Logs follow format: `[TIMESTAMP] [LEVEL] [MODULE] Message`

## Configuration Management

### Runtime Configuration
All configuration should be in `iBlockConfiguration.plist`:
```xml
<dict>
  <key>API_BASE_URL</key>
  <string>https://api.blockstop.app</string>
  
  <key>OAUTH_CLIENT_ID</key>
  <string>blockstop_ios_client</string>
  
  <key>MAX_CACHE_SIZE</key>
  <integer>100</integer>
  
  <key>TOKEN_REFRESH_BUFFER_MINUTES</key>
  <integer>5</integer>
</dict>
```

## Support

For issues or questions:
1. Check logs in Xcode console
2. Review architecture documentation
3. Consult API endpoint specs
4. Open issue in repository

---

**Version**: 1.0
**Last Updated**: June 2024
**Status**: Production Ready
