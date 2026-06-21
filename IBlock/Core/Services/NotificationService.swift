import Foundation
import UserNotifications
import UIKit

/// Manages local and remote push notifications
/// Handles threat alerts and scan completions with haptic feedback
class NotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {

    // MARK: - Published Properties
    @Published var isAuthorized = false
    @Published var notificationSettings: UNNotificationSettings?
    @Published var lastError: AppError?

    // MARK: - Private Properties
    private let notificationCenter = UNUserNotificationCenter.current()

    // MARK: - Initialization

    override init() {
        super.init()
        notificationCenter.delegate = self
        checkAuthorizationStatus()
    }

    // MARK: - Authorization

    /// Request notification permissions from user
    func requestAuthorization() async throws {
        do {
            let granted = try await notificationCenter.requestAuthorization(
                options: [.alert, .sound, .badge]
            )

            DispatchQueue.main.async {
                self.isAuthorized = granted
            }

            if granted {
                Logger.info("Notification authorization granted")
            } else {
                Logger.warning("Notification authorization denied")
            }

        } catch {
            lastError = .apiError("Failed to request notification permission")
            Logger.error("Notification authorization error: \(error)")
            throw lastError!
        }
    }

    /// Check current authorization status
    func checkAuthorizationStatus() {
        notificationCenter.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.notificationSettings = settings
                self?.isAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }

    // MARK: - Threat Detection Notifications

    /// Send notification when threat is detected
    func sendThreatDetectedNotification(_ threat: Threat) throws {
        guard isAuthorized else {
            throw AppError.apiError("Notifications not authorized")
        }

        let content = UNMutableNotificationContent()
        content.title = "Threat Detected!"
        content.body = "\(threat.severity.displayName): \(threat.title)"
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber + 1)
        content.sound = .default
        content.badge = NSNumber(value: 1)

        // Add category for custom actions
        content.categoryIdentifier = "THREAT_DETECTED"

        // Custom data
        content.userInfo = [
            "threatId": threat.id,
            "threatType": threat.type.rawValue,
            "severity": threat.severity.rawValue
        ]

        // Color coding based on severity
        let color = threat.severity.color
        content.userInfo["color"] = color

        // Haptic feedback
        triggerHapticFeedback(for: threat.severity)

