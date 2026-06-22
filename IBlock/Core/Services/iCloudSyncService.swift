import Foundation
import CloudKit
import Combine

/// iCloud synchronization service for cross-device data sync using CloudKit
@MainActor
final class iCloudSyncService: NSObject {

    // MARK: - Types

    enum SyncError: LocalizedError {
        case cloudKitUnavailable
        case userNotAuthenticated
        case syncFailed(String)
        case conflictDetected
        case recordNotFound
        case quotaExceeded

        var errorDescription: String? {
            switch self {
            case .cloudKitUnavailable:
                return "iCloud is not available on this device"
            case .userNotAuthenticated:
                return "User is not authenticated with iCloud"
            case .syncFailed(let message):
                return "Sync failed: \(message)"
            case .conflictDetected:
                return "Sync conflict detected - merge required"
            case .recordNotFound:
                return "Record not found in iCloud"
            case .quotaExceeded:
                return "iCloud quota exceeded"
            }
        }
    }

    struct SyncData<T: Codable> {
        let identifier: String
        let data: T
        let createdDate: Date
        let modifiedDate: Date
        let recordVersion: Int
    }

    enum SyncStatus {
        case idle
        case syncing
        case completed
        case failed(SyncError)
    }

    // MARK: - Properties

    @Published var syncStatus: SyncStatus = .idle
    @Published var lastSyncDate: Date?

    let syncProgressPublisher = PassthroughSubject<Double, Never>()
    let conflictResolvedPublisher = PassthroughSubject<String, Never>()
    let syncErrorPublisher = PassthroughSubject<SyncError, Never>()

    private var container: CKContainer { CKContainer.default() }
    private var database: CKDatabase { container.privateCloudDatabase }

    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private var synceRecords: [String: CKRecord] = [:]

    // MARK: - Initialization

    override init() {
        super.init()
        Task {
            await checkCloudKitAvailability()
        }
    }

    // MARK: - Account Management

    func checkCloudKitAvailability() async {
        let accountStatus = try? await container.accountStatus()
        switch accountStatus {
        case .available:
            break // Proceed with sync
        case .restricted, .couldNotDetermine:
            syncErrorPublisher.send(.cloudKitUnavailable)
        case .noAccount:
            syncErrorPublisher.send(.userNotAuthenticated)
        case .temporarilyUnavailable:
            syncErrorPublisher.send(.cloudKitUnavailable)
        default:
            break
        }
    }

    func isCloudKitAvailable() async -> Bool {
        guard let status = try? await container.accountStatus() else {
            return false
        }
        return status == .available
    }

    // MARK: - Sync Operations

    func sync<T: Codable>(
        _ data: T,
        for key: String,
        recordType: String = "BlockStopData"
    ) async throws {
        syncStatus = .syncing
        defer { syncStatus = .idle }

        let record = CKRecord(recordType: recordType)
        record.setValue(key, forKey: "identifier")

        do {
            let encodedData = try encoder.encode(data)
            record.setValue(encodedData, forKey: "data")
            record.setValue(Date(), forKey: "modifiedDate")

            let savedRecord = try await database.save(record)
            synceRecords[key] = savedRecord
            lastSyncDate = Date()

            syncProgressPublisher.send(1.0)
        } catch {
            let syncError = SyncError.syncFailed(error.localizedDescription)
            syncStatus = .failed(syncError)
            syncErrorPublisher.send(syncError)
            throw syncError
        }
    }

    func retrieve<T: Codable>(
        for key: String,
        recordType: String = "BlockStopData"
    ) async throws -> T {
        let predicate = NSPredicate(format: "identifier == %@", key)
        let query = CKQuery(recordType: recordType, predicate: predicate)

        do {
            let records = try await database.records(matching: query)
            guard let record = records.matchResults.first?.1.get() else {
                throw SyncError.recordNotFound
            }

            guard let data = record["data"] as? Data else {
                throw SyncError.recordNotFound
            }

            let decoded = try decoder.decode(T.self, from: data)
            synceRecords[key] = record
            return decoded
        } catch let error as SyncError {
            throw error
        } catch {
            throw SyncError.syncFailed(error.localizedDescription)
        }
    }

