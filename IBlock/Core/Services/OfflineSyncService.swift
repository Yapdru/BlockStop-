import Foundation
import Combine

/// Manages offline data synchronization with conflict resolution
/// Implements CRDT (Conflict-free Replicated Data Type) principles
actor OfflineSyncService {

    // MARK: - Types

    struct SyncMetadata: Codable, Equatable {
        let id: String
        let lastModified: Date
        let version: Int
        let deviceId: String
        let isSynced: Bool

        var clock: VectorClock

        mutating func markAsSynced() {
            self.isSynced = true
        }
    }

    struct VectorClock: Codable, Equatable {
        var timestamps: [String: Int]

        mutating func increment(for deviceId: String) {
            timestamps[deviceId, default: 0] += 1
        }

        func happensBefore(_ other: VectorClock) -> Bool {
            guard !timestamps.isEmpty && !other.timestamps.isEmpty else {
                return timestamps.count < other.timestamps.count
            }

            var isLess = false
            for (key, value) in timestamps {
                let otherValue = other.timestamps[key] ?? 0
                if value > otherValue {
                    return false
                }
                if value < otherValue {
                    isLess = true
                }
            }
            return isLess
        }

        func concurrent(with other: VectorClock) -> Bool {
            !happensBefore(other) && !other.happensBefore(self)
        }
    }

    struct ConflictResolution {
        let sourceId: String
        let targetId: String
        let resolution: ResolutionStrategy
        let timestamp: Date

        enum ResolutionStrategy {
            case lastWrite
            case latestVersion
            case merge
            case custom(String)
        }
    }

    // MARK: - Properties

    private let deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
    private var syncQueue: [UUID] = []
    private var conflictLog: [ConflictResolution] = []
    private var pendingChanges: [String: SyncMetadata] = [:]

    nonisolated let syncStatusPublisher = PassthroughSubject<SyncStatus, Never>()
    nonisolated let conflictDetectedPublisher = PassthroughSubject<ConflictEvent, Never>()

    enum SyncStatus {
        case idle
        case syncing(progress: Double)
        case completed
        case failed(Error)
    }

    struct ConflictEvent {
        let id: String
        let localVersion: Int
        let remoteVersion: Int
        let timestamp: Date
    }

    // MARK: - Initialization

    nonisolated init() {
        // Restore pending changes from persistent storage
    }

    // MARK: - Sync Operations

    func synchronize(
        localData: [String: Any],
        remoteData: [String: Any]
    ) async throws -> [String: Any] {
        await syncStatusPublisher.send(.syncing(progress: 0.0))

        defer {
            syncStatusPublisher.send(.idle)
        }

        var result = localData
        var conflicts: [ConflictEvent] = []

        for (key, remoteValue) in remoteData {
            if let localValue = localData[key] {
                let (resolved, hasConflict) = await resolveConflict(
                    key: key,
                    local: localValue,
                    remote: remoteValue
                )

                if hasConflict {
                    conflicts.append(ConflictEvent(
                        id: key,
                        localVersion: extractVersion(from: localValue),
                        remoteVersion: extractVersion(from: remoteValue),
                        timestamp: Date()
                    ))
                }

                result[key] = resolved
            } else {
                result[key] = remoteValue
            }
        }

        // Notify about conflicts
        for conflict in conflicts {
            conflictDetectedPublisher.send(conflict)
        }

        // Mark as synced
        for key in result.keys {
            pendingChanges[key]?.markAsSynced()
        }

        return result
    }

    func queueChange<T: Codable>(_ change: T, for key: String) async {
        let metadata = SyncMetadata(
            id: key,
            lastModified: Date(),
            version: (pendingChanges[key]?.version ?? 0) + 1,
            deviceId: deviceId,
            isSynced: false,
            clock: VectorClock(timestamps: [deviceId: 1])
        )

        pendingChanges[key] = metadata

        // Persist change for offline availability
        try? await persistChange(change, with: metadata)
    }

    func getPendingChanges() -> [String: SyncMetadata] {
        pendingChanges
    }

    func clearSyncedChanges() {
        pendingChanges = pendingChanges.filter { !$0.value.isSynced }
    }

    // MARK: - Conflict Resolution

    private func resolveConflict(
        key: String,
        local: Any,
        remote: Any
    ) -> (resolved: Any, hasConflict: Bool) {
        let localVersion = extractVersion(from: local)
        let remoteVersion = extractVersion(from: remote)

        if localVersion == remoteVersion {
            return (local, false)
        }

        if remoteVersion > localVersion {
            return (remote, true)
        }

        return (local, true)
    }

    private func extractVersion(from value: Any) -> Int {
        if let dict = value as? [String: Any],
           let version = dict["version"] as? Int {
            return version
        }
        return 0
    }

    private func persistChange<T: Codable>(_ change: T, with metadata: SyncMetadata) async throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(change)
        let defaults = UserDefaults.standard
        defaults.set(data, forKey: "sync_\(metadata.id)")
    }
}

// MARK: - UIDevice Extension

extension UIDevice {
    nonisolated var identifierForVendor: UUID? {
        UIDevice.current.identifierForVendor
    }
}
