import Foundation
import UIKit
import Combine

/// Manages feature access based on user tier and device type
/// Ensures users can only access features they've paid for
class TierGatingService: ObservableObject {

    // MARK: - Published Properties
    @Published var currentTier: TierType = .free
    @Published var tierInfo: TierInfo?
    @Published var isLoading = false
    @Published var lastError: AppError?

    // MARK: - Private Properties
    private var cancellables = Set<AnyCancellable>()
    private let apiService = APIService()
    private let cacheKey = "blockstop_tier_cache"
    private var tierCache: TierInfo?
    private var lastFetchTime: Date?

    // MARK: - Constants
    private let cacheValidityDuration: TimeInterval = 3600 // 1 hour

    // MARK: - Initialization

    init(initialTier: TierType = .free) {
        self.currentTier = initialTier
        loadCachedTier()
    }

    // MARK: - Feature Access Control

    /// Check if user can access a specific feature
    /// - Parameter feature: Feature identifier
    /// - Returns: True if user can access feature
    func canAccessFeature(_ feature: String) -> Bool {
        switch (feature, currentTier) {
        // Email Analysis
        case ("emailAnalysis", .pro), ("emailAnalysis", .office), ("emailAnalysis", .health), ("emailAnalysis", .max):
            return true

        // File Scanning
        case ("fileScanning", .pro), ("fileScanning", .office), ("fileScanning", .health), ("fileScanning", .max):
            return true

        // Notifications
        case ("notifications", .pro), ("notifications", .office), ("notifications", .health), ("notifications", .max):
            return true

        // Scan History
        case ("scanHistory", .pro), ("scanHistory", .office), ("scanHistory", .health), ("scanHistory", .max):
            return true

        // Analytics (OFFICE+ only)
        case ("analytics", .office), ("analytics", .health), ("analytics", .max):
            return true

        // Team Collaboration (OFFICE+ only)
        case ("teamCollaboration", .office), ("teamCollaboration", .health), ("teamCollaboration", .max):
            return true

        // Integration Management (OFFICE+ only)
        case ("integrations", .office), ("integrations", .health), ("integrations", .max):
            return true

        // BetterBot (MAX only)
        case ("betterBot", .max):
            return true

        // Cloud Sync (MAX only)
        case ("cloudSync", .max):
            return true

        // Premium Animations (MAX only)
        case ("premiumAnimations", .max):
            return true

        // Advanced Offline (MAX only)
        case ("advancedOffline", .max):
            return true

        default:
            return false
        }
    }

    /// Check if feature can be accessed on this device type
    /// - Parameter device: Device type (iPhone or iPad)
    /// - Returns: True if device is supported for current tier
    func canAccessOnDevice(_ device: UIUserInterfaceIdiom = UIDevice.current.userInterfaceIdiom) -> Bool {
        switch (currentTier, device) {
        // PRO: iPhone only
        case (.pro, .phone):
            return true
        case (.pro, .pad):
            return false

        // OFFICE, HEALTH, MAX: All devices
        case (.office, _), (.health, _), (.max, _):
            return true

        // FREE, NEO: No native app access
        case (.free, _), (.neo, _):
            return false

        default:
            return false
        }
    }

    /// Require a minimum tier for operation
    /// - Throws: AppError.insufficientTier if tier is too low
    func requireMinimumTier(_ requiredTier: TierType) throws {
        guard canAccessTier(requiredTier) else {
            throw AppError.insufficientTier(requiredTier.displayName)
        }
    }

    /// Check if current tier meets minimum requirement
    private func canAccessTier(_ requiredTier: TierType) -> Bool {
        let tierHierarchy: [TierType] = [.free, .neo, .pro, .office, .health, .max]
        guard let currentIndex = tierHierarchy.firstIndex(of: currentTier),
              let requiredIndex = tierHierarchy.firstIndex(of: requiredTier) else {
            return false
        }
        return currentIndex >= requiredIndex
    }

    // MARK: - Tier Information

    /// Fetch current user's tier from API
    func refreshTierInfo() async throws {
        isLoading = true
        defer { isLoading = false }

        do {
            let tierInfo = try await apiService.fetchUserTier()
            self.tierInfo = tierInfo
            self.currentTier = tierInfo.type
            self.lastFetchTime = Date()

            // Cache tier info
            cacheTierInfo(tierInfo)

            Logger.info("Tier refreshed: \(tierInfo.type.displayName)")

        } catch {
            lastError = error as? AppError ?? .apiError(error.localizedDescription)
            throw lastError!
        }
    }

    /// Get feature availability for tier
    func getFeatureStatus(for feature: String) -> FeatureStatus {
        guard currentTier.canAccessApp else {
            return FeatureStatus(feature: feature, isAvailable: false, reason: "Not available in \(currentTier.displayName) tier", requiredTier: .pro)
        }

        let isAvailable = canAccessFeature(feature)
        let reason = isAvailable ? nil : "Requires higher subscription tier"

        return FeatureStatus(
            feature: feature,
            isAvailable: isAvailable,
            reason: reason,
            requiredTier: requiredTierFor(feature: feature)
        )
    }

    /// Get required tier for a specific feature
    private func requiredTierFor(feature: String) -> TierType {
        switch feature {
        case "emailAnalysis", "fileScanning", "notifications", "scanHistory":
            return .pro
        case "analytics", "teamCollaboration", "integrations":
            return .office
        case "betterBot", "cloudSync", "premiumAnimations", "advancedOffline":
            return .max
        default:
            return .free
        }
    }

    // MARK: - Tier Display

