import Foundation
import Combine

/// Comprehensive performance monitoring for memory, battery, CPU, and app lifecycle
@MainActor
final class PerformanceMonitorService: ObservableObject {

    // MARK: - Types

    struct PerformanceMetrics: Equatable, Identifiable {
        let id: UUID
        let timestamp: Date
        let memoryUsage: MemoryMetrics
        let batteryStatus: BatteryMetrics
        let cpuUsage: Double
        let thermalState: ProcessInfo.ThermalState
        let frameDropRate: Double

        var summaryScore: Double {
            let memoryScore = 1.0 - min(memoryUsage.usagePercentage / 100.0, 1.0)
            let batteryScore = batteryStatus.level / 100.0
            let cpuScore = 1.0 - min(cpuUsage / 100.0, 1.0)
            let thermalScore: Double = {
                switch thermalState {
                case .critical: return 0.0
                case .serious: return 0.3
                case .nominal: return 1.0
                case .critical: return 0.0
                @unknown default: return 0.5
                }
            }()

            return (memoryScore + batteryScore + cpuScore + thermalScore) / 4.0
        }

        var isOptimal: Bool {
            summaryScore >= 0.7 && thermalState == .nominal && frameDropRate < 5.0
        }
    }

    struct MemoryMetrics: Equatable {
        let usageInMB: Double
        let usagePercentage: Double
        let availableMB: Double
        let totalMB: Double
    }

    struct BatteryMetrics: Equatable {
        let level: Double
        let state: UIDevice.BatteryState
        let isLowPowerModeEnabled: Bool
    }

    // MARK: - Properties

    @Published var currentMetrics: PerformanceMetrics?
    @Published var isMonitoring = false
    @Published var thermalState: ProcessInfo.ThermalState = .nominal

    private var monitoringTask: Task<Void, Never>?
    private var displayLink: CADisplayLink?
    private var metricsHistory: [PerformanceMetrics] = []
    private var frameCounter = 0
    private var lastFrameTime: CFTimeInterval = 0

    let metricsUpdatedPublisher = PassthroughSubject<PerformanceMetrics, Never>()
    let thermalWarningPublisher = PassthroughSubject<ProcessInfo.ThermalState, Never>()
    let lowMemoryWarningPublisher = PassthroughSubject<MemoryMetrics, Never>()
    let batteryWarningPublisher = PassthroughSubject<BatteryMetrics, Never>()

    // MARK: - Initialization

    init() {
        setupBatteryMonitoring()
        setupThermalStateMonitoring()
    }

    // MARK: - Monitoring

    func startMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring = true

        monitoringTask = Task {
            while !Task.isCancelled {
                let metrics = captureMetrics()
                await MainActor.run {
                    self.currentMetrics = metrics
                    self.metricsHistory.append(metrics)

                    // Keep only last 100 metrics
                    if self.metricsHistory.count > 100 {
                        self.metricsHistory.removeFirst()
                    }

                    self.metricsUpdatedPublisher.send(metrics)

                    // Check for warnings
                    self.checkForWarnings(metrics)
                }

                try? await Task.sleep(for: .seconds(1))
            }
        }

