import WidgetKit
import SwiftUI

/// Home screen widget for quick threat status and scanning
struct BlockStopWidgetProvider: TimelineProvider {

    // MARK: - Types

    struct Entry: TimelineEntry {
        let date: Date
        let configuration: ConfigurationIntent
        let threatCount: Int
        let lastScanDate: Date?
        let isScanning: Bool
        let currentSummary: String
    }

    // MARK: - TimelineProvider

    func placeholder(in context: Context) -> Entry {
        Entry(
            date: Date(),
            configuration: ConfigurationIntent(),
            threatCount: 0,
            lastScanDate: nil,
            isScanning: false,
            currentSummary: "No threats"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        let entry = Entry(
            date: Date(),
            configuration: ConfigurationIntent(),
            threatCount: 0,
            lastScanDate: Date(),
            isScanning: false,
            currentSummary: "System Secure"
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        Task {
            do {
                let threatData = try await fetchThreatData()
                let entry = Entry(
                    date: Date(),
                    configuration: ConfigurationIntent(),
                    threatCount: threatData.count,
                    lastScanDate: threatData.lastScanned,
                    isScanning: false,
                    currentSummary: threatData.summary
                )

                // Refresh every 15 minutes
                let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
                let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

                completion(timeline)
            } catch {
                let errorEntry = Entry(
                    date: Date(),
                    configuration: ConfigurationIntent(),
                    threatCount: 0,
                    lastScanDate: nil,
                    isScanning: false,
                    currentSummary: "Error loading"
                )

                completion(Timeline(entries: [errorEntry], policy: .after(Date().addingTimeInterval(300))))
            }
        }
    }

    // MARK: - Private

    private func fetchThreatData() async throws -> (count: Int, lastScanned: Date?, summary: String) {
        // Simulate fetching from shared app group
        let defaults = UserDefaults(suiteName: "group.com.blockstop.iblock")
        let threatCount = defaults?.integer(forKey: "threatCount") ?? 0
        let lastScanned = defaults?.object(forKey: "lastScanDate") as? Date

        let summary = threatCount == 0 ? "System Secure" : "\(threatCount) threat(s) found"

        return (threatCount, lastScanned, summary)
    }
}

// MARK: - Widget Views

struct BlockStopWidget: Widget {
    let kind: String = "BlockStopWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: ConfigurationIntent.self,
            provider: BlockStopWidgetProvider()
        ) { entry in
            BlockStopWidgetView(entry: entry)
        }
        .configurationDisplayName("BlockStop Security")
        .description("Quick threat status and scan controls")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct BlockStopWidgetView: View {
    let entry: BlockStopWidgetProvider.Entry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.1, green: 0.1, blue: 0.2),
                        Color(red: 0.15, green: 0.15, blue: 0.25)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))

            VStack(spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("BlockStop")
                            .font(.headline)
                            .foregroundColor(.white)

                        Text(entry.currentSummary)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Image(systemName: statusIcon)
                        .font(.title2)
                        .foregroundColor(statusColor)
                }

                // Threat Counter
                if entry.threatCount > 0 {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Active Threats")
                                .font(.caption2)
                                .foregroundColor(.gray)

                            Text("\(entry.threatCount)")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                        }

                        Spacer()

                        Image(systemName: "exclamationmark.circle.fill")
                            .font(.title)
                            .foregroundColor(.red)
                    }
                } else {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Status")
                                .font(.caption2)
                                .foregroundColor(.gray)

                            Text("Secure")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }

                        Spacer()

                        Image(systemName: "checkmark.circle.fill")
                            .font(.title)
                            .foregroundColor(.green)
                    }
                }

                // Last Scan Info
                if let lastScan = entry.lastScanDate {
                    HStack {
                        Text("Last scan: \(lastScan.formatted(date: .omitted, time: .shortened))")
                            .font(.caption2)
                            .foregroundColor(.gray)

                        Spacer()
                    }
                }

                Spacer()

                // Quick Scan Button
                if !entry.isScanning {
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                            Text("Quick Scan")
                        }
                        .font(.caption)
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(6)
                    }
                } else {
                    HStack {
                        ProgressView()
                            .tint(.blue)

                        Text("Scanning...")
                            .font(.caption)
                            .foregroundColor(.gray)

                        Spacer()
                    }
                }
            }
            .padding(16)
        }
    }

    private var statusIcon: String {
        if entry.isScanning {
            return "arrow.clockwise.circle"
        }
        return entry.threatCount == 0 ? "checkmark.circle" : "exclamationmark.triangle"
    }

    private var statusColor: Color {
        if entry.isScanning {
            return .blue
        }
        return entry.threatCount == 0 ? .green : .red
    }
}

// MARK: - Lock Screen Widget

@main
struct BlockStopWidgetBundle: WidgetBundle {
    var body: some Widget {
        BlockStopWidget()
        BlockStopLockScreenWidget()
    }
}

struct BlockStopLockScreenWidget: Widget {
    let kind: String = "BlockStopLockScreenWidget"

    var body: some WidgetConfiguration {
        IntentConfiguration(
            kind: kind,
            intent: ConfigurationIntent.self,
            provider: BlockStopWidgetProvider()
        ) { entry in
            BlockStopLockScreenWidgetView(entry: entry)
        }
        .configurationDisplayName("BlockStop Status")
        .description("Security status on lock screen")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

struct BlockStopLockScreenWidgetView: View {
    let entry: BlockStopWidgetProvider.Entry

    var body: some View {
        switch (entry.threatCount, entry.isScanning) {
        case (0, false):
            Label("Secure", systemImage: "checkmark.circle.fill")
                .foregroundColor(.green)

        case (let count, false) where count > 0:
            Label("\(count) threat", systemImage: "exclamationmark.triangle.fill")
                .foregroundColor(.red)

        default:
            Label("Scanning", systemImage: "arrow.clockwise")
                .foregroundColor(.blue)
        }
    }
}

// MARK: - Configuration Intent

class ConfigurationIntent: INIntent {
    @IntentCopy
    var updateFrequency: NSNumber?

    override func resolveSupportedFamilies() -> [WidgetFamily] {
        [.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular]
    }
}

// MARK: - Preview

#Preview(as: .systemMedium) {
    BlockStopWidget()
} timeline: {
    BlockStopWidgetProvider.Entry(
        date: .now,
        configuration: ConfigurationIntent(),
        threatCount: 0,
        lastScanDate: .now.addingTimeInterval(-600),
        isScanning: false,
        currentSummary: "System Secure"
    )

    BlockStopWidgetProvider.Entry(
        date: .now,
        configuration: ConfigurationIntent(),
        threatCount: 3,
        lastScanDate: .now,
        isScanning: false,
        currentSummary: "3 threats found"
    )
}
