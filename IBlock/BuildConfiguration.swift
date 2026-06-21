import Foundation

/// Build-time configuration for IBlock application
/// Separates environment-specific settings from code
struct BuildConfiguration {

    // MARK: - API Configuration

    enum Environment: String {
        case development = "dev"
        case staging = "staging"
        case production = "prod"
    }

    static let environment: Environment = {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }()

    static let apiBaseURL: URL = {
        switch environment {
        case .development:
            return URL(string: "https://api.dev.blockstop.app")!
        case .staging:
            return URL(string: "https://api.staging.blockstop.app")!
        case .production:
            return URL(string: "https://api.blockstop.app")!
        }
    }()

    // MARK: - OAuth Configuration

    static let oauthClientID = "blockstop_ios_client"
    static let oauthRedirectURI = "blockstop://oauth-callback"

    static let supportedOAuthProviders = [
        "google",
        "github"
    ]

    // MARK: - Feature Flags

    struct FeatureFlags {
        /// Enable CloudKit sync (MAX tier only)
        static let cloudKitSyncEnabled = true

        /// Enable biometric authentication
        static let biometricAuthEnabled = true

        /// Enable push notifications
        static let pushNotificationsEnabled = true

        /// Enable offline mode
        static let offlineModeEnabled = true

        /// Enable analytics tracking
        static let analyticsEnabled = true

