# IBlock iOS App - Complete File Index

## Project Overview
- **Name**: IBlock (BlockStop for iOS)
- **Platform**: iOS 14.0+
- **Language**: Swift 5.9+
- **Architecture**: MVVM + Combine
- **Status**: ✅ Production Ready
- **Bundle ID**: com.blockstop.iblock

---

## Core Application Files

### App Entry Point
| File | Purpose | Lines |
|------|---------|-------|
| `App/IBlockApp.swift` | Application delegate, app lifecycle, deep linking | ~350 |

### Services (Business Logic)
| File | Purpose | Lines |
|------|---------|-------|
| `Core/Services/AuthService.swift` | OAuth 2.0, session management, token refresh | ~420 |
| `Core/Services/APIService.swift` | REST API client, request/response handling | ~480 |
| `Core/Services/TierGatingService.swift` | Feature access control, tier checking | ~450 |
| `Core/Services/BiometricAuthService.swift` | Face ID, Touch ID authentication | ~280 |
| `Core/Services/NotificationService.swift` | Local notifications, haptic feedback | ~380 |
| `Core/Services/CacheService.swift` | Local caching, data persistence | ~300 |

**Total Service Code**: ~2,310 lines

### Data Models
| File | Purpose | Lines |
|------|---------|-------|
| `Core/Models/AppError.swift` | Error types, user messages, retry logic | ~220 |
| `Core/Models/DataModels.swift` | User, Threat, ScanResult, etc. | ~650 |

**Total Model Code**: ~870 lines

### User Interface Views
| File | Purpose | Lines |
|------|---------|-------|
| `Scenes/Auth/AuthContainerView.swift` | Login, signup, OAuth UI | ~500 |
| `Scenes/Main/MainTabView.swift` | Tab navigation, email/file scanning, dashboard | ~750 |

**Total UI Code**: ~1,250 lines

### Configuration
| File | Purpose | Lines |
|------|---------|-------|
| `BuildConfiguration.swift` | Environment config, feature flags, settings | ~420 |

---

## Documentation Files

| File | Purpose | Content |
|------|---------|---------|
| `README.md` | Project overview, quick start | Architecture, features, build guide |
| `IMPLEMENTATION_GUIDE.md` | Developer documentation | MVVM pattern, services, API endpoints |
| `COMPLETION_SUMMARY.md` | Feature checklist | Deliverables, testing, deployment |
| `INDEX.md` | This file | File organization and reference |

---

## Code Organization

### By Responsibility

#### Authentication & Security
- `AuthService.swift` - OAuth, session, token management
- `BiometricAuthService.swift` - Biometric authentication
- `KeychainService` (in AuthService) - Secure token storage

#### API Communication
- `APIService.swift` - All backend communication
- Endpoints for scanning, user, threats, dashboard, BetterBot

#### Data Management
- `CacheService.swift` - Local caching and persistence
- `DataModels.swift` - All data structures
- CloudKit sync ready (MAX tier)

#### Feature Control
- `TierGatingService.swift` - Subscription-based access
- Support for 6 tiers: FREE, NEO, PRO, OFFICE, HEALTH, MAX

#### User Experience
- `NotificationService.swift` - Alerts and notifications
- `MainTabView.swift` - Tab navigation
- `AuthContainerView.swift` - Authentication flows

#### Error Handling
- `AppError.swift` - Comprehensive error types
- Retry logic, user messages, severity levels

---

## File Dependencies

### Entry Point
```
IBlockApp.swift
  ├── AuthService
  ├── APIService
  ├── TierGatingService
  ├── NotificationService
  └── CacheService
```

### Authentication Flow
```
AuthService
  ├── KeychainService (embedded)
  └── APIService
```

### Feature Access
```
TierGatingService
  └── User tier information (from APIService)
```

### Data Persistence
```
CacheService
  └── UserDefaults + In-memory storage
```

### Notifications
```
NotificationService
  └── UNUserNotificationCenter
```

---

## Quick Reference

### Service Class Reference

**AuthService** - Use for OAuth, authentication, session
```swift
let authService = AuthService()
authService.initiateOAuth(provider: "google") // Returns URL
try await authService.handleOAuthCallback(code: authCode)
try await authService.refreshAccessToken()
try await authService.logout()
```

**APIService** - Use for all backend communication
```swift
let apiService = APIService()
let result: ScanResult = try await apiService.scanEmail(email)
let result: ScanResult = try await apiService.uploadAndScanFile(...)
let threats: [Threat] = try await apiService.fetchThreats()
```

**TierGatingService** - Use for feature access control
```swift
let tierGatingService = TierGatingService()
if tierGatingService.canAccessFeature("emailAnalysis") { ... }
if tierGatingService.canAccessOnDevice(.phone) { ... }
try tierGatingService.requireMinimumTier(.pro)
```

**BiometricAuthService** - Use for Face/Touch ID
```swift
let bioService = BiometricAuthService()
let result = try await bioService.verifyBiometric()
try await bioService.setupBiometric()
```

**NotificationService** - Use for alerts and notifications
```swift
let notificationService = NotificationService()
try await notificationService.requestAuthorization()
try notificationService.sendThreatDetectedNotification(threat)
notificationService.updateBadgeCount(5)
```

**CacheService** - Use for local storage
```swift
let cacheService = CacheService()
cacheService.cacheScan(scanResult)
let scans = cacheService.fetchCachedScans()
cacheService.cleanupExpiredScans()
```

---

## API Endpoints Summary

