import Foundation
import Combine

/// Handles OAuth 2.0 authentication and session management
/// Integrates with Keychain for secure token storage
class AuthService: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: - Private Properties
    private var cancellables = Set<AnyCancellable>()
    private var sessionTimer: Timer?
    private var oauthState: String?

    // MARK: - Configuration
    private let baseURL = URL(string: "https://api.blockstop.app")!
    private let clientID = "blockstop_ios_client"
    private let redirectURI = "blockstop://oauth-callback"

    // MARK: - Initialization

    override init() {
        super.init()
        setupSessionMonitoring()
    }

    // MARK: - OAuth 2.0 Login

    /// Initiate OAuth login flow
    /// - Parameter provider: OAuth provider ("google", "github", etc.)
    /// - Returns: Authorization URL to open in browser
    func initiateOAuth(provider: String) -> URL? {
        // Generate random state for CSRF protection
        let state = generateRandomState()
        self.oauthState = state

        var components = URLComponents(url: baseURL.appendingPathComponent("/oauth/authorize"), resolvingAgainstBaseURL: true)!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "email profile threats"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "provider", value: provider)
        ]

        return components.url
    }

    /// Handle OAuth callback with authorization code
    /// - Parameter code: Authorization code from OAuth provider
    func handleOAuthCallback(code: String) async throws {
        isLoading = true
        defer { isLoading = false }

        let tokenURL = baseURL.appendingPathComponent("/oauth/token")
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: String] = [
            "grant_type": "authorization_code",
            "code": code,
            "client_id": clientID,
            "redirect_uri": redirectURI
        ]

        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200:
            let tokenResponse = try JSONDecoder().decode(AuthToken.self, from: data)
            // Store tokens securely
            KeychainService.save(key: KeychainService.Keys.accessToken, value: tokenResponse.accessToken)
            KeychainService.save(key: KeychainService.Keys.refreshToken, value: tokenResponse.refreshToken)

            let expiryDate = tokenResponse.expiresAt
            KeychainService.save(key: KeychainService.Keys.tokenExpiry, value: ISO8601DateFormatter().string(from: expiryDate))

            // Fetch user information
            let userInfo = try await APIService().fetchUserInfo(accessToken: tokenResponse.accessToken)
            currentUser = userInfo
            isAuthenticated = true

            Logger.info("OAuth login successful for user: \(userInfo.email)")

            // Start session monitoring
            startSessionMonitoring(with: tokenResponse)

        case 400...499:
            throw AppError.authenticationFailed("Invalid credentials")
        case 500...:
            throw AppError.httpError(httpResponse.statusCode)
        default:
            throw AppError.invalidResponse
        }
    }

    // MARK: - Token Refresh

    /// Refresh access token using refresh token
    func refreshAccessToken() async throws {
        guard let refreshToken = KeychainService.retrieve(key: KeychainService.Keys.refreshToken) else {
            throw AppError.sessionExpired
        }

        let tokenURL = baseURL.appendingPathComponent("/oauth/refresh")
        var request = URLRequest(url: tokenURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: String] = [
            "grant_type": "refresh_token",
            "refresh_token": refreshToken,
            "client_id": clientID
        ]

        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200:
            let tokenResponse = try JSONDecoder().decode(AuthToken.self, from: data)
            KeychainService.save(key: KeychainService.Keys.accessToken, value: tokenResponse.accessToken)
            KeychainService.save(key: KeychainService.Keys.refreshToken, value: tokenResponse.refreshToken)

            let expiryDate = tokenResponse.expiresAt
            KeychainService.save(key: KeychainService.Keys.tokenExpiry, value: ISO8601DateFormatter().string(from: expiryDate))

            Logger.info("Token refreshed successfully")

            // Restart monitoring with new expiry
            startSessionMonitoring(with: tokenResponse)

        case 401:
            // Refresh token is invalid, must re-authenticate
            clearSession()
            throw AppError.sessionExpired

        default:
            throw AppError.httpError(httpResponse.statusCode)
        }
    }

    // MARK: - Session Management

    /// Setup monitoring to refresh token before expiration
    private func startSessionMonitoring(with token: AuthToken) {
        sessionTimer?.invalidate()

        // Schedule refresh 5 minutes before expiration
        let refreshTime = token.expiresAt.addingTimeInterval(-5 * 60)
        let timeInterval = max(0, refreshTime.timeIntervalSinceNow)

        sessionTimer = Timer.scheduledTimer(withTimeInterval: timeInterval, repeats: false) { [weak self] _ in
            Task {
                do {
                    try await self?.refreshAccessToken()
                } catch {
                    Logger.error("Automatic token refresh failed: \(error)")
                    self?.clearSession()
                }
            }
        }

        Logger.info("Session monitoring started, refresh scheduled in \(Int(timeInterval)) seconds")
    }

    /// Monitor session state and handle expiration
    private func setupSessionMonitoring() {
        // Listen to app foreground events
        NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)
            .sink { [weak self] _ in
                Task {
                    await self?.checkSessionValidity()
                }
            }
            .store(in: &cancellables)
    }

    /// Check if current session is still valid
    @MainActor
    private func checkSessionValidity() async {
        guard isAuthenticated else { return }

        if let expiryString = KeychainService.retrieve(key: KeychainService.Keys.tokenExpiry),
           let expiry = ISO8601DateFormatter().date(from: expiryString) {

            if Date() > expiry {
                // Token is expired
                do {
                    try await refreshAccessToken()
                } catch {
                    clearSession()
                    errorMessage = "Session expired. Please log in again."
                }
            } else if Date().addingTimeInterval(5 * 60) > expiry {
                // Token expires soon, refresh proactively
                do {
                    try await refreshAccessToken()
                } catch {
                    Logger.warning("Proactive token refresh failed: \(error)")
                }
            }
        }
    }

    // MARK: - Logout

    /// Clear session and logout user
    func logout() async throws {
        sessionTimer?.invalidate()

        // Notify server
        let logoutURL = baseURL.appendingPathComponent("/oauth/logout")
        var request = URLRequest(url: logoutURL)
        request.httpMethod = "POST"

        if let accessToken = KeychainService.retrieve(key: KeychainService.Keys.accessToken) {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        do {
            _ = try await URLSession.shared.data(for: request)
        } catch {
            Logger.warning("Server logout notification failed: \(error)")
        }

        clearSession()
        Logger.info("User logged out")
    }

    /// Clear all session data
    private func clearSession() {
        KeychainService.delete(key: KeychainService.Keys.accessToken)
        KeychainService.delete(key: KeychainService.Keys.refreshToken)
        KeychainService.delete(key: KeychainService.Keys.tokenExpiry)

        currentUser = nil
        isAuthenticated = false
        errorMessage = nil
        oauthState = nil
    }

    // MARK: - OAuth State Validation

    /// Validate OAuth state to prevent CSRF attacks
    func validateOAuthState(_ state: String) -> Bool {
        guard let savedState = oauthState else { return false }
        return state == savedState
    }

    // MARK: - Helpers

    /// Generate random state for OAuth CSRF protection
    private func generateRandomState() -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<32).map { _ in letters.randomElement()! })
    }
}

// MARK: - Keychain Service

class KeychainService {

    enum Keys {
        static let accessToken = "blockstop_access_token"
        static let refreshToken = "blockstop_refresh_token"
        static let tokenExpiry = "blockstop_token_expiry"
        static let biometricEnabled = "blockstop_biometric_enabled"
    }

    private static let queue = DispatchQueue(label: "com.blockstop.keychain", attributes: .concurrent)

    @discardableResult
    static func save(key: String, value: String) -> Bool {
        let data = value.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Try to delete existing entry first
        SecItemDelete(query as CFDictionary)

        let status = SecItemAdd(query as CFDictionary, nil)

        if status != errSecSuccess {
            Logger.error("Keychain save failed for key '\(key)': \(status)")
            return false
        }

        return true
    }

    static func retrieve(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    @discardableResult
    static func delete(key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }

    @discardableResult
    static func deleteAll() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}
