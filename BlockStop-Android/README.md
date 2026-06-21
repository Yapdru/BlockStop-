# BlockStop Android

**BlockStop Android** is a native Android application built with Kotlin and Jetpack Compose, providing email scanning, file scanning, threat analysis, and offline capabilities for security threat detection and management.

## Features

- **Email Scanning** - Scan emails for malicious content, phishing, and threats
- **File Scanning** - Analyze files for malware, suspicious content, and security risks
- **Threat Analysis** - Real-time threat intelligence and risk assessment
- **Offline Mode** - Core functionality works without internet connection
- **Push Notifications** - Real-time threat alerts and notifications
- **Tier-based Features** - PRO, NEO, and MAX tier functionality
- **OAuth Authentication** - Secure authentication with BlockStop backend
- **Local Database** - Room database for offline data storage
- **Material Design 3** - Modern Material Design interface

## Technology Stack

- **Language:** Kotlin
- **UI Framework:** Jetpack Compose
- **Architecture:** MVVM + Repository Pattern
- **Database:** Room
- **Networking:** Retrofit + OkHttp
- **Authentication:** OAuth 2.0
- **Notifications:** Firebase Cloud Messaging
- **State Management:** ViewModel + StateFlow

## Project Structure

```
BlockStop-Android/
├── app/                          # Android application module
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/
│   │   │   │   └── com/blockstop/
│   │   │   │       ├── MainActivity.kt
│   │   │   │       ├── ui/
│   │   │   │       │   ├── screens/
│   │   │   │       │   ├── components/
│   │   │   │       │   ├── navigation/
│   │   │   │       │   └── theme/
│   │   │   │       ├── viewmodel/
│   │   │   │       ├── repository/
│   │   │   │       ├── model/
│   │   │   │       └── BlockStopApp.kt
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   ├── drawable/
│   │   │   │   └── mipmap/
│   │   │   └── AndroidManifest.xml
│   │   ├── test/
│   │   └── androidTest/
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── data/                         # Data layer module
│   ├── src/
│   │   ├── main/kotlin/com/blockstop/data/
│   │   │   ├── local/
│   │   │   │   ├── db/
│   │   │   │   └── datastore/
│   │   │   ├── remote/
│   │   │   │   ├── api/
│   │   │   │   └── models/
│   │   │   └── repository/
│   │   └── test/
│   └── build.gradle.kts
├── domain/                       # Domain layer module
│   ├── src/
│   │   ├── main/kotlin/com/blockstop/domain/
│   │   │   ├── model/
│   │   │   ├── repository/
│   │   │   └── usecase/
│   │   └── test/
│   └── build.gradle.kts
├── presentation/                 # Presentation layer (UI) module
│   ├── src/
│   │   ├── main/kotlin/com/blockstop/presentation/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── viewmodel/
│   │   │   ├── navigation/
│   │   │   └── theme/
│   │   └── test/
│   └── build.gradle.kts
├── build.gradle.kts              # Root build configuration
├── settings.gradle.kts           # Gradle settings
├── gradle.properties             # Gradle properties
├── proguard/
│   └── proguard-rules.pro        # ProGuard/R8 rules
├── docs/
│   ├── ARCHITECTURE.md           # Architecture documentation
│   ├── SETUP.md                  # Setup and build instructions
│   ├── DEVELOPMENT.md            # Development guidelines
│   └── API_INTEGRATION.md        # API integration guide
└── IMPLEMENTATION_GUIDE.md       # Implementation guide
```

## Prerequisites

- Android Studio Flamingo or later
- JDK 11 or later
- Android SDK 28 (Android 9) or higher
- Gradle 8.0+

## Setup Instructions

### 1. Clone and Navigate to Project

```bash
cd /home/user/BlockStop-/BlockStop-Android
```

### 2. Configure Local Properties

Create `local.properties` (if not exists):

```properties
sdk.dir=/path/to/your/android/sdk
```

### 3. Install Dependencies

```bash
./gradlew build
```

### 4. Run Tests

```bash
./gradlew test
./gradlew connectedAndroidTest
```

### 5. Build APK

```bash
# Debug APK
./gradlew assembleDebug

# Release APK (requires signing configuration)
./gradlew assembleRelease
```

## Development Workflow

### Build Variants

- **Development** - Debug build with mock API responses
- **Staging** - Staging environment build
- **Production** - Production environment build

