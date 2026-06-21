import Foundation

/// Comprehensive error handling for IBlock
/// Provides user-friendly messages and detailed logging
enum AppError: LocalizedError, Equatable {

    // MARK: - Authentication Errors
    case authenticationFailed(String)
    case invalidCredentials
    case sessionExpired
    case invalidOAuthResponse
    case invalidOAuthState
    case biometricAuthFailed
    case biometricNotAvailable

    // MARK: - Network Errors
    case networkUnavailable
    case networkTimeout
    case invalidResponse
    case httpError(Int) // Status code
    case apiError(String) // Server error message

    // MARK: - Data Errors
    case decodingError(String)
    case invalidData
    case dataNotFound

    // MARK: - Tier/Feature Errors
    case insufficientTier(String)
    case tierGatingBlocked
    case featureNotAvailable
    case deviceNotSupported

    // MARK: - File Errors
    case fileNotFound
    case invalidFileType
    case fileTooLarge(String)
    case fileReadError(String)
    case fileUploadError(String)

    // MARK: - Storage Errors
    case keychainError(String)
    case coreDataError(String)
    case cloudKitError(String)

    // MARK: - Initialization Errors
    case initializationError(String)

    // MARK: - User-Friendly Messages
    var userMessage: String {
        switch self {
        // Authentication
        case .authenticationFailed(let reason):
            return "Login failed: \(reason)"
        case .invalidCredentials:
            return "Invalid email or password"
        case .sessionExpired:
            return "Your session has expired. Please log in again."
        case .invalidOAuthResponse:
            return "OAuth login failed. Please try again."
        case .invalidOAuthState:
            return "Security validation failed. Please try again."
        case .biometricAuthFailed:
            return "Biometric authentication failed. Try again or use your password."
        case .biometricNotAvailable:
            return "Biometric authentication is not available on this device"

        // Network
        case .networkUnavailable:
            return "No internet connection. Some features may be unavailable."
        case .networkTimeout:
            return "Request timed out. Please check your connection and try again."
        case .invalidResponse:
            return "Invalid response from server. Please try again."
        case .httpError(let code):
            return "Server error (\(code)). Please try again later."
        case .apiError(let message):
            return "Error: \(message)"

        // Data
        case .decodingError(let reason):
            return "Data format error: \(reason)"
        case .invalidData:
            return "Invalid data received"
        case .dataNotFound:
            return "Data not found"

        // Tier/Feature
        case .insufficientTier(let feature):
            return "\(feature) requires a higher tier subscription"
        case .tierGatingBlocked:
            return "This feature requires a higher subscription tier"
        case .featureNotAvailable:
            return "This feature is not currently available"
        case .deviceNotSupported:
            return "This feature is not available on your device"

        // Files
        case .fileNotFound:
            return "File not found"
        case .invalidFileType:
            return "File type not supported for scanning"
        case .fileTooLarge(let size):
            return "File is too large (\(size)). Maximum size is 25 MB."
        case .fileReadError(let reason):
            return "Could not read file: \(reason)"
        case .fileUploadError(let reason):
            return "Upload failed: \(reason)"

        // Storage
        case .keychainError(let reason):
            return "Secure storage error: \(reason)"
        case .coreDataError(let reason):
            return "Database error: \(reason)"
        case .cloudKitError(let reason):
            return "Sync error: \(reason)"

        // Initialization
        case .initializationError(let reason):
            return "App startup error: \(reason)"
        }
    }

    // MARK: - Error Descriptions
    var errorDescription: String? {
        userMessage
    }

    var failureReason: String? {
        switch self {
        case .authenticationFailed(let reason):
            return reason
        case .invalidCredentials:
            return "Email or password is incorrect"
        case .sessionExpired:
            return "User session expired"
        case .networkUnavailable:
            return "Internet connection not available"
        case .httpError(let code):
            return "HTTP Status: \(code)"
        case .insufficientTier(let feature):
            return "User does not have access to \(feature)"
        case .fileTooLarge:
            return "File size exceeds maximum limit"
        default:
            return nil
        }
    }

    // MARK: - Equatable Conformance
    static func == (lhs: AppError, rhs: AppError) -> Bool {
        switch (lhs, rhs) {
        case (.authenticationFailed(let a), .authenticationFailed(let b)):
            return a == b
        case (.invalidCredentials, .invalidCredentials):
            return true
        case (.sessionExpired, .sessionExpired):
            return true
        case (.networkUnavailable, .networkUnavailable):
            return true
        case (.networkTimeout, .networkTimeout):
            return true
        case (.httpError(let a), .httpError(let b)):
            return a == b
        case (.fileNotFound, .fileNotFound):
            return true
        case (.insufficientTier(let a), .insufficientTier(let b)):
            return a == b
        case (.tierGatingBlocked, .tierGatingBlocked):
            return true
        default:
            return false
        }
    }

    // MARK: - Retry Logic
    var isRetryable: Bool {
        switch self {
        case .networkUnavailable, .networkTimeout, .httpError(let code) where code >= 500:
            return true
        default:
            return false
        }
    }

    var suggestedRetryDelay: TimeInterval {
        switch self {
        case .networkTimeout:
            return 2.0
        case .httpError(let code) where code == 429:
            return 60.0 // Rate limited
        case .httpError(let code) where code >= 500:
            return 5.0 // Server error
        default:
            return 0.0
        }
    }
}