        startFrameRateMonitoring()
    }

    func stopMonitoring() {
        guard isMonitoring else { return }
        isMonitoring = false

        monitoringTask?.cancel()
        monitoringTask = nil

        if let displayLink = displayLink {
            displayLink.invalidate()
            self.displayLink = nil
        }
    }

    // MARK: - Metrics Capture

    private func captureMetrics() -> PerformanceMetrics {
        let memoryMetrics = captureMemoryMetrics()
        let batteryMetrics = captureBatteryMetrics()
        let cpuUsage = estimateCPUUsage()
        let frameDropRate = calculateFrameDropRate()

        return PerformanceMetrics(
            id: UUID(),
            timestamp: Date(),
            memoryUsage: memoryMetrics,
            batteryStatus: batteryMetrics,
            cpuUsage: cpuUsage,
            thermalState: ProcessInfo.processInfo.thermalState,
            frameDropRate: frameDropRate
        )
    }

    private func captureMemoryMetrics() -> MemoryMetrics {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<task_vm_info>.size)/4

        let kerr = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(
                    mach_task_self_,
                    task_flavor_t(TASK_VM_INFO),
                    $0,
                    &count
                )
            }
        }

        guard kerr == KERN_SUCCESS else {
            return MemoryMetrics(usageInMB: 0, usagePercentage: 0, availableMB: 0, totalMB: 0)
        }

        let usedMemory = Double(info.phys_footprint) / 1024 / 1024
        let totalMemory = Double(ProcessInfo.processInfo.physicalMemory) / 1024 / 1024
        let availableMemory = totalMemory - usedMemory

        return MemoryMetrics(
            usageInMB: usedMemory,
            usagePercentage: (usedMemory / totalMemory) * 100,
            availableMB: availableMemory,
            totalMB: totalMemory
        )
    }

    private func captureBatteryMetrics() -> BatteryMetrics {
        UIDevice.current.isBatteryMonitoringEnabled = true
        return BatteryMetrics(
            level: Double(UIDevice.current.batteryLevel) * 100,
            state: UIDevice.current.batteryState,
            isLowPowerModeEnabled: ProcessInfo.processInfo.isLowPowerModeEnabled
        )
    }

    private func estimateCPUUsage() -> Double {
        var kr: kern_return_t
        var ths: thread_act_array_t?
        var thsCnt: mach_msg_type_number_t = 0

        kr = task_threads(mach_task_self_, &ths, &thsCnt)
        guard kr == KERN_SUCCESS, let threads = ths else { return 0 }

        defer {
            vm_deallocate(mach_task_self_, vm_address_t(bitPattern: threads), vm_size_t(Int(thsCnt) * MemoryLayout<thread_act_t>.size))
        }

        var totalTime: Double = 0
        for i in 0..<Int(thsCnt) {
            var threadInfo = thread_basic_info_data_t()
            var threadCount = mach_msg_type_number_t(THREAD_INFO_MAX)

            kr = thread_info(
                threads[i],
                thread_flavor_t(THREAD_BASIC_INFO),
                &threadInfo,
                &threadCount
            )

            guard kr == KERN_SUCCESS else { continue }
            totalTime += Double(threadInfo.cpu_usage) / Double(TH_USAGE_SCALE)
        }

        return min(totalTime * 100 / Double(thsCnt), 100.0)
    }

    // MARK: - Frame Rate Monitoring

    private func startFrameRateMonitoring() {
        displayLink = CADisplayLink(
            target: self,
            selector: #selector(updateFrameRate)
        )
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func updateFrameRate(displayLink: CADisplayLink) {
        frameCounter += 1
        lastFrameTime = displayLink.timestamp
    }

    private func calculateFrameDropRate() -> Double {
        let expectedFrames = Int(lastFrameTime * 60) + 1
        let droppedFrames = max(0, expectedFrames - frameCounter)
        let dropRate = Double(droppedFrames) / Double(max(1, expectedFrames)) * 100
        return min(dropRate, 100.0)
    }

    // MARK: - Warnings

    private func checkForWarnings(_ metrics: PerformanceMetrics) {
        if metrics.memoryUsage.usagePercentage > 80 {
            lowMemoryWarningPublisher.send(metrics.memoryUsage)
        }

        if metrics.batteryStatus.level < 20 {
            batteryWarningPublisher.send(metrics.batteryStatus)
        }

        if metrics.thermalState != thermalState {
            thermalState = metrics.thermalState
            if metrics.thermalState != .nominal {
                thermalWarningPublisher.send(metrics.thermalState)
            }
        }
    }

    // MARK: - Monitoring Setup

    private func setupBatteryMonitoring() {
        UIDevice.current.isBatteryMonitoringEnabled = true
    }

    private func setupThermalStateMonitoring() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleThermalStateChange),
            name: ProcessInfo.thermalStateDidChangeNotification,
            object: nil
        )
    }

    @objc private func handleThermalStateChange() {
        let newState = ProcessInfo.processInfo.thermalState
        thermalWarningPublisher.send(newState)
    }

    // MARK: - Analytics

    func getAverageMetrics() -> PerformanceMetrics? {
        guard !metricsHistory.isEmpty else { return nil }

        let avgMemory = metricsHistory.map { $0.memoryUsage.usagePercentage }.reduce(0, +) / Double(metricsHistory.count)
        let avgBattery = metricsHistory.map { $0.batteryStatus.level }.reduce(0, +) / Double(metricsHistory.count)
        let avgCPU = metricsHistory.map { $0.cpuUsage }.reduce(0, +) / Double(metricsHistory.count)
        let avgFrameDrop = metricsHistory.map { $0.frameDropRate }.reduce(0, +) / Double(metricsHistory.count)

        let memoryMetrics = MemoryMetrics(
            usageInMB: metricsHistory.first?.memoryUsage.usageInMB ?? 0,
            usagePercentage: avgMemory,
            availableMB: metricsHistory.first?.memoryUsage.availableMB ?? 0,
            totalMB: metricsHistory.first?.memoryUsage.totalMB ?? 0
        )

        let batteryMetrics = BatteryMetrics(
            level: avgBattery,
            state: .unknown,
            isLowPowerModeEnabled: ProcessInfo.processInfo.isLowPowerModeEnabled
        )

        return PerformanceMetrics(
            id: UUID(),
            timestamp: Date(),
            memoryUsage: memoryMetrics,
            batteryStatus: batteryMetrics,
            cpuUsage: avgCPU,
            thermalState: ProcessInfo.processInfo.thermalState,
            frameDropRate: avgFrameDrop
        )
    }

    deinit {
        stopMonitoring()
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - Task.sleep Extension

extension Task where Failure == Error {
    fileprivate static func sleep(for duration: Duration) async throws {
        let nanoseconds = duration.components.seconds * 1_000_000_000 + Int64(duration.components.attoseconds / 1_000_000_000)
        try await Task.sleep(nanoseconds: nanoseconds)
    }
}
