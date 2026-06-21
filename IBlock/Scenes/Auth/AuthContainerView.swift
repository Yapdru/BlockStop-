import SwiftUI

/// Root view for authentication flows
struct AuthContainerView: View {
    @EnvironmentObject var authService: AuthService
    @State private var selectedTab = 0

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 12) {
                Image(systemName: "shield.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.yellow)

                Text("IBlock")
                    .font(.system(size: 36, weight: .bold))

                Text("Threat Detection & Security")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 32)

            Spacer()

            // Tab Picker
            Picker("Auth Mode", selection: $selectedTab) {
                Text("Login").tag(0)
                Text("Sign Up").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            Divider()
                .padding(.vertical, 20)

            // Auth Form
            Group {
                if selectedTab == 0 {
                    LoginFormView()
                } else {
                    SignUpFormView()
                }
            }

            Spacer()

            // Terms
            VStack(spacing: 12) {
                Divider()

                HStack(spacing: 4) {
                    Text("By continuing, you agree to our")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Link("Terms", destination: URL(string: "https://blockstop.app/terms")!)
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            .padding()
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - Login Form

struct LoginFormView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var showPassword = false
    @State private var password = ""
    @State private var rememberMe = true
    @State private var isLoading = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Email Field
                VStack(alignment: .leading, spacing: 8) {
                    Label("Email", systemImage: "envelope.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    TextField("your@email.com", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Label("Password", systemImage: "lock.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    HStack {
                        if showPassword {
                            TextField("••••••••", text: $password)
                                .textContentType(.password)
                        } else {
                            SecureField("••••••••", text: $password)
                                .textContentType(.password)
                        }

                        Button(action: { showPassword.toggle() }) {
                            Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(12)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }

                // Remember Me
                Toggle(isOn: $rememberMe) {
                    Text("Remember me")
                        .font(.subheadline)
                }

                Spacer()
                    .frame(height: 8)

                // Error Message
                if let error = authService.errorMessage {
                    HStack {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundColor(.red)

                        Text(error)
                            .font(.subheadline)
                            .foregroundColor(.red)
                    }
                    .padding(12)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }

                // Login Button
                Button(action: loginWithEmail) {
                    if authService.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Login")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(14)
                .foregroundColor(.white)
                .background(Color.blue)
                .cornerRadius(8)
                .disabled(authService.isLoading || email.isEmpty || password.isEmpty)

                Divider()
                    .padding(.vertical, 8)

                // OAuth Buttons
                OAuthButtonsView()

                Spacer()
            }
            .padding(.horizontal)
        }
    }

    private func loginWithEmail() {
        Task {
            authService.isLoading = true
            defer { authService.isLoading = false }

            do {
                // In production, call loginWithEmail on authService
                // For now, show placeholder
                Logger.info("Login attempt with email: \(email)")
                authService.errorMessage = "Feature coming soon. Use OAuth login below."
            }
        }
    }
}

// MARK: - Sign Up Form

struct SignUpFormView: View {
    @EnvironmentObject var authService: AuthService
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var agreedToTerms = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Name Field
                VStack(alignment: .leading, spacing: 8) {
                    Label("Full Name", systemImage: "person.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    TextField("John Doe", text: $name)
                        .textContentType(.name)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Email Field
                VStack(alignment: .leading, spacing: 8) {
                    Label("Email", systemImage: "envelope.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    TextField("your@email.com", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Label("Password", systemImage: "lock.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    SecureField("••••••••", text: $password)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Confirm Password
                VStack(alignment: .leading, spacing: 8) {
                    Label("Confirm Password", systemImage: "lock.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    SecureField("••••••••", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                }

                // Terms Agreement
                Toggle(isOn: $agreedToTerms) {
                    HStack(spacing: 4) {
                        Text("I agree to the")
                            .font(.subheadline)

                        Link("Terms of Service", destination: URL(string: "https://blockstop.app/terms")!)
                            .font(.subheadline)
                            .foregroundColor(.blue)
                    }
                }

                Spacer()
                    .frame(height: 8)

                // Error
                if let error = errorMessage {
                    HStack {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundColor(.red)
                        Text(error)
                            .font(.subheadline)
                    }
                    .padding(12)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }

                // Sign Up Button
                Button(action: signUp) {
                    Text("Create Account")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
                .disabled(!agreedToTerms || name.isEmpty || email.isEmpty || password.isEmpty)

                Divider()

                OAuthButtonsView()

                Spacer()
            }
            .padding(.horizontal)
        }
    }

    private func signUp() {
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }

        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters"
            return
        }

        Logger.info("Sign up attempt with email: \(email)")
        authService.errorMessage = "Feature coming soon. Use OAuth login below."
    }
}

// MARK: - OAuth Buttons

struct OAuthButtonsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var isLoggingIn = false

    var body: some View {
        VStack(spacing: 12) {
            Text("Or continue with")
                .font(.subheadline)
                .foregroundColor(.secondary)

            // Google Login
            Button(action: loginWithGoogle) {
                HStack(spacing: 8) {
                    Image(systemName: "globe")
                    Text("Google")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            .disabled(isLoggingIn)

            // GitHub Login
            Button(action: loginWithGitHub) {
                HStack(spacing: 8) {
                    Image(systemName: "network")
                    Text("GitHub")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(Color(.systemGray6))
                .cornerRadius(8)
            }
            .disabled(isLoggingIn)
        }
    }

    private func loginWithGoogle() {
        guard let url = authService.initiateOAuth(provider: "google") else { return }

        isLoggingIn = true

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {

            let config = ASWebAuthenticationSession.Configuration()
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "blockstop"
            ) { callbackURL, error in
                isLoggingIn = false

                if let error = error {
                    authService.errorMessage = "OAuth login failed: \(error.localizedDescription)"
                    return
                }

                if let callbackURL = callbackURL {
                    // Handle OAuth callback
                    Logger.info("OAuth callback received")
                }
            }

            session.presentationContextProvider = WebAuthContextProvider(window: window)
            session.start()
        }
    }

    private func loginWithGitHub() {
        guard let url = authService.initiateOAuth(provider: "github") else { return }

        isLoggingIn = true

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {

            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "blockstop"
            ) { _, error in
                isLoggingIn = false

                if let error = error {
                    authService.errorMessage = "OAuth login failed: \(error.localizedDescription)"
                }
            }

            session.presentationContextProvider = WebAuthContextProvider(window: window)
            session.start()
        }
    }
}

// MARK: - Web Auth Context Provider

struct WebAuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    let window: UIWindow

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return window
    }
}

#Preview {
    AuthContainerView()
        .environmentObject(AuthService())
        .environmentObject(APIService())
}