        /// Enable developer logging
        static let verboseLoggingEnabled = {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()

        /// Enable network request logging
        static let networkLoggingEnabled = {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()
    }

    // MARK: - Cache Configuration

    struct Cache {
        /// Maximum number of cached scans
        static let maxCachedScans = 100

        /// Cache expiration days
        static let cacheExpirationDays = 30

        /// Cache validity duration for API responses (hours)
        static let cacheValidityHours = 1
    }

    // MARK: - Network Configuration

    struct Network {
        /// Request timeout in seconds
        static let requestTimeout: TimeInterval = 30

        /// Resource timeout in seconds
        static let resourceTimeout: TimeInterval = 60

        /// Maximum retry attempts
        static let maxRetries = 3

        /// Initial retry delay in seconds
        static let initialRetryDelay: TimeInterval = 1.0

        /// Maximum retry delay in seconds
        static let maxRetryDelay: TimeInterval = 30.0
    }

    // MARK: - Session Configuration

    struct Session {
        /// Token refresh buffer in minutes (refresh before expiry)
        static let tokenRefreshBufferMinutes = 5

        /// Session timeout in minutes
        static let sessionTimeoutMinutes = 15

        /// Biometric re-verification interval in minutes
        static let biometricVerificationIntervalMinutes = 5
    }

    // MARK: - Security Configuration

    struct Security {
        /// Enable certificate pinning
        static let certificatePinningEnabled = true

        /// Allow cleartext traffic (should be false in production)
        static let allowCleartextTraffic = false

        /// Minimum iOS version for biometric
        static let minIOSForBiometric = "14.0"

        /// Enable Keychain encryption
        static let keychainEncryptionEnabled = true
    }

    // MARK: - Notification Configuration

    struct Notifications {
        /// Show notification badge
        static let badgeEnabled = true

        /// Show notification sound
        static let soundEnabled = true

        /// Enable haptic feedback
        static let hapticEnabled = true

        /// Critical threat haptic pattern: double vibration
        static let criticalThreatPattern = [0, 200, 200, 200]

        /// High threat haptic pattern: single strong vibration
        static let highThreatPattern = [0, 300]

        /// Medium threat haptic pattern: single light vibration
        static let mediumThreatPattern = [0, 150]
    }

    // MARK: - UI Configuration

    struct UI {
        /// Enable premium animations (MAX tier)
        static let premiumAnimationsEnabled = true

        /// Animation duration in seconds
        static let animationDuration: Double = 0.3

        /// Theme colors
        struct Colors {
            static let primary = "#1E40AF"      // Light blue
            static let accent = "#FBBF24"       // Yellow
            static let success = "#10B981"      // Green
            static let warning = "#F59E0B"      // Amber
            static let error = "#EF4444"        // Red
            static let critical = "#DC2626"     // Dark red
        }

        /// Supported device types
        static let supportedDevices: [UIUserInterfaceIdiom] = [.phone, .pad]

        /// Minimum screen size for certain features
        static let minScreenWidth: CGFloat = 320
    }

    // MARK: - File Configuration

    struct Files {
        /// Maximum file size for scanning (MB)
        static let maxFileSizeForScanMB = 25

        /// Maximum file size for upload (MB)
        static let maxUploadSizeMB = 25

        /// Supported file types
        static let supportedFileTypes = [
            "com.adobe.pdf",
            "com.microsoft.word.doc",
            "org.openxmlformats.wordprocessingml.document",
            "com.microsoft.excel.xls",
            "org.openxmlformats.spreadsheetml.sheet",
            "com.pkware.zip-archive",
            "public.zip-archive",
            "com.microsoft.windows-executable"
        ]
    }

    // MARK: - Analytics Configuration

    struct Analytics {
        /// Enable event tracking
        static let eventTrackingEnabled = FeatureFlags.analyticsEnabled

        /// Enable crash tracking
        static let crashTrackingEnabled = !FeatureFlags.verboseLoggingEnabled

        /// Batch event reporting (number of events before sending)
        static let eventBatchSize = 10

        /// Event reporting timeout (minutes)
        static let eventReportingTimeoutMinutes = 5
    }

    // MARK: - Database Configuration

    struct Database {
        /// Enable CoreData migrations
        static let autoMigrateEnabled = true

        /// Enable database encryption
        static let encryptionEnabled = !FeatureFlags.verboseLoggingEnabled

        /// Database file name
        static let databaseName = "IBlock"

        /// Enable CloudKit sync
        static let cloudKitEnabled = FeatureFlags.cloudKitSyncEnabled
    }

    // MARK: - Version Information

    struct Version {
        /// App version (major.minor.patch)
        static let appVersion = "1.0.0"

        /// Build number
        static let buildNumber = "1"

        /// Minimum API version supported
        static let minAPIVersion = "v1"

        /// Current API version
        static let currentAPIVersion = "v1"
    }

    // MARK: - Debug Configuration

    struct Debug {
        /// Mock data enabled
        static let mockDataEnabled = {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()

        /// Use local mock server
        static let useMockServer = {
            #if DEBUG
            return false
            #else
            return false
            #endif
        }()

        /// Enable strict SSL checking
        static let strictSSLEnabled = !{
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()

        /// Print all API requests
        static let logAllRequests = {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()

        /// Print all API responses
        static let logAllResponses = {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }()

        /// Delay API responses (seconds)
        static let apiResponseDelay: TimeInterval = {
            #if DEBUG
            return 0
            #else
            return 0
            #endif
        }()
    }

    // MARK: - Info Methods

    static func getEnvironmentDescription() -> String {
        switch environment {
        case .development:
            return "Development"
        case .staging:
            return "Staging"
        case .production:
            return "Production"
        }
    }

    static func getDebugInfo() -> [String: String] {
        [
            "Environment": getEnvironmentDescription(),
            "API URL": apiBaseURL.absoluteString,
            "App Version": Version.appVersion,
            "Build Number": Version.buildNumber,
            "Bundle ID": Bundle.main.bundleIdentifier ?? "Unknown",
            "CloudKit Enabled": String(FeatureFlags.cloudKitSyncEnabled),
            "Biometric Enabled": String(FeatureFlags.biometricAuthEnabled),
            "Analytics Enabled": String(FeatureFlags.analyticsEnabled),
            "Verbose Logging": String(FeatureFlags.verboseLoggingEnabled)
        ]
    }
}

// MARK: - Configuration Validation

extension BuildConfiguration {
    static func validate() throws {
        // Validate URLs
        guard URLComponents(url: apiBaseURL, resolvingAgainstBaseURL: true) != nil else {
            throw AppError.initializationError("Invalid API base URL")
        }

        // Validate file size limits
        guard Files.maxFileSizeForScanMB > 0 else {
            throw AppError.initializationError("Invalid file size limit")
        }

        // Validate network timeouts
        guard Network.requestTimeout > 0, Network.resourceTimeout > 0 else {
            throw AppError.initializationError("Invalid network timeouts")
        }

        // Log configuration in debug builds
        #if DEBUG
        Logger.debug("BuildConfiguration validated successfully")
        for (key, value) in getDebugInfo() {
            Logger.debug("  \(key): \(value)")
        }
        #endif
    }
}
