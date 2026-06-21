import Foundation

/// Manages local caching of scan results and threats
/// Uses UserDefaults and in-memory cache for performance
class CacheService: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var cachedThreats: [Threat] = []
    @Published var cachedScans: [ScanResult] = []
    @Published var cacheSize: Int64 = 0

    // MARK: - Private Properties
    private let threatsKey = "blockstop_cached_threats"
    private let scansKey = "blockstop_cached_scans"
    private let lastSyncKey = "blockstop_last_sync"
    private let maxCachedScans = 100
    private let cacheExpirationDays = 30

    // MARK: - Initialization

    override init() {
        super.init()
        loadCachedData()
    }

    // MARK: - Threat Caching

    /// Cache threats to local storage
    func cacheThreats(_ threats: [Threat]) {
        do {
            let encoded = try JSONEncoder().encode(threats)
            UserDefaults.standard.set(encoded, forKey: threatsKey)
            self.cachedThreats = threats
            updateCacheSize()

            Logger.info("Cached \(threats.count) threats")
        } catch {
            Logger.error("Failed to cache threats: \(error)")
        }
    }

    /// Fetch cached threats
    func fetchCachedThreats() -> [Threat] {
        return cachedThreats
    }

    /// Fetch cached threats newer than date
    func fetchCachedThreats(newerThan date: Date) -> [Threat] {
        return cachedThreats.filter { $0.timestamp > date }
    }

    /// Delete cached threat
    func deleteThreat(_ threatId: String) {
        cachedThreats.removeAll { $0.id == threatId }
        saveCachedThreats()
    }

    // MARK: - Scan Result Caching

    /// Cache scan result
    func cacheScan(_ scan: ScanResult) {
        // Check if scan already exists
        if let index = cachedScans.firstIndex(where: { $0.id == scan.id }) {
            cachedScans[index] = scan
        } else {
            cachedScans.insert(scan, at: 0)
        }

        // Keep only recent scans
        if cachedScans.count > maxCachedScans {
            cachedScans = Array(cachedScans.prefix(maxCachedScans))
        }

        saveCachedScans()
        updateCacheSize()

        Logger.info("Cached scan \(scan.id)")
    }

    /// Fetch all cached scans
    func fetchCachedScans() -> [ScanResult] {
        return cachedScans
    }

    /// Fetch cached scans by type
    func fetchCachedScans(ofType type: String) -> [ScanResult] {
        return cachedScans.filter { $0.scanType == type }
    }

    /// Fetch cached scan by ID
    func fetchCachedScan(_ scanId: String) -> ScanResult? {
        return cachedScans.first { $0.id == scanId }
    }

    /// Check if scan is cached and valid
    func isScanCached(_ scanId: String) -> Bool {
        guard let scan = fetchCachedScan(scanId) else { return false }
        return !scan.isExpired
    }

    /// Delete cached scan
    func deleteScan(_ scanId: String) {
        cachedScans.removeAll { $0.id == scanId }
        saveCachedScans()
        updateCacheSize()
    }

    // MARK: - Cache Validation

    /// Check if cache is current (synced within last hour)
    func isCacheCurrentent() -> Bool {
        guard let lastSync = UserDefaults.standard.object(forKey: lastSyncKey) as? Date else {
            return false
        }

        let oneHourAgo = Date().addingTimeInterval(-3600)
        return lastSync > oneHourAgo
    }

    /// Mark cache as synced
    func markSynced() {
        UserDefaults.standard.set(Date(), forKey: lastSyncKey)
        Logger.debug("Cache marked as synced")
    }

    /// Get time since last sync
    func timeSinceLastSync() -> TimeInterval {
        guard let lastSync = UserDefaults.standard.object(forKey: lastSyncKey) as? Date else {
            return .infinity
        }

        return Date().timeIntervalSince(lastSync)
    }

    // MARK: - Cleanup

    /// Delete expired scans (older than 30 days)
    func cleanupExpiredScans() {
        let beforeCount = cachedScans.count

        cachedScans.removeAll { scan in
            let expirationDate = scan.timestamp.addingTimeInterval(TimeInterval(cacheExpirationDays) * 24 * 60 * 60)
            return Date() > expirationDate
        }

        if cachedScans.count < beforeCount {
            saveCachedScans()
            Logger.info("Cleaned up \(beforeCount - cachedScans.count) expired scans")
        }
    }

    /// Clear all cache
    func clearAllCache() {
        cachedThreats.removeAll()
        cachedScans.removeAll()
        UserDefaults.standard.removeObject(forKey: threatsKey)
        UserDefaults.standard.removeObject(forKey: scansKey)
        UserDefaults.standard.removeObject(forKey: lastSyncKey)
        cacheSize = 0

        Logger.info("All cache cleared")
    }

    // MARK: - Private Helpers

    private func loadCachedData() {
        // Load threats
        if let data = UserDefaults.standard.data(forKey: threatsKey),
           let decoded = try? JSONDecoder().decode([Threat].self, from: data) {
            self.cachedThreats = decoded
        }

        // Load scans
        if let data = UserDefaults.standard.data(forKey: scansKey),
           let decoded = try? JSONDecoder().decode([ScanResult].self, from: data) {
            self.cachedScans = decoded
        }

        updateCacheSize()
    }

    private func saveCachedThreats() {
        do {
            let encoded = try JSONEncoder().encode(cachedThreats)
            UserDefaults.standard.set(encoded, forKey: threatsKey)
        } catch {
            Logger.error("Failed to save cached threats: \(error)")
        }
    }

    private func saveCachedScans() {
        do {
            let encoded = try JSONEncoder().encode(cachedScans)
            UserDefaults.standard.set(encoded, forKey: scansKey)
        } catch {
            Logger.error("Failed to save cached scans: \(error)")
        }
    }

    private func updateCacheSize() {
        var size: Int64 = 0

        if let data = UserDefaults.standard.data(forKey: threatsKey) {
            size += Int64(data.count)
        }

        if let data = UserDefaults.standard.data(forKey: scansKey) {
            size += Int64(data.count)
        }

        self.cacheSize = size
    }
}
