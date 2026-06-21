import Foundation

// MARK: - Tier Information

enum TierType: String, Codable, CaseIterable {
    case free
    case neo
    case pro
    case office
    case health
    case max

    var displayName: String {
        switch self {
        case .free: return "Free"
        case .neo: return "Neo"
        case .pro: return "Pro"
        case .office: return "Office"
        case .health: return "Health"
        case .max: return "Max"
        }
    }

    var canAccessApp: Bool {
        switch self {
        case .free, .neo:
            return false
        case .pro, .office, .health, .max:
            return true
        }
    }

    var supportsIPad: Bool {
        switch self {
        case .pro:
            return false
        case .office, .health, .max:
            return true
        default:
            return false
        }
    }

    var hasBetterBot: Bool {
        self == .max
    }

    var hasCloudSync: Bool {
        self == .max
    }

    var hasPremiumAnimations: Bool {
        self == .max
    }
}

struct TierInfo: Codable {
    let type: TierType
    let expiresAt: Date?
    let features: [String: Bool]

    func canAccess(_ feature: String) -> Bool {
        features[feature] ?? false
    }

    var isExpired: Bool {
        guard let expiry = expiresAt else { return false }
        return Date() > expiry
    }

    var daysUntilExpiry: Int? {
        guard let expiry = expiresAt, !isExpired else { return nil }
        let days = Calendar.current.dateComponents([.day], from: Date(), to: expiry).day ?? 0
        return max(0, days)
    }
}

// MARK: - User Model

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let avatar: String?
    let tier: TierInfo
    let biometricsEnabled: Bool
    let lastLogin: Date
    let createdAt: Date

    var isPro: Bool {
        tier.type.canAccessApp
    }

    var isMaxTier: Bool {
        tier.type == .max
    }

    var tierExpiryFormatted: String {
        if let expiry = tier.expiresAt {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            return formatter.string(from: expiry)
        }
        return "No expiration"
    }

    func canAccess(feature: String) -> Bool {
        tier.canAccess(feature)
    }

    func supportsIPad() -> Bool {
        tier.type.supportsIPad
    }
}

// MARK: - Authentication Token

struct AuthToken: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int // Seconds
    let tokenType: String
    let scopes: [String]

    var expiresAt: Date {
        Date().addingTimeInterval(TimeInterval(expiresIn))
    }

    func isExpired() -> Bool {
        Date() > expiresAt
    }

    func isExpiringSoon(withinMinutes minutes: Int = 5) -> Bool {
        let threshold = Date().addingTimeInterval(TimeInterval(minutes * 60))
        return expiresAt < threshold
    }
}

// MARK: - Threat Model

enum ThreatSeverity: String, Codable, CaseIterable, Comparable {
    case low
    case medium
    case high
    case critical

    var color: String {
        switch self {
        case .low: return "#3B82F6" // Blue
        case .medium: return "#FBBF24" // Amber
        case .high: return "#F97316" // Orange
        case .critical: return "#EF4444" // Red
        }
    }

    var icon: String {
        switch self {
        case .low: return "checkmark.circle"
        case .medium: return "exclamationmark.circle"
        case .high: return "xmark.circle"
        case .critical: return "xmark.octagon"
        }
    }

    var displayName: String {
        switch self {
        case .low: return "Low"
        case .medium: return "Medium"
        case .high: return "High"
        case .critical: return "Critical"
        }
    }

    static func < (lhs: ThreatSeverity, rhs: ThreatSeverity) -> Bool {
        let order: [ThreatSeverity] = [.low, .medium, .high, .critical]
        return order.firstIndex(of: lhs) ?? 0 < order.firstIndex(of: rhs) ?? 0
    }
}

enum ThreatType: String, Codable, CaseIterable {
    case email
    case malware
    case phishing
    case spam
    case suspicious
    case other

    var displayName: String {
        switch self {
        case .email: return "Email"
        case .malware: return "Malware"
        case .phishing: return "Phishing"
        case .spam: return "Spam"
        case .suspicious: return "Suspicious"
        case .other: return "Other"
        }
    }
}

struct Threat: Codable, Identifiable {
    let id: String
    let type: ThreatType
    let severity: ThreatSeverity
    let title: String
    let description: String
    let indicators: [String]
    let timestamp: Date
    let detectionMethod: String
    let source: String?
    let cacheKey: String?

