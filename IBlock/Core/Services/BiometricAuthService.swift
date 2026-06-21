import Foundation
import LocalAuthentication

/// Manages Face ID and Touch ID authentication
/// Provides biometric verification for app unlock and sensitive actions
class BiometricAuthService: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var biometricType: BiometricType? = .none
    @Published var isAvailable = false
    @Published var errorMessage: String?

    // MARK: - Biometric Types
    enum BiometricType {
        case faceID
        case touchID
        case opticID
        case none

        var displayName: String {
            switch self {
            case .faceID: return "Face ID"
            case .touchID: return "Touch ID"
            case .opticID: return "Optic ID"
            case .none: return "None"
            }
        }
    }

    // MARK: - Private Properties
    private let context = LAContext()
    private var failureCount = 0
    private let maxFailureAttempts = 3

    // MARK: - Initialization

    override init() {
        super.init()
        checkBiometricAvailability()
    }

    // MARK: - Availability Check

    /// Check what biometric authentication is available on device
    func checkBiometricAvailability() {
        var error: NSError?
        let canEvaluate = context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        )

        DispatchQueue.main.async {
            self.isAvailable = canEvaluate

            if !canEvaluate {
                self.biometricType = .none
                Logger.warning("Biometric auth not available: \(error?.localizedDescription ?? "Unknown")")
                return
            }

            // Determine biometric type
            switch context.biometryType {
            case .faceID:
                self.biometricType = .faceID
            case .touchID:
                self.biometricType = .touchID
            case .opticID:
                self.biometricType = .opticID
            case .none:
                self.biometricType = .none
            @unknown default:
                self.biometricType = .none
            }

            Logger.info("Biometric type detected: \(self.biometricType?.displayName ?? "None")")
        }
    }

    // MARK: - Biometric Authentication

    /// Authenticate user with biometric (Face ID, Touch ID, etc.)
    /// - Parameter reason: Reason to show in authentication prompt
    /// - Returns: True if authentication successful
    func verifyBiometric(reason: String = "Authenticate to access your account") async throws -> Bool {
        guard isAvailable else {
            throw AppError.biometricNotAvailable
        }

        // Reset failure count on new attempt
        let currentFailureCount = failureCount
        failureCount = 0

        let freshContext = LAContext()
        freshContext.interactionNotAllowed = false

        do {
            let success = try await freshContext.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )

            if success {
                Logger.info("Biometric authentication successful")
                return true
            }

            return false

        } catch let error as LAError {
            handleBiometricError(error)
            throw mapBiometricError(error)

        } catch {
            throw AppError.biometricAuthFailed("Unexpected error: \(error.localizedDescription)")
        }
    }

    /// Setup biometric authentication for app
    /// - Returns: True if setup successful
    func setupBiometric() async throws -> Bool {
        guard isAvailable else {
            throw AppError.biometricNotAvailable
        }

        // Prompt user to authenticate
        let authenticated = try await verifyBiometric(
            reason: "Enable \(biometricType?.displayName ?? "biometric") authentication for quicker access"
        )

        if authenticated {
            // Store preference
            UserDefaults.standard.set(true, forKey: "biometricsEnabled")
            UserDefaults.standard.set(biometricType?.displayName, forKey: "biometricType")

            Logger.info("Biometric authentication setup successful")
            return true
        }

        return false
    }

    /// Reset biometric authentication
    func resetBiometric() throws {
        UserDefaults.standard.set(false, forKey: "biometricsEnabled")
        UserDefaults.standard.removeObject(forKey: "biometricType")
        failureCount = 0

        Logger.info("Biometric authentication reset")
    }

    /// Check if biometric is currently enabled
    func isBiometricEnabled() -> Bool {
        return UserDefaults.standard.bool(forKey: "biometricsEnabled")
    }

    // MARK: - Error Handling

    private func handleBiometricError(_ error: LAError) {
        switch error.code {
        case .authenticationFailed:
            failureCount += 1
            if failureCount >= maxFailureAttempts {
                errorMessage = "Too many failed attempts. Please use your passcode."
                Logger.warning("Biometric auth failed after \(failureCount) attempts")
            } else {
                errorMessage = "Biometric authentication failed. Please try again."
            }

        case .userCancel:
            errorMessage = "Authentication was cancelled"

        case .userFallback:
            errorMessage = "Fallback to passcode"

        case .systemCancel:
            errorMessage = "System cancelled authentication"

        case .passcodeNotSet:
            errorMessage = "Please set up a passcode first"

        case .biometryNotAvailable:
            errorMessage = "Biometric authentication not available"

        case .biometryLockout:
            errorMessage = "Biometric authentication is temporarily locked. Try again later."
            failureCount = maxFailureAttempts

        case .biometryNotEnrolled:
            errorMessage = "No biometric data enrolled"

        case .invalidContext:
            errorMessage = "Authentication context error"

        case .notInteractive:
            errorMessage = "Authentication not interactive"

        @unknown default:
            errorMessage = "Unknown biometric error"
        }
    }

    private func mapBiometricError(_ error: LAError) -> AppError {
        switch error.code {
        case .authenticationFailed:
            return .biometricAuthFailed("Authentication failed")

        case .userCancel, .userFallback:
            return .biometricAuthFailed("Authentication cancelled")

        case .biometryLockout:
            return .biometricAuthFailed("Biometric authentication is locked")

        case .biometryNotEnrolled:
            return .biometricAuthFailed("No biometric data enrolled")

        case .biometryNotAvailable, .passcodeNotSet:
            return .biometricNotAvailable

        default:
            return .biometricAuthFailed(error.localizedDescription)
        }
    }

    // MARK: - State Management

    /// Get number of failed attempts
    func getFailureCount() -> Int {
        return failureCount
    }

    /// Reset failure count
    func resetFailureCount() {
        failureCount = 0
    }

    /// Check if locked out
    func isLockedOut() -> Bool {
        return failureCount >= maxFailureAttempts
    }
}

// MARK: - LAContext Extension

extension LAContext {
    /// Evaluate biometric policy asynchronously
    nonisolated func evaluatePolicy(
        _ policy: LAPolicy,
        localizedReason: String
    ) async throws -> Bool {
        return try await withCheckedThrowingContinuation { continuation in
            self.evaluatePolicy(policy, localizedReason: localizedReason) { success, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: success)
                }
            }
        }
    }
}
