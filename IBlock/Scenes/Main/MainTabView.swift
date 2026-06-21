import SwiftUI

/// Main tab navigation view for authenticated users
struct MainTabView: View {
    @EnvironmentObject var authService: AuthService
    @EnvironmentObject var tierGatingService: TierGatingService
    @State private var selectedTab: MainTab = .email
    @State private var showLogoutAlert = false

    enum MainTab: Int {
        case email = 0
        case file = 1
        case dashboard = 2
        case betterbot = 3
        case settings = 4
    }

    var body: some View {
        ZStack {
            TabView(selection: $selectedTab) {
                // Email Scanner Tab
                EmailCheckerView()
                    .tabItem {
                        Label("Email", systemImage: "envelope.fill")
                    }
                    .tag(MainTab.email)

                // File Scanner Tab
                FileScannerView()
                    .tabItem {
                        Label("Files", systemImage: "doc.fill")
                    }
                    .tag(MainTab.file)

                // Dashboard Tab
                DashboardView()
                    .tabItem {
                        Label("Dashboard", systemImage: "chart.bar.fill")
                    }
                    .tag(MainTab.dashboard)

                // BetterBot Tab (MAX tier only)
                if tierGatingService.currentTier == .max {
                    ChatView()
                        .tabItem {
                            Label("BetterBot", systemImage: "bubble.left.fill")
                        }
                        .tag(MainTab.betterbot)
                } else {
                    LockedBetterBotView()
                        .tabItem {
                            Label("BetterBot", systemImage: "bubble.left.fill")
                        }
                        .tag(MainTab.betterbot)
                }

                // Settings Tab
                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gear")
                    }
                    .tag(MainTab.settings)
            }
            .onAppear {
                setupTabBarAppearance()
            }
        }
        .alert("Logout Confirmation", isPresented: $showLogoutAlert) {
            Button("Logout", role: .destructive) {
                Task {
                    do {
                        try await authService.logout()
                    } catch {
                        Logger.error("Logout error: \(error)")
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to logout?")
        }
    }

    private func setupTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = UIColor(Color(.systemBackground))

        UITabBar.appearance().scrollEdgeAppearance = appearance
        UITabBar.appearance().standardAppearance = appearance
    }
}

// MARK: - Locked BetterBot View

struct LockedBetterBotView: View {
    @EnvironmentObject var tierGatingService: TierGatingService

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "lock.fill")
                .font(.system(size: 60))
                .foregroundColor(.yellow)

            VStack(spacing: 8) {
                Text("BetterBot AI")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Upgrade to MAX tier to access AI-powered threat analysis")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            Button(action: {}) {
                Text("Upgrade to MAX")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(14)
                    .background(Color.blue)
                    .cornerRadius(8)
            }
            .padding()

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - Email Checker View

struct EmailCheckerView: View {
    @State private var email = ""
    @State private var isScanning = false
    @State private var scanResult: ScanResult?
    @State private var showResult = false
    @State private var error: AppError?
    @EnvironmentObject var apiService: APIService

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 16) {
                    HStack {
                        Image(systemName: "envelope.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.blue)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Email Checker")
                                .font(.headline)
                            Text("Verify email safety")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }
                    .padding()
                    .background(Color(.systemGray6))
                }

