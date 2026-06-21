import Foundation
import Combine

/// Handles all API communication with BlockStop backend
/// Manages network requests, error handling, and automatic token refresh
class APIService: NSObject, ObservableObject {

    // MARK: - Published Properties
    @Published var isLoading = false
    @Published var lastError: AppError?

    // MARK: - Private Properties
    private var session: URLSession
    private var baseURL: URL
    private let requestTimeout: TimeInterval = 30.0
    private let maxRetries = 3
    private var retryDelay = 1.0

    // MARK: - Configuration
    private struct Config {
        static let baseURL = "https://api.blockstop.app"
        static let apiVersion = "v1"
    }

    // MARK: - Initialization

    override init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.waitsForConnectivity = true

        self.session = URLSession(configuration: config)
        self.baseURL = URL(string: Config.baseURL)!
        super.init()
    }

    // MARK: - Generic Request Method

    /// Generic request method with automatic retry and error handling
    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Encodable? = nil,
        headers: [String: String] = [:]
    ) async throws -> T {
        var allHeaders = defaultHeaders
        headers.forEach { allHeaders[$0.key] = $0.value }

        let url = baseURL.appendingPathComponent("\(Config.apiVersion)\(path)")
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = requestTimeout

        for (key, value) in allHeaders {
            request.setValue(value, forHTTPHeaderField: key)
        }

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        return try await executeRequest(request: request, retryCount: 0)
    }

    /// Execute request with retry logic
    private func executeRequest<T: Decodable>(
        request: URLRequest,
        retryCount: Int
    ) async throws -> T {
        isLoading = true
        defer { isLoading = false }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AppError.invalidResponse
            }

            return try handleResponse(data: data, statusCode: httpResponse.statusCode)

        } catch let error as AppError {
            // Handle specific AppErrors
            if error.isRetryable && retryCount < maxRetries {
                Logger.warning("Request failed, retrying... (attempt \(retryCount + 1)/\(maxRetries))")
                try await Task.sleep(nanoseconds: UInt64(error.suggestedRetryDelay * 1_000_000_000))
                return try await executeRequest(request: request, retryCount: retryCount + 1)
            }

            lastError = error
            Logger.error("Request failed after \(retryCount) retries: \(error.userMessage)")
            throw error

        } catch {
            let appError = AppError.apiError(error.localizedDescription)
            lastError = appError
            Logger.error("Request error: \(appError.userMessage)")
            throw appError
        }
    }

    /// Handle HTTP response
    private func handleResponse<T: Decodable>(data: Data, statusCode: Int) throws -> T {
        switch statusCode {
        case 200...299:
            do {
                return try JSONDecoder.iblockDecoder.decode(T.self, from: data)
            } catch {
                throw AppError.decodingError(error.localizedDescription)
            }

        case 400:
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw AppError.apiError(error?.message ?? "Bad request")

        case 401:
            throw AppError.sessionExpired

        case 403:
            throw AppError.tierGatingBlocked

        case 404:
            throw AppError.dataNotFound

        case 429:
            throw AppError.networkTimeout // Rate limited

        case 500...599:
            throw AppError.httpError(statusCode)

        default:
            throw AppError.invalidResponse
        }
    }

    // MARK: - Default Headers

    private var defaultHeaders: [String: String] {
        var headers: [String: String] = [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "IBlock/1.0",
            "X-Client": "ios"
        ]

        // Add authorization header if token exists
        if let token = KeychainService.retrieve(key: KeychainService.Keys.accessToken) {
            headers["Authorization"] = "Bearer \(token)"
        }

        return headers
    }

    // MARK: - User Endpoints

    /// Fetch current user information
    func fetchUserInfo(accessToken: String? = nil) async throws -> User {
        var headers: [String: String] = [:]
        if let token = accessToken {
            headers["Authorization"] = "Bearer \(token)"
        }

        return try await request(
            path: "/user/info",
            method: "GET",
            headers: headers
        )
    }

    /// Fetch user tier information
    func fetchUserTier() async throws -> TierInfo {
        return try await request(path: "/user/tier", method: "GET")
    }

    /// Update user settings
    func updateUserSettings(_ settings: UserSettings) async throws -> User {
        return try await request(
            path: "/user/settings",
            method: "PUT",
            body: settings
        )
    }

    // MARK: - Email Scanning Endpoints

    /// Scan email address for threats
    func scanEmail(_ email: String) async throws -> ScanResult {
        let payload: [String: String] = ["email": email]

        return try await request(
            path: "/scans/email",
            method: "POST",
            body: payload
        )
    }

    /// Fetch email scan history
    func fetchEmailHistory(limit: Int = 20, offset: Int = 0) async throws -> [ScanResult] {
        let query = "?limit=\(limit)&offset=\(offset)"
        return try await request(path: "/scans/email/history\(query)", method: "GET")
    }

    /// Get detailed email analysis
    func getEmailAnalysis(scanId: String) async throws -> EmailAnalysis {
        return try await request(path: "/scans/email/\(scanId)", method: "GET")
    }

    // MARK: - File Scanning Endpoints

    /// Upload and scan file
    func uploadAndScanFile(
        fileURL: URL,
        fileName: String,
        fileSize: Int64
    ) async throws -> ScanResult {
        let data = try Data(contentsOf: fileURL)
        return try await uploadFile(data: data, fileName: fileName, fileSize: fileSize)
    }

    private func uploadFile(data: Data, fileName: String, fileSize: Int64) async throws -> ScanResult {
        let boundary = UUID().uuidString
        var body = Data()

        // Add file data to multipart
        let fileFormData = "--\(boundary)\r\nContent-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\nContent-Type: application/octet-stream\r\n\r\n"
        body.append(fileFormData.data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        let url = baseURL.appendingPathComponent("\(Config.apiVersion)/scans/file")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = requestTimeout

        // Set multipart headers
        request.setValue(
            "multipart/form-data; boundary=\(boundary)",
            forHTTPHeaderField: "Content-Type"
        )

        if let token = KeychainService.retrieve(key: KeychainService.Keys.accessToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = body

        return try await executeRequest(request: request, retryCount: 0)
    }

    /// Fetch file scan history
    func fetchFileHistory(limit: Int = 20, offset: Int = 0) async throws -> [ScanResult] {
        let query = "?limit=\(limit)&offset=\(offset)"
        return try await request(path: "/scans/file/history\(query)", method: "GET")
    }

    /// Get detailed file analysis
    func getFileAnalysis(scanId: String) async throws -> FileAnalysis {
        return try await request(path: "/scans/file/\(scanId)", method: "GET")
    }

    // MARK: - Threat Endpoints

    /// Fetch all threats
    func fetchThreats(
        severity: String? = nil,
        type: String? = nil,
        limit: Int = 50
    ) async throws -> [Threat] {
        var query = "?limit=\(limit)"
        if let severity = severity {
            query += "&severity=\(severity)"
        }
        if let type = type {
            query += "&type=\(type)"
        }

        return try await request(path: "/threats\(query)", method: "GET")
    }

    /// Fetch threat details
    func getThreatDetails(threatId: String) async throws -> Threat {
        return try await request(path: "/threats/\(threatId)", method: "GET")
    }

    /// Block threat
    func blockThreat(threatId: String) async throws -> Threat {
        return try await request(path: "/threats/\(threatId)/block", method: "POST")
    }

    // MARK: - Dashboard Endpoints

    /// Fetch dashboard statistics
    func fetchDashboardStats() async throws -> DashboardStats {
        return try await request(path: "/dashboard/stats", method: "GET")
    }

    /// Fetch analytics data (for OFFICE+ tiers)
    func fetchAnalytics(timeRange: String = "7days") async throws -> [String: Any] {
        let query = "?timeRange=\(timeRange)"
        let response: [String: AnyCodable] = try await request(path: "/analytics\(query)", method: "GET")
        return response.mapValues { $0.value }
    }

    // MARK: - BetterBot Endpoints

    /// Send message to BetterBot
    func sendBetterBotMessage(_ message: String) async throws -> ChatMessage {
        let payload: [String: String] = ["message": message]
        return try await request(
            path: "/betterbot/chat",
            method: "POST",
            body: payload
        )
    }

    /// Fetch conversation history
    func fetchChatHistory(limit: Int = 50) async throws -> [ChatMessage] {
        let query = "?limit=\(limit)"
        return try await request(path: "/betterbot/history\(query)", method: "GET")
    }

    /// Clear conversation history
    func clearChatHistory() async throws -> Void {
        return try await request(
            path: "/betterbot/history",
            method: "DELETE"
        )
    }

    // MARK: - Helper Models

    struct UserSettings: Codable {
        let notificationsEnabled: Bool?
        let biometricsEnabled: Bool?
        let theme: String?
        let language: String?
    }

    struct ErrorResponse: Decodable {
        let message: String
        let code: String?
        let details: [String: String]?
    }

    struct AnyCodable: Codable {
        let value: Any

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()

            if container.decodeNil() {
                value = NSNull()
            } else if let bool = try? container.decode(Bool.self) {
                value = bool
            } else if let int = try? container.decode(Int.self) {
                value = int
            } else if let double = try? container.decode(Double.self) {
                value = double
            } else if let string = try? container.decode(String.self) {
                value = string
            } else if let array = try? container.decode([AnyCodable].self) {
                value = array.map { $0.value }
            } else if let dict = try? container.decode([String: AnyCodable].self) {
                value = dict.mapValues { $0.value }
            } else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode AnyCodable")
            }
        }

        func encode(to encoder: Encoder) throws {
            var container = encoder.singleValueContainer()
            try container.encode(value as? [String: AnyCodable])
        }
    }
}

// MARK: - JSONDecoder Extension

extension JSONDecoder {
    static let iblockDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            guard let date = formatter.date(from: dateString) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date format")
            }
            return date
        }
        return decoder
    }()
}