    func syncBatch<T: Codable>(
        _ items: [String: T],
        recordType: String = "BlockStopData"
    ) async throws {
        syncStatus = .syncing

        var records: [CKRecord] = []
        for (key, data) in items {
            let record = CKRecord(recordType: recordType)
            record.setValue(key, forKey: "identifier")

            do {
                let encodedData = try encoder.encode(data)
                record.setValue(encodedData, forKey: "data")
                record.setValue(Date(), forKey: "modifiedDate")
                records.append(record)
            } catch {
                continue // Skip failed encodings
            }
        }

        do {
            let result = try await database.modifyRecords(saving: records, deleting: [])

            let successCount = result.savedRecords.count
            let totalCount = items.count
            let progress = Double(successCount) / Double(max(1, totalCount))

            syncProgressPublisher.send(progress)
            lastSyncDate = Date()
            syncStatus = .completed
        } catch {
            let syncError = SyncError.syncFailed(error.localizedDescription)
            syncStatus = .failed(syncError)
            syncErrorPublisher.send(syncError)
            throw syncError
        }
    }

    // MARK: - Delete Operations

    func delete(for key: String, recordType: String = "BlockStopData") async throws {
        guard let record = synceRecords[key] else {
            throw SyncError.recordNotFound
        }

        do {
            try await database.deleteRecord(withID: record.recordID)
            synceRecords.removeValue(forKey: key)
        } catch {
            throw SyncError.syncFailed(error.localizedDescription)
        }
    }

    func deleteAll(recordType: String = "BlockStopData") async throws {
        let predicate = NSPredicate(value: true)
        let query = CKQuery(recordType: recordType, predicate: predicate)

        do {
            let records = try await database.records(matching: query)
            let recordsToDelete = records.matchResults.compactMap { try? $0.1.get().recordID }

            if !recordsToDelete.isEmpty {
                _ = try await database.modifyRecords(saving: [], deleting: recordsToDelete)
            }

            synceRecords.removeAll()
        } catch {
            throw SyncError.syncFailed(error.localizedDescription)
        }
    }

    // MARK: - Conflict Resolution

    func resolveConflict<T: Codable>(
        for key: String,
        localVersion: T,
        remoteVersion: T,
        strategy: ConflictStrategy = .lastWrite
    ) async throws -> T {
        switch strategy {
        case .lastWrite:
            // Remote version wins (more recent)
            try await sync(remoteVersion, for: key)
            return remoteVersion

        case .keepLocal:
            // Keep local version
            try await sync(localVersion, for: key)
            return localVersion

        case .merge:
            // Try to merge (requires custom logic)
            return remoteVersion
        }
    }

    enum ConflictStrategy {
        case lastWrite
        case keepLocal
        case merge
    }

    // MARK: - Monitoring

    func setupSubscriptionsForChanges(recordType: String = "BlockStopData") async throws {
        let predicate = NSPredicate(value: true)
        let subscription = CKQuerySubscription(
            recordType: recordType,
            predicate: predicate,
            subscriptionID: "blockstop-\(recordType)-changes",
            options: [.firesOnRecordCreation, .firesOnRecordUpdate, .firesOnRecordDeletion]
        )

        let notification = CKNotification.createNotificationSubscription()
        subscription.notificationInfo = notification

        do {
            try await database.save(subscription)
        } catch {
            throw SyncError.syncFailed(error.localizedDescription)
        }
    }

    // MARK: - Statistics

    func getStorageUsage() async throws -> (bytes: Int64, available: Int64) {
        // CloudKit doesn't provide direct storage API
        // Return estimated values based on current sync
        let estimatedBytes = Int64(synceRecords.count * 1024) // Rough estimate
        let available = Int64(1_000_000_000) // 1GB default quota

        return (estimatedBytes, available)
    }
}