                ScrollView {
                    VStack(spacing: 20) {
                        // Input Section
                        VStack(spacing: 12) {
                            TextField("your@email.com", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                                .padding(12)
                                .background(Color(.systemGray6))
                                .cornerRadius(8)

                            Button(action: scanEmail) {
                                if isScanning {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Scan Email")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .foregroundColor(.white)
                            .background(Color.blue)
                            .cornerRadius(8)
                            .disabled(isScanning || email.isEmpty)
                        }
                        .padding()

                        // Results
                        if let result = scanResult {
                            ScanResultCard(result: result)
                                .padding()
                        } else {
                            EmptyStateView(
                                icon: "envelope.open",
                                title: "No scan yet",
                                message: "Enter an email address and tap 'Scan Email' to check if it's safe"
                            )
                            .padding()
                        }

                        Spacer()
                    }
                }

                .frame(maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("Email Checker")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: .constant(error != nil)) {
                Button("OK") { error = nil }
            } message: {
                Text(error?.userMessage ?? "Unknown error")
            }
        }
    }

    private func scanEmail() {
        isScanning = true
        Task {
            defer { isScanning = false }

            do {
                let result = try await apiService.scanEmail(email)
                scanResult = result
                showResult = true
            } catch let err as AppError {
                error = err
            } catch {
                error = .apiError(error.localizedDescription)
            }
        }
    }
}

// MARK: - File Scanner View

struct FileScannerView: View {
    @State private var showFilePicker = false
    @State private var selectedFile: URL?
    @State private var isScanning = false
    @State private var scanResult: ScanResult?
    @State private var error: AppError?
    @EnvironmentObject var apiService: APIService

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 16) {
                    HStack {
                        Image(systemName: "doc.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.orange)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("File Scanner")
                                .font(.headline)
                            Text("Check files for threats")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }
                    .padding()
                    .background(Color(.systemGray6))
                }

                ScrollView {
                    VStack(spacing: 20) {
                        // File Selection
                        VStack(spacing: 12) {
                            Button(action: { showFilePicker = true }) {
                                VStack(spacing: 12) {
                                    Image(systemName: "doc.badge.plus")
                                        .font(.system(size: 40))
                                        .foregroundColor(.blue)

                                    Text(selectedFile?.lastPathComponent ?? "Select File")
                                        .font(.body)
                                        .fontWeight(.semibold)

                                    if selectedFile == nil {
                                        Text("Choose a file to scan")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(32)
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(style: StrokeStyle(lineWidth: 2, dash: [8]))
                                        .foregroundColor(.blue)
                                )
                            }

                            if selectedFile != nil {
                                Button(action: { selectedFile = nil }) {
                                    Text("Clear Selection")
                                        .font(.subheadline)
                                        .foregroundColor(.red)
                                }
                            }
                        }
                        .padding()

                        // Scan Button
                        if selectedFile != nil {
                            Button(action: scanFile) {
                                if isScanning {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Scan File")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .foregroundColor(.white)
                            .background(Color.orange)
                            .cornerRadius(8)
                            .padding()
                        }

                        // Results
                        if let result = scanResult {
                            ScanResultCard(result: result)
                                .padding()
                        } else {
                            EmptyStateView(
                                icon: "doc.text",
                                title: "No file selected",
                                message: "Choose a file from your device to scan for threats"
                            )
                            .padding()
                        }

                        Spacer()
                    }
                }
                .frame(maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("File Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.item],
                onCompletion: handleFilePick
            )
            .alert("Error", isPresented: .constant(error != nil)) {
                Button("OK") { error = nil }
            } message: {
                Text(error?.userMessage ?? "Unknown error")
            }
        }
    }

    private func handleFilePick(_ result: Result<URL, Error>) {
        switch result {
        case .success(let url):
            selectedFile = url
        case .failure(let error):
            self.error = .fileReadError(error.localizedDescription)
        }
    }

    private func scanFile() {
        guard let fileURL = selectedFile else { return }

        isScanning = true
        Task {
            defer { isScanning = false }

            do {
                let fileSize = try fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                let result = try await apiService.uploadAndScanFile(
                    fileURL: fileURL,
                    fileName: fileURL.lastPathComponent,
                    fileSize: Int64(fileSize)
                )
                scanResult = result
            } catch let err as AppError {
                error = err
            } catch {
                error = .apiError(error.localizedDescription)
            }
        }
    }
}

// MARK: - Dashboard View Placeholder

struct DashboardView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Text("Dashboard")
                    .font(.title2)
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Chat View Placeholder (MAX only)

struct ChatView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Text("BetterBot AI Chat")
                    .font(.title2)
            }
            .navigationTitle("BetterBot")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Settings View Placeholder

struct SettingsView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showLogoutAlert = false

    var body: some View {
        NavigationStack {
            VStack {
                List {
                    Section("Account") {
                        Text("User: \(authService.currentUser?.email ?? "Unknown")")
                    }

                    Section {
                        Button(role: .destructive) {
                            showLogoutAlert = true
                        } label: {
                            Label("Logout", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Logout?", isPresented: $showLogoutAlert) {
                Button("Logout", role: .destructive) {
                    Task {
                        try? await authService.logout()
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure?")
            }
        }
    }
}

// MARK: - Helper Components

struct ScanResultCard: View {
    let result: ScanResult

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(result.scanType.capitalized)
                        .font(.headline)
                    Text(result.formattedTime)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                StatusBadge(threatCount: result.threatCount, criticalCount: result.criticalCount)
            }

            Divider()

            HStack(spacing: 16) {
                StatBox(title: "Total", value: "\(result.threatCount)")
                StatBox(title: "Critical", value: "\(result.criticalCount)")
                StatBox(title: "Duration", value: result.durationFormatted)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct StatBox: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct StatusBadge: View {
    let threatCount: Int
    let criticalCount: Int

    var body: some View {
        VStack(spacing: 4) {
            if criticalCount > 0 {
                Label("\(criticalCount) Critical", systemImage: "xmark.octagon.fill")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.red)
                    .cornerRadius(6)
            } else if threatCount > 0 {
                Label("\(threatCount) Threats", systemImage: "exclamationmark.circle.fill")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.orange)
                    .cornerRadius(6)
            } else {
                Label("Clean", systemImage: "checkmark.circle.fill")
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.green)
                    .cornerRadius(6)
            }
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)

                Text(message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundColor(.secondary)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService())
        .environmentObject(APIService())
        .environmentObject(TierGatingService())
}
