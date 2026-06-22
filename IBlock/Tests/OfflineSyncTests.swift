import XCTest
@testable import IBlock

class OfflineSyncServiceTests: XCTestCase {

    var syncService: OfflineSyncService!

    override func setUp() {
        super.setUp()
        syncService = OfflineSyncService()
    }

    override func tearDown() {
        syncService = nil
        super.tearDown()
    }

    // MARK: - Synchronization Tests

    func testSynchronizeWithoutConflict() async throws {
        let localData: [String: Any] = ["user": ["version": 1, "name": "John"]]
        let remoteData: [String: Any] = ["settings": ["theme": "dark"]]

        let result = try await syncService.synchronize(
            localData: localData,
            remoteData: remoteData
        )

        XCTAssertEqual((result["user"] as? [String: Any])?["name"] as? String, "John")
        XCTAssertEqual((result["settings"] as? [String: Any])?["theme"] as? String, "dark")
    }

    func testSynchronizeWithConflict() async throws {
        let localData: [String: Any] = ["data": ["version": 2, "value": "local"]]
        let remoteData: [String: Any] = ["data": ["version": 1, "value": "remote"]]

        let result = try await syncService.synchronize(
            localData: localData,
            remoteData: remoteData
        )

        // Remote version is lower, so local should win
        XCTAssertEqual((result["data"] as? [String: Any])?["value"] as? String, "local")
    }

    // MARK: - Queue Management Tests

    func testQueueChange() async {
        await syncService.queueChange(["name": "Test"], for: "testKey")

        let pendingChanges = await syncService.getPendingChanges()
        XCTAssertTrue(pendingChanges.keys.contains("testKey"))
        XCTAssertEqual(pendingChanges["testKey"]?.isSynced, false)
    }

    func testClearSyncedChanges() async {
        await syncService.queueChange(["name": "Test"], for: "key1")
        await syncService.queueChange(["name": "Test2"], for: "key2")

        var pending = await syncService.getPendingChanges()
        XCTAssertEqual(pending.count, 2)

        await syncService.clearSyncedChanges()

        pending = await syncService.getPendingChanges()
        XCTAssertEqual(pending.count, 0)
    }

    // MARK: - Vector Clock Tests

    func testVectorClockHappensBefore() {
        let clock1 = OfflineSyncService.VectorClock(timestamps: ["device1": 1, "device2": 0])
        let clock2 = OfflineSyncService.VectorClock(timestamps: ["device1": 2, "device2": 0])

        XCTAssertTrue(clock1.happensBefore(clock2))
        XCTAssertFalse(clock2.happensBefore(clock1))
    }

    func testVectorClockConcurrency() {
        let clock1 = OfflineSyncService.VectorClock(timestamps: ["device1": 1, "device2": 0])
        let clock2 = OfflineSyncService.VectorClock(timestamps: ["device1": 0, "device2": 1])

        XCTAssertTrue(clock1.concurrent(with: clock2))
    }

    // MARK: - Performance Tests

    func testSyncPerformanceWithLargeDataset() async throws {
        var largeData: [String: Any] = [:]
        for i in 0..<1000 {
            largeData["item_\(i)"] = ["version": i, "value": "test"]
        }

        let startTime = Date()
        _ = try await syncService.synchronize(
            localData: largeData,
            remoteData: largeData
        )
        let elapsed = Date().timeIntervalSince(startTime)

        XCTAssertLessThan(elapsed, 5.0, "Sync should complete within 5 seconds")
    }
}
