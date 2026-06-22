import Foundation
import LocalAuthentication
import Combine

/// Enhanced biometric authentication with Face ID/Touch ID fallbacks
/// Implements secure credential storage and multi-factor authentication
@MainActor
final class AdvancedBiometricService: NSObject {

    // MARK: - Types

    enum BiometricType {
        case faceID
        case touchID
        case opticID
        case unavailable

        var displayName: String {
            switch self {
            case .faceID: return "Face ID"
            case .touchID: return "Touch ID"
            case .opticID: return "Optic ID"
            case .unavailable: return "Biometric Authentication"
            }
        }
    }

    enum BiometricError: LocalizedError {
        case biometricUnavailable
        case biometricLocked
        case biometricCancel
        case biometricNotEnrolled
        case credentialStoreError
        case deviceOwnerAuthenticationFailed

        var errorDescription: String? {
            switch self {
            case .biometricUnavailable:
                return "Biometric authentication is not available on this device"
            case .biometricLocked:
                return "Biometric authentication is temporarily locked. Try again later"
            case .biometricCancel:
                return "Biometric authentication was canceled"
            case .biometricNotEnrolled:
                return "No biometric data is enrolled on this device"
            case .credentialStoreError:
                return "Failed to store credentials securely"
            case .deviceOwnerAuthenticationFailed:
                return "Device owner authentication failed"
            }
        }
    }

    struct AuthenticationResult {
        let success: Bool
        let biometricType: BiometricType
        let timestamp: Date
        let evaluationTime: TimeInterval
    }

    // MARK: - Properties

    let authenticationPublisher = PassthroughSubject<AuthenticationResult, BiometricError>()
    let biometricStatusPublisher = PassthroughSubject<BiometricType, Never>()

    private var availableBiometricType: BiometricType {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        else {
            return .unavailable
        }

        if #available(iOS 16.0, *) {
            if context.biometryType == .opticID {
                return .opticID
            }
        }

        if context.biometryType == .faceID {
            return .faceID
        }

        if context.biometryType == .touchID {
            return .touchID
        }

        return .unavailable
    }

    // MARK: - Initialization

    override init() {
        super.init()
        updateBiometricStatus()
    }

    // MARK: - Authentication

    func authenticate(
        reason: String = "Authenticate to access BlockStop",
        fallbackTitle: String = "Use passcode"
    ) async throws -> AuthenticationResult {
        let context = LAContext()
        context.localizedFallbackTitle = fallbackTitle

        let startTime = Date()
        let biometricType = availableBiometricType

        guard biometricType != .unavailable else {
            throw BiometricError.biometricUnavailable
        }

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            if let error = error {
                throw handleAuthenticationError(error)
            }
            throw BiometricError.biometricUnavailable
        }

        do {
            let authenticated = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )

            guard authenticated else {
                throw BiometricError.deviceOwnerAuthenticationFailed
            }

            let result = AuthenticationResult(
                success: true,
                biometricType: biometricType,
                timestamp: Date(),
                evaluationTime: Date().timeIntervalSince(startTime)
            )

            authenticationPublisher.send(result)
            return result

        } catch let error as LAError {
            throw handleAuthenticationError(error)
        }
    }

    func authenticateWithFallback(
        reason: String = "Authenticate to access BlockStop"
    ) async throws -> AuthenticationResult {
        do {
            return try await authenticate(reason: reason)
        } catch {
            // Fallback to device owner authentication (passcode)
            let context = LAContext()
            let result = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: reason
            )

            guard result else {
                throw BiometricError.deviceOwnerAuthenticationFailed
            }

            return AuthenticationResult(
                success: true,
                biometricType: .unavailable,
                timestamp: Date(),
                evaluationTime: 0
            )
        }
    }

    // MARK: - Credential Management

    func storeCredential(_ credential: String, for account: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: "com.blockstop.iblock",
            kSecValueData as String: credential.data(using: .utf8) ?? Data(),
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Delete existing credential if present
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw BiometricError.credentialStoreError
        }
    }

    func retrieveCredential(for account: String) throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: "com.blockstop.iblock",
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let credential = String(data: data, encoding: .utf8)
        else {
            throw BiometricError.credentialStoreError
        }

        return credential
    }

    func deleteCredential(for account: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: "com.blockstop.iblock"
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw BiometricError.credentialStoreError
        }
    }

    // MARK: - Status

    func updateBiometricStatus() {
        let type = availableBiometricType
        biometricStatusPublisher.send(type)
    }

    func isBiometricAvailable() -> Bool {
        availableBiometricType != .unavailable
    }

    func getCurrentBiometricType() -> BiometricType {
        availableBiometricType
    }

    // MARK: - Private

    private func handleAuthenticationError(_ error: Error) -> BiometricError {
        if let laError = error as? LAError {
            switch laError.code {
            case .biometryNotAvailable:
                return .biometricUnavailable
            case .biometryLockout:
                return .biometricLocked
            case .userCancel, .userFallback:
                return .biometricCancel
            case .biometryNotEnrolled:
                return .biometricNotEnrolled
            default:
                return .deviceOwnerAuthenticationFailed
            }
        }
        return .deviceOwnerAuthenticationFailed
    }
}