    var isBlockable: Bool {
        severity >= .high
    }

    var riskScore: Double {
        switch severity {
        case .low: return 0.25
        case .medium: return 0.5
        case .high: return 0.75
        case .critical: return 1.0
        }
    }

    var formattedTime: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}

// MARK: - Scan Result

enum ScanStatus: String, Codable {
    case pending
    case scanning
    case complete
    case failed
    case cancelled

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .scanning: return "Scanning..."
        case .complete: return "Complete"
        case .failed: return "Failed"
        case .cancelled: return "Cancelled"
        }
    }

    var isActive: Bool {
        self == .pending || self == .scanning
    }
}

struct ScanResult: Codable, Identifiable {
    let id: String
    let userId: String
    let scanType: String // "email" or "file"
    let status: ScanStatus
    let threats: [Threat]
    let timestamp: Date
    let duration: Int // Milliseconds
    let cacheKey: String?
    let metadata: ScanMetadata

    var threatCount: Int {
        threats.count
    }

    var criticalCount: Int {
        threats.filter { $0.severity == .critical }.count
    }

    var highCount: Int {
        threats.filter { $0.severity == .high }.count
    }

    var topSeverity: ThreatSeverity? {
        threats.map { $0.severity }.max()
    }

    var durationFormatted: String {
        let seconds = duration / 1000
        if seconds < 60 {
            return "\(seconds)s"
        }
        let minutes = seconds / 60
        return "\(minutes)m \(seconds % 60)s"
    }

    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }

    var isExpired: Bool {
        let expirationDate = timestamp.addingTimeInterval(30 * 24 * 60 * 60) // 30 days
        return Date() > expirationDate
    }
}

struct ScanMetadata: Codable {
    let appVersion: String
    let osVersion: String
    let deviceModel: String
    var customData: [String: String]?
}

// MARK: - Email Analysis

struct EmailAnalysis: Codable, Identifiable {
    let id: String
    let emailAddress: String
    let senderDomain: String
    let spfStatus: String
    let dkimStatus: String
    let dmarcStatus: String
    let suspiciousLinks: [String]
    let attachments: [EmailAttachment]
    let threats: [Threat]

    var isSpamLikely: Bool {
        spfStatus == "fail" || dkimStatus == "fail"
    }

    var attachmentThreats: [Threat] {
        threats.filter { $0.type == .malware }
    }
}

struct EmailAttachment: Codable, Identifiable {
    let id: String
    let filename: String
    let size: Int64
    let mimeType: String
    let hash: String
    let isThreatened: Bool
}

// MARK: - File Analysis

struct FileAnalysis: Codable, Identifiable {
    let id: String
    let fileName: String
    let fileSize: Int64
    let fileType: String
    let fileHash: String
    let scanEngine: String
    let virusName: String?
    let malwareType: String?
    let threats: [Threat]

    var isClean: Bool {
        threats.isEmpty
    }

    var fileSizeFormatted: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: fileSize)
    }
}

// MARK: - BetterBot Chat Message

struct ChatMessage: Codable, Identifiable {
    let id: String
    let role: MessageRole
    let content: String
    let timestamp: Date
    let metadata: MessageMetadata?

    enum MessageRole: String, Codable {
        case user
        case assistant
    }

    var isFromUser: Bool {
        role == .user
    }
}

struct MessageMetadata: Codable {
    var threatReference: String?
    var actionSuggested: String?
    var customData: [String: String]?
}

// MARK: - Dashboard Analytics

struct DashboardStats: Codable {
    let totalThreats: Int
    let criticalThreats: Int
    let highThreats: Int
    let scansToday: Int
    let lastScanTime: Date?
    let cleanScans: Int
    let successRate: Double

    var threatTrend: [Int] // Last 7 days
    var scanTrend: [Int] // Last 7 days

    var successRateFormatted: String {
        String(format: "%.1f%%", successRate * 100)
    }
}

// MARK: - Offline Sync Queue

struct OfflineScanQueueItem: Codable, Identifiable {
    let id: String
    let scanData: Data
    let status: QueueStatus
    let createdAt: Date
    var retryCount: Int

    enum QueueStatus: String, Codable {
        case pending
        case synced
        case failed
    }

    var canRetry: Bool {
        status == .pending || (status == .failed && retryCount < 3)
    }
}