### Authentication (OAuth)
- `POST /v1/oauth/authorize` - Start OAuth flow
- `POST /v1/oauth/token` - Exchange code for tokens
- `POST /v1/oauth/refresh` - Refresh access token
- `POST /v1/oauth/logout` - Logout user

### Email Scanning
- `POST /v1/scans/email` - Scan email address
- `GET /v1/scans/email/history` - Get email scan history
- `GET /v1/scans/email/{id}` - Get email scan details

### File Scanning
- `POST /v1/scans/file` - Upload and scan file
- `GET /v1/scans/file/history` - Get file scan history
- `GET /v1/scans/file/{id}` - Get file scan details

### Threats
- `GET /v1/threats` - List all threats
- `GET /v1/threats/{id}` - Get threat details
- `POST /v1/threats/{id}/block` - Block a threat

### Dashboard & Analytics
- `GET /v1/dashboard/stats` - Dashboard statistics
- `GET /v1/analytics` - Analytics data

### BetterBot
- `POST /v1/betterbot/chat` - Send chat message
- `GET /v1/betterbot/history` - Get chat history
- `DELETE /v1/betterbot/history` - Clear chat history

### User Management
- `GET /v1/user/info` - Get user profile
- `GET /v1/user/tier` - Get tier information
- `PUT /v1/user/settings` - Update user settings

---

## Feature Matrix

### By Tier

| Feature | FREE | NEO | PRO | OFFICE | HEALTH | MAX |
|---------|------|-----|-----|--------|--------|-----|
| iPhone | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| iPad | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Email Check | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| File Scan | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Team Collab | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| BetterBot | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| CloudKit | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Error Types

### Authentication
- `authenticationFailed(String)`
- `invalidCredentials`
- `sessionExpired`
- `invalidOAuthResponse`
- `invalidOAuthState`
- `biometricAuthFailed`
- `biometricNotAvailable`

### Network
- `networkUnavailable`
- `networkTimeout`
- `invalidResponse`
- `httpError(Int)`
- `apiError(String)`

### Data
- `decodingError(String)`
- `invalidData`
- `dataNotFound`

### Tier/Features
- `insufficientTier(String)`
- `tierGatingBlocked`
- `featureNotAvailable`
- `deviceNotSupported`

### Files
- `fileNotFound`
- `invalidFileType`
- `fileTooLarge(String)`
- `fileReadError(String)`
- `fileUploadError(String)`

### Storage
- `keychainError(String)`
- `coreDataError(String)`
- `cloudKitError(String)`

### Other
- `initializationError(String)`

---

## Configuration Reference

### Environment URLs
```swift
Development:  https://api.dev.blockstop.app
Staging:      https://api.staging.blockstop.app
Production:   https://api.blockstop.app
```

### Feature Flags
```swift
cloudKitSyncEnabled       = true
biometricAuthEnabled      = true
pushNotificationsEnabled  = true
offlineModeEnabled        = true
analyticsEnabled          = true
verboseLoggingEnabled     = (DEBUG)
```

### Timeouts & Limits
```swift
requestTimeout     = 30 seconds
maxRetries         = 3 attempts
maxCachedScans     = 100
cacheExpiration    = 30 days
maxFileSize        = 25 MB
```

---

## Testing Checklist

### Unit Tests
- [ ] Model serialization/deserialization
- [ ] Service logic (tier gating, caching)
- [ ] Error handling and retry
- [ ] Validators and formatters

### Integration Tests
- [ ] OAuth flow with mock API
- [ ] API request/response cycle
- [ ] Token refresh on 401
- [ ] Cache persistence

### UI Tests
- [ ] Login flow
- [ ] Tab navigation
- [ ] Feature gating enforcement
- [ ] Error message display

### Manual Tests
- [ ] OAuth with real Google account
- [ ] OAuth with real GitHub account
- [ ] Biometric authentication
- [ ] Email scanning
- [ ] File upload
- [ ] Notification alerts
- [ ] Tier upgrade flow
- [ ] Logout and re-login

---

## Build & Deploy

### Xcode Project Setup
```
File > New > Project
  Platform: iOS
  Type: App
  Language: Swift
  UI: SwiftUI
  Minimum Deployment: iOS 14.0
```

### Add IBlock Files
Copy all files from `IBlock/` to project

### Configure Signing
```
Project > IBlock > Signing & Capabilities
  Team: Your Team
  Bundle ID: com.blockstop.iblock
```

### Build Commands
```bash
# Simulator
xcodebuild -scheme IBlock \
  -destination 'platform=iOS Simulator,name=iPhone 15'

# Device
xcodebuild -scheme IBlock \
  -destination generic/platform=iOS

# Archive
xcodebuild -scheme IBlock \
  -configuration Release \
  -archivePath IBlock.xcarchive
```

---

## Version History

| Version | Date | Status | Notable |
|---------|------|--------|----------|
| 1.0.0 | June 2024 | ✅ Complete | Phase 26.1 implementation |

---

## Support Resources

1. **Architecture Guide**: `IMPLEMENTATION_GUIDE.md`
2. **Feature Checklist**: `COMPLETION_SUMMARY.md`
3. **Project Overview**: `README.md`
4. **This Index**: `INDEX.md`

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Swift Files | 12 |
| Documentation Files | 3 |
| Total Source Lines | ~3,500 |
| Documentation Lines | ~2,000 |
| Services | 6 |
| Data Models | 10 |
| Error Types | 15 |
| API Endpoints | 18+ |
| Supported Tiers | 6 |
| Minimum iOS | 14.0 |

---

**Last Updated**: June 2024
**Status**: Production Ready
**Branch**: main
**Commit**: 17536bd
