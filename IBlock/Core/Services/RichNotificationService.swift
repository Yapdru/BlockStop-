import Foundation
import UserNotifications
import Combine

/// Advanced notification system with rich media, custom actions, and delivery optimization
@MainActor
final class RichNotificationService: NSObject {

    // MARK: - Types

    enum NotificationType {
        case threatDetected
        case scanComplete
        case offlineAlert
        case updateAvailable
        case malwareFound
        case phishingAlert
        case systemMessage
    }

    struct RichNotification {
        let id: UUID
        let type: NotificationType
        let title: String
        let subtitle: String
        let body: String
        let imageURL: URL?
        let badge: String?
        let sound: String?
        let customActions: [NotificationAction]
        let metadata: [String: String]
        let deliveryTime: TimeInterval
        let priority: UNNotificationPriority
        let threadIdentifier: String
    }

    struct NotificationAction {
        let identifier: String
        let title: String
        let options: [UNNotificationActionOptions]
    }

    enum NotificationError: LocalizedError {
        case authorizationDenied
        case failedToSchedule
        case invalidPayload
        case mediaDownloadFailed

        var errorDescription: String? {
            switch self {
            case .authorizationDenied:
                return "User has not authorized notifications"
            case .failedToSchedule:
                return "Failed to schedule notification"
            case .invalidPayload:
                return "Invalid notification payload"
            case .mediaDownloadFailed:
                return "Failed to download notification media"
            }
        }
    }

    // MARK: - Properties

    let authorizationStatusPublisher = PassthroughSubject<UNAuthorizationStatus, Never>()
    let notificationTappedPublisher = PassthroughSubject<RichNotification, Never>()
    let notificationActionPublisher = PassthroughSubject<(notification: RichNotification, action: String), Never>()

    private var deliveredNotifications: [UUID: RichNotification] = [:]
    private var pendingNotifications: [UUID: RichNotification] = [:]

    // MARK: - Initialization

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        Task {
            await checkAuthorizationStatus()
        }
    }

    // MARK: - Authorization

    func requestAuthorization(options: UNAuthorizationOptions = [.alert, .sound, .badge]) async throws -> Bool {
        let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: options)

        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }

        await checkAuthorizationStatus()
        return granted
    }

    private func checkAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatusPublisher.send(settings.authorizationStatus)
    }

    // MARK: - Notification Scheduling

    func scheduleRichNotification(
        _ notification: RichNotification,
        triggerIn seconds: TimeInterval = 5
    ) async throws {
        // Download and attach media if needed
        var attachments: [UNNotificationAttachment] = []
        if let imageURL = notification.imageURL {
            do {
                let attachment = try await downloadMediaAttachment(from: imageURL)
                attachments.append(attachment)
            } catch {
                // Continue without media if download fails
            }
        }

        // Build notification content
        let content = UNMutableNotificationContent()
        content.title = notification.title
        content.subtitle = notification.subtitle
        content.body = notification.body
        content.badge = NSNumber(value: Int(notification.badge ?? "1") ?? 1)
        content.sound = notification.sound.map { UNNotificationSound(named: UNNotificationSoundName($0)) }
        content.threadIdentifier = notification.threadIdentifier
        content.userInfo = notification.metadata.merging(["notificationId": notification.id.uuidString]) { _, new in new }
        content.attachments = attachments

        // Add custom actions
        let actions = notification.customActions.map { action in
            UNNotificationAction(
                identifier: action.identifier,
                title: action.title,
                options: action.options
            )
        }

        if !actions.isEmpty {
            let category = UNNotificationCategory(
                identifier: "THREAT_CATEGORY_\(notification.id)",
                actions: actions,
                intentIdentifiers: [],
                options: []
            )
            UNUserNotificationCenter.current().setNotificationCategories([category])
            content.categoryIdentifier = "THREAT_CATEGORY_\(notification.id)"
        }

        // Schedule notification
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: notification.deliveryTime, repeats: false)
        let request = UNNotificationRequest(identifier: notification.id.uuidString, content: content, trigger: trigger)

        try await UNUserNotificationCenter.current().add(request)
        pendingNotifications[notification.id] = notification
    }

    func scheduleImmediateNotification(
        title: String,
        subtitle: String,
        body: String,
        type: NotificationType = .systemMessage,
        badge: String? = nil
    ) async throws {
        let notification = RichNotification(
            id: UUID(),
            type: type,
            title: title,
            subtitle: subtitle,
            body: body,
            imageURL: nil,
            badge: badge,
            sound: "default",
            customActions: [],
            metadata: [:],
            deliveryTime: 0.1,
            priority: .high,
            threadIdentifier: "blockstop-alerts"
        )

        try await scheduleRichNotification(notification, triggerIn: 0.1)
    }

    // MARK: - Notification Management

    func getPendingNotifications() -> [RichNotification] {
        Array(pendingNotifications.values)
    }

    func getDeliveredNotifications() -> [RichNotification] {
        Array(deliveredNotifications.values)
    }

    func removeNotification(_ id: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id.uuidString])
        pendingNotifications.removeValue(forKey: id)
        deliveredNotifications.removeValue(forKey: id)
    }

    func removeAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        pendingNotifications.removeAll()
        deliveredNotifications.removeAll()
    }

    // MARK: - Media Handling

    private func downloadMediaAttachment(from url: URL) async throws -> UNNotificationAttachment {
        let data = try Data(contentsOf: url)
        let fileManager = FileManager.default
        let tempDirectory = fileManager.temporaryDirectory
        let fileName = url.lastPathComponent
        let fileURL = tempDirectory.appendingPathComponent(fileName)

        try data.write(to: fileURL)

        return try UNNotificationAttachment(identifier: UUID().uuidString, url: fileURL, options: nil)
    }

    // MARK: - Threat Notifications

    func notifyThreatDetected(
        threatName: String,
        severity: String,
        source: String,
        timestamp: Date
    ) async throws {
        let detailText = "Detected: \(threatName) (\(severity)) from \(source)"
        try await scheduleImmediateNotification(
            title: "Security Threat Detected",
            subtitle: severity.uppercased(),
            body: detailText,
            type: .threatDetected,
            badge: "1"
        )
    }

    func notifyMalwareFound(
        fileName: String,
        detectionRate: Int
    ) async throws {
        let detailText = "Malware detected in \(fileName) - \(detectionRate)% detection rate"
        try await scheduleImmediateNotification(
            title: "Malware Detected",
            subtitle: "Action Required",
            body: detailText,
            type: .malwareFound,
            badge: "1"
        )
    }

    func notifyScanComplete(
        scannedItems: Int,
        threatsFound: Int
    ) async throws {
        let detailText = "Scanned \(scannedItems) items, \(threatsFound) threats found"
        try await scheduleImmediateNotification(
            title: "Scan Complete",
            subtitle: "Results ready",
            body: detailText,
            type: .scanComplete,
            badge: threatsFound > 0 ? String(threatsFound) : nil
        )
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension RichNotificationService: UNUserNotificationCenterDelegate {

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notifications even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        if let notificationIdString = userInfo["notificationId"] as? String,
           let notificationId = UUID(uuidString: notificationIdString) {

            Task { @MainActor in
                if let notification = self.pendingNotifications[notificationId] {
                    if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                        self.notificationTappedPublisher.send(notification)
                    } else {
                        self.notificationActionPublisher.send((notification: notification, action: response.actionIdentifier))
                    }

                    self.deliveredNotifications[notificationId] = notification
                    self.pendingNotifications.removeValue(forKey: notificationId)
                }
            }
        }

        completionHandler()
    }
}