### Feature Modules

The project uses feature modules for scalability:
- `feature-auth` - Authentication screens and logic
- `feature-email` - Email scanning functionality
- `feature-files` - File scanning functionality
- `feature-threats` - Threat analysis and details
- `feature-settings` - App settings and configuration

### Testing Strategy

- **Unit Tests** - Business logic and ViewModels
- **Integration Tests** - Repository and API integration
- **UI Tests** - Jetpack Compose UI components
- **End-to-End Tests** - Complete user flows

## API Integration

The app integrates with BlockStop backend API for:

- **Authentication** - OAuth 2.0 flow
- **Threat Detection** - Email and file scanning
- **Threat Intelligence** - Real-time threat data
- **Notifications** - Push notifications via Firebase
- **Offline Sync** - Automatic sync when online

See `docs/API_INTEGRATION.md` for detailed API specifications.

## Authentication Flow

### OAuth 2.0 Implementation

1. **User clicks login**
2. **App opens browser** to BlockStop auth URL
3. **User authenticates** and authorizes app
4. **Callback URL** returns auth code
5. **App exchanges code** for access token
6. **Token stored** in encrypted SharedPreferences
7. **Automatic refresh** before expiration

### Token Storage

```kotlin
// Encrypted using EncryptedSharedPreferences
EncryptedSharedPreferences.create(
    context,
    "blockstop_tokens",
    MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

## Offline Capability

### Local Storage

- **Room Database** - Cached threats, emails, files
- **DataStore** - User preferences and settings
- **File Storage** - Scanned files and reports

### Sync Strategy

- **Automatic sync** when network restored
- **Conflict resolution** - Server wins for conflicts
- **Queue management** - Pending operations queued

## Tier-based Features

### PRO Tier
- Basic email scanning (5/day)
- File scanning (10 MB/day)
- Threat notifications
- Basic threat analysis

### NEO Tier
- Advanced email scanning (50/day)
- File scanning (500 MB/day)
- Advanced threat analysis
- Custom filters
- API access (limited)

### MAX Tier
- Unlimited email scanning
- Unlimited file scanning
- Full threat intelligence
- Custom rules engine
- Full API access
- Priority support

## Permissions

The app requires the following Android permissions:

```xml
<!-- Network access -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Email access (if integrated with email apps) -->
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.READ_EMAIL" />

<!-- File access -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Push Notifications

Uses Firebase Cloud Messaging for:
- Threat alerts
- Scan completions
- Policy updates
- Feature announcements

## Security Considerations

- **Network Security** - TLS 1.2+ for all API calls
- **Token Storage** - Encrypted with Android Keystore
- **Data Storage** - SQLite encryption with Room
- **Code Obfuscation** - R8/ProGuard minification
- **Dependency Security** - Regular dependency updates
- **API Validation** - Certificate pinning for API calls

## Building for Release

### Prerequisites
- Release signing keystore configured
- Gradle properties updated with signing details

### Build Process

```bash
# Build release APK
./gradlew assembleRelease

# Build release AAB (for Play Store)
./gradlew bundleRelease

# Sign with jarsigner (if needed)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
    -keystore release.keystore \
    app/build/outputs/bundle/release/app-release.aab \
    release_key
```

## Troubleshooting

### Common Build Issues

**Issue:** `Gradle sync failed`
- **Solution:** File > Sync Now > Clear cache and restart

**Issue:** `Cannot find android SDK`
- **Solution:** Configure SDK location in Android Studio preferences

**Issue:** `Compilation error with Compose`
- **Solution:** Ensure Kotlin Compiler version matches project setup

### Runtime Issues

**Issue:** `Blank screen on launch`
- **Solution:** Check logcat for exceptions, ensure API endpoint configured

**Issue:** `Notifications not working`
- **Solution:** Verify Firebase configuration, check notification permissions

## Contributing

1. Create feature branch from `develop`
2. Follow Kotlin style guide
3. Write unit tests for new features
4. Submit pull request with description

## License

Copyright (c) 2026 BlockStop. All rights reserved.

## Support

For issues and questions:
- Documentation: `/docs` directory
- Issue tracker: GitHub Issues
- Email: support@blockstop.io

---

**BlockStop Android v1.0.0**  
**Last Updated:** June 21, 2026