    func getTierDescription() -> String {
        switch currentTier {
        case .free:
            return "Free Tier - Web only"
        case .neo:
            return "Neo Tier - Web only with badge"
        case .pro:
            return "Pro Tier - Email analysis, File scanning"
        case .office:
            return "Office Tier - All Pro features + Analytics + Team collaboration"
        case .health:
            return "Health Tier - All Office features with health compliance"
        case .max:
            return "Max Tier - All features including BetterBot AI and CloudKit sync"
        }
    }

    func getTierColor() -> String {
        switch currentTier {
        case .free, .neo:
            return "#9CA3AF" // Gray
        case .pro:
            return "#3B82F6" // Blue
        case .office:
            return "#8B5CF6" // Purple
        case .health:
            return "#EC4899" // Pink
        case .max:
            return "#F59E0B" // Amber
        }
    }

    // MARK: - Cache Management

    private func cacheTierInfo(_ tierInfo: TierInfo) {
        if let encoded = try? JSONEncoder().encode(tierInfo) {
            UserDefaults.standard.set(encoded, forKey: cacheKey)
        }
    }

    private func loadCachedTier() {
        if let cached = UserDefaults.standard.data(forKey: cacheKey),
           let decoded = try? JSONDecoder().decode(TierInfo.self, from: cached) {
            self.tierInfo = decoded
            self.currentTier = decoded.type
            Logger.debug("Loaded cached tier: \(decoded.type.displayName)")
        }
    }

    /// Check if cached tier info is still valid
    func isCacheValid() -> Bool {
        guard let lastFetch = lastFetchTime else { return false }
        return Date().timeIntervalSince(lastFetch) < cacheValidityDuration
    }

    // MARK: - Tier Upgrade

    /// Get upgrade options for user
    func getUpgradeOptions() -> [UpgradeOption] {
        let currentIndex = TierType.allCases.firstIndex(of: currentTier) ?? 0

        return TierType.allCases.dropFirst(currentIndex + 1).map { tier in
            UpgradeOption(
                tier: tier,
                displayName: tier.displayName,
                description: getTierDescription(for: tier),
                price: getPrice(for: tier)
            )
        }
    }

    private func getTierDescription(for tier: TierType) -> String {
        switch tier {
        case .pro:
            return "Email scanning, File analysis, Threat dashboard"
        case .office:
            return "All Pro + Team collaboration, Analytics, Integrations"
        case .health:
            return "All Office + Health compliance features"
        case .max:
            return "Everything including BetterBot AI and CloudKit sync"
        default:
            return ""
        }
    }

    private func getPrice(for tier: TierType) -> String {
        switch tier {
        case .pro:
            return "$4.99/month"
        case .office:
            return "$9.99/month"
        case .health:
            return "$14.99/month"
        case .max:
            return "$19.99/month"
        default:
            return ""
        }
    }
}

// MARK: - Supporting Models

struct FeatureStatus {
    let feature: String
    let isAvailable: Bool
    let reason: String?
    let requiredTier: TierType

    var displayMessage: String {
        if isAvailable {
            return "Available in your \(requiredTier.displayName) tier"
        } else {
            return "Upgrade to \(requiredTier.displayName) to access this feature"
        }
    }
}

struct UpgradeOption {
    let tier: TierType
    let displayName: String
    let description: String
    let price: String
}

// MARK: - Tier Requirement View Modifier

struct RequireTierModifier: ViewModifier {
    let requiredTier: TierType
    @EnvironmentObject var tierGatingService: TierGatingService

    @State private var showUpgradeSheet = false

    func body(content: Content) -> some View {
        if tierGatingService.canAccessTier(requiredTier) {
            content
        } else {
            Button(action: { showUpgradeSheet = true }) {
                VStack(spacing: 16) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.yellow)

                    Text("Premium Feature")
                        .font(.headline)

                    Text("Upgrade to \(requiredTier.displayName) tier to unlock this feature")
                        .font(.body)
                        .foregroundColor(.secondary)

                    Button(action: { showUpgradeSheet = true }) {
                        Text("Upgrade Now")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(.systemBackground))
            }
            .sheet(isPresented: $showUpgradeSheet) {
                UpgradePromptView(requiredTier: requiredTier)
            }
        }
    }
}

extension View {
    func requireTier(_ tier: TierType) -> some View {
        modifier(RequireTierModifier(requiredTier: tier))
    }
}

// MARK: - Upgrade Prompt View

struct UpgradePromptView: View {
    let requiredTier: TierType
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                VStack(spacing: 12) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.yellow)

                    Text("Unlock \(requiredTier.displayName)")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Access premium threat detection features")
                        .font(.body)
                        .foregroundColor(.secondary)
                }

                Divider()

                VStack(alignment: .leading, spacing: 12) {
                    FeatureRow(icon: "envelope.fill", text: "Advanced email analysis")
                    FeatureRow(icon: "doc.fill", text: "Complete file scanning")
                    FeatureRow(icon: "chart.bar.fill", text: "Threat analytics")
                    FeatureRow(icon: "person.2.fill", text: "Team collaboration")
                    FeatureRow(icon: "sparkles", text: "BetterBot AI (Max tier)")
                }

                Spacer()

                Button(action: {}) {
                    Text("Subscribe to \(requiredTier.displayName)")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(16)
                        .background(Color.blue)
                        .cornerRadius(12)
                }

                Button(action: { dismiss() }) {
                    Text("Maybe Later")
                        .font(.body)
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding(12)
                }
            }
            .padding()
            .navigationTitle("Upgrade")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .foregroundColor(.black)
                    }
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.green)
                .frame(width: 24)

            Text(text)
                .font(.body)

            Spacer()
        }
    }
}
