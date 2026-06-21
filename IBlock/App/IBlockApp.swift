import SwiftUI
import Combine

/// Main entry point for IBlock iOS application
/// MVVM architecture with Combine reactive state management
@main
struct IBlockApp: App {

    // MARK: - Environment Setup
    @StateObject private var authService = AuthService()
    @StateObject private var apiService = APIService()
    @StateObject private var tierGatingService = TierGatingService()
    @StateObject private var notificationService = NotificationService()
    @StateObject private var cacheService = CacheService()

    @State private var isInitializing = true
    @State private var appError: AppError?

    var body: some Scene {
        WindowGroup {
            ZStack {
                if isInitializing {
                    SplashView()
                        .onAppear {
                            initializeApp()
                        }
                } else {
                    if authService.isAuthenticated {
                        MainTabView()
                            .environmentObject(authService)
                            .environmentObject(apiService)
                            .environmentObject(tierGatingService)
                            .environmentObject(notificationService)
                            .environmentObject(cacheService)
                    } else {
                        AuthContainerView()
                            .environmentObject(authService)
                            .environmentObject(apiService)
                    }
                }

                // Global error banner
                if let error = appError {
                    VStack {
                        ErrorBanner(
                            message: error.userMessage,
                            onDismiss: { appError = nil }
                        )
                        Spacer()
                    }
                }
            }
            .onOpenURL { url in
                handleDeepLink(url)
            }
        }
    }

    // MARK: - Initialization

    /// Initialize app services and check authentication state
    private func initializeApp() {
        Task {
            defer { isInitializing = false }

            do {
                // Step 1: Load notification permissions
                try await notificationService.requestAuthorization()

                // Step 2: Check for existing authentication token
                if let token = KeychainService.retrieve(key: KeychainService.Keys.accessToken) {
                    // Verify token is not expired
                    if let expiryString = KeychainService.retrieve(key: KeychainService.Keys.tokenExpiry),
                       let expiry = ISO8601DateFormatter().date(from: expiryString) {

                        if Date() < expiry {
                            // Token valid, refresh user info
                            let userInfo = try await apiService.fetchUserInfo()
                            authService.currentUser = userInfo
                            authService.isAuthenticated = true
                        } else {
                            // Token expired, attempt refresh
                            try await authService.refreshAccessToken()
                        }
                    } else {
                        authService.isAuthenticated = true
                    }
                } else {
                    authService.isAuthenticated = false
                }

                // Step 3: Request biometric verification if enabled
                if authService.isAuthenticated,
                   UserDefaults.standard.bool(forKey: "biometricsEnabled") {
                    let biometricService = BiometricAuthService()
                    do {
                        let _ = try await biometricService.verifyBiometric()
                    } catch {
                        // Biometric verification failed, not critical
                        Logger.warning("Biometric verification failed: \(error)")
                    }
                }

            } catch {
                Logger.error("App initialization failed: \(error)")
                appError = AppError.initializationError(error.localizedDescription)
                authService.isAuthenticated = false
            }
        }
    }

    /// Handle deep links (OAuth callbacks, file scanning, etc.)
    private func handleDeepLink(_ url: URL) {
        Logger.info("Handling deep link: \(url.absoluteString)")

        // Check for OAuth callback: blockstop://oauth-callback?code=...&state=...
        if url.scheme == "blockstop" && url.host == "oauth-callback" {
            handleOAuthCallback(url)
        }
        // Check for file scan: blockstop://scan?file=...
        else if url.scheme == "blockstop" && url.host == "scan" {
            // Will be handled by FileScannerView
            Logger.debug("File scan deep link captured")
        }
    }

    /// Handle OAuth 2.0 callback
    private func handleOAuthCallback(_ url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems else {
            appError = AppError.invalidOAuthResponse
            return
        }

        let params = Dictionary(uniqueKeysWithValues: queryItems.map { ($0.name, $0.value ?? "") })

        guard let code = params["code"],
              let state = params["state"] else {
            appError = AppError.invalidOAuthResponse
            return
        }

        // Validate state to prevent CSRF attacks
        if !authService.validateOAuthState(state) {
            appError = AppError.invalidOAuthState
            return
        }

        // Exchange code for tokens
        Task {
            do {
                try await authService.handleOAuthCallback(code: code)
                isInitializing = false
            } catch {
                appError = AppError.authenticationFailed(error.localizedDescription)
            }
        }
    }
}

// MARK: - Splash View

struct SplashView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.1, green: 0.2, blue: 0.4),
                    Color(red: 0.15, green: 0.3, blue: 0.5)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Shield Icon
                Image(systemName: "shield.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.yellow)
                    .scaleEffect(1.0)

                VStack(spacing: 8) {
                    Text("IBlock")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text("Threat Detection")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                ProgressView()
                    .tint(.yellow)
                    .scaleEffect(1.2)

                Text("Loading...")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
                    .padding(.bottom, 50)
            }
            .padding()
        }
    }
}

// MARK: - Error Banner

struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    @State private var isVisible = true

    var body: some View {
        if isVisible {
            HStack {
                Image(systemName: "exclamationmark.circle.fill")
                    .foregroundColor(.red)

                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.white)

                Spacer()

                Button(action: {
                    withAnimation {
                        isVisible = false
                        onDismiss()
                    }
                }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.white)
                }
            }
            .padding(12)
            .background(Color.red.opacity(0.8))
            .cornerRadius(8)
            .padding()
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}

// MARK: - Logger Service

class Logger {
    enum Level: String {
        case debug = "DEBUG"
        case info = "INFO"
        case warning = "WARNING"
        case error = "ERROR"
    }

    static func log(_ level: Level, _ message: String, file: String = #file, line: Int = #line) {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let filename = (file as NSString).lastPathComponent
        let logMessage = "[\(timestamp)] [\(level.rawValue)] [\(filename):\(line)] \(message)"

        #if DEBUG
        print(logMessage)
        #endif
    }

    static func debug(_ message: String, file: String = #file, line: Int = #line) {
        log(.debug, message, file: file, line: line)
    }

    static func info(_ message: String, file: String = #file, line: Int = #line) {
        log(.info, message, file: file, line: line)
    }

    static func warning(_ message: String, file: String = #file, line: Int = #line) {
        log(.warning, message, file: file, line: line)
    }

    static func error(_ message: String, file: String = #file, line: Int = #line) {
        log(.error, message, file: file, line: line)
    }
}