        // Send notification
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: threat.id, content: content, trigger: trigger)

        notificationCenter.add(request) { error in
            if let error = error {
                Logger.error("Failed to schedule threat notification: \(error)")
            } else {
                Logger.info("Threat notification scheduled for \(threat.title)")
            }
        }
    }

    /// Send notification when scan completes
    func sendScanCompletedNotification(
        _ result: ScanResult,
        threatCount: Int,
        criticalCount: Int
    ) throws {
        guard isAuthorized else {
            throw AppError.apiError("Notifications not authorized")
        }

        let content = UNMutableNotificationContent()
        content.title = "Scan Complete"

        if threatCount == 0 {
            content.body = "Your scan is complete. No threats found."
            content.sound = .default
        } else if criticalCount > 0 {
            content.body = "⚠️ \(criticalCount) critical threat\(criticalCount > 1 ? "s" : "") detected"
            content.sound = .default
        } else {
            content.body = "\(threatCount) threat\(threatCount > 1 ? "s" : "") found"
            content.sound = .default
        }

        content.badge = NSNumber(value: threatCount)
        content.categoryIdentifier = "SCAN_COMPLETE"
        content.userInfo = [
            "scanId": result.id,
            "threatCount": threatCount,
            "criticalCount": criticalCount
        ]

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: result.id, content: content, trigger: trigger)

        notificationCenter.add(request) { error in
            if let error = error {
                Logger.error("Failed to schedule scan completion notification: \(error)")
            } else {
                Logger.info("Scan completion notification scheduled")
            }
        }
    }

    /// Send silent notification for background updates
    func sendSilentNotification(for threatId: String) throws {
        let content = UNMutableNotificationContent()
        content.userInfo = ["threatId": threatId]
        content.badge = NSNumber(value: UIApplication.shared.applicationIconBadgeNumber)

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "silent_\(threatId)", content: content, trigger: trigger)

        notificationCenter.add(request) { error in
            if let error = error {
                Logger.error("Failed to schedule silent notification: \(error)")
            }
        }
    }

    // MARK: - Haptic Feedback

    /// Trigger haptic feedback based on threat severity
    private func triggerHapticFeedback(for severity: ThreatSeverity) {
        switch severity {
        case .critical:
            // Critical: Strong vibration pattern
            let generator = UIImpactFeedbackGenerator(style: .heavy)
            generator.impactOccurred()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                generator.impactOccurred()
            }

        case .high:
            // High: Medium vibration
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

        case .medium:
            // Medium: Light vibration
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()

        case .low:
            // Low: Success feedback (subtle)
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.warning)
        }
    }

    // MARK: - Notification Categories

    /// Setup notification categories and actions
    func setupNotificationCategories() {
        // Threat detected actions
        let blockAction = UNNotificationAction(
            identifier: "BLOCK_THREAT",
            title: "Block",
            options: [.authenticationRequired]
        )
        let viewAction = UNNotificationAction(
            identifier: "VIEW_THREAT",
            title: "View Details",
            options: [.foreground]
        )
        let threatCategory = UNNotificationCategory(
            identifier: "THREAT_DETECTED",
            actions: [blockAction, viewAction],
            intentIdentifiers: [],
            options: []
        )

        // Scan complete actions
        let reviewAction = UNNotificationAction(
            identifier: "REVIEW_SCAN",
            title: "Review",
            options: [.foreground]
        )
        let scanCategory = UNNotificationCategory(
            identifier: "SCAN_COMPLETE",
            actions: [reviewAction],
            intentIdentifiers: [],
            options: []
        )

        notificationCenter.setNotificationCategories([threatCategory, scanCategory])
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo

        Logger.debug("Notification received in foreground: \(userInfo)")

        // Show notification even when app is active
        completionHandler([.banner, .sound, .badge])
    }

    /// Handle notification action when user taps notification
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let actionIdentifier = response.actionIdentifier

        Logger.debug("Notification action: \(actionIdentifier)")

        switch actionIdentifier {
        case "BLOCK_THREAT":
            if let threatId = userInfo["threatId"] as? String {
                handleBlockThreat(threatId)
            }

        case "VIEW_THREAT":
            if let threatId = userInfo["threatId"] as? String {
                handleViewThreat(threatId)
            }

        case "REVIEW_SCAN":
            if let scanId = userInfo["scanId"] as? String {
                handleReviewScan(scanId)
            }

        case UNNotificationDefaultActionIdentifier:
            // User tapped on notification
            if let threatId = userInfo["threatId"] as? String {
                handleViewThreat(threatId)
            } else if let scanId = userInfo["scanId"] as? String {
                handleReviewScan(scanId)
            }

        default:
            break
        }

        completionHandler()
    }

    // MARK: - Notification Handling

    private func handleBlockThreat(_ threatId: String) {
        Logger.info("User tapped 'Block' for threat \(threatId)")
        // Post notification to be handled by ViewController/SwiftUI
        NotificationCenter.default.post(name: NSNotification.Name("blockThreat"), object: threatId)
    }

    private func handleViewThreat(_ threatId: String) {
        Logger.info("User tapped to view threat \(threatId)")
        NotificationCenter.default.post(name: NSNotification.Name("viewThreat"), object: threatId)
    }

    private func handleReviewScan(_ scanId: String) {
        Logger.info("User tapped to review scan \(scanId)")
        NotificationCenter.default.post(name: NSNotification.Name("reviewScan"), object: scanId)
    }

    // MARK: - Badge Management

    /// Update app icon badge
    func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }

        Logger.debug("Badge updated to \(count)")
    }

    /// Clear app icon badge
    func clearBadge() {
        updateBadgeCount(0)
    }

    // MARK: - Permission Prompts

    /// Open settings for notification permissions
    func openNotificationSettings() {
        guard let settingsURL = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(settingsURL)
    }
}

// MARK: - Notification Extensions

extension Notification.Name {
    static let blockThreatAction = Notification.Name("blockThreat")
    static let viewThreatAction = Notification.Name("viewThreat")
    static let reviewScanAction = Notification.Name("reviewScan")
}
