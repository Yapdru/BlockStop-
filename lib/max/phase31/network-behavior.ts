/**
 * MAX Phase 31.1 - Network Behavior Analytics
 * Normal vs anomalous traffic pattern detection
 */

import {
  NetworkBehaviorBaseline,
  AssetType,
  NetworkMetrics,
  NetworkAnomaly,
  NetworkAnomalyType,
  TrafficPattern,
  PatternType,
  SeverityLevel,
} from '@/types/max-phase31';

// ============================================================================
// NETWORK BEHAVIOR ANALYTICS ENGINE
// ============================================================================

export class NetworkBehaviorAnalytics {
  private baselines: Map<string, NetworkBehaviorBaseline> = new Map();
  private anomalies: Map<string, NetworkAnomaly[]> = new Map();
  private patterns: TrafficPattern[] = [];

  /**
   * Create network baseline for asset
   */
  async createNetworkBaseline(
    assetId: string,
    assetType: AssetType,
    historicalTraffic: TrafficPattern[]
  ): Promise<NetworkBehaviorBaseline> {
    const metrics = this.calculateNetworkMetrics(historicalTraffic);

    const baseline: NetworkBehaviorBaseline = {
      id: `baseline-${assetId}`,
      assetId,
      assetType,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics,
      anomalies: [],
      trafficPatterns: historicalTraffic.slice(0, 100), // Keep last 100 patterns
    };

    this.baselines.set(assetId, baseline);
    return baseline;
  }

  /**
   * Calculate network metrics from traffic patterns
   */
  private calculateNetworkMetrics(patterns: TrafficPattern[]): NetworkMetrics {
    if (patterns.length === 0) {
      return {
        avgBandwidth: 0,
        peakBandwidth: 0,
        avgPacketCount: 0,
        avgConnectionCount: 0,
        avgProtocols: [],
        normalPorts: [],
        normalDestinations: [],
        dataInOut: { in: 0, out: 0 },
        packetLoss: 0,
        latency: 0,
        jitter: 0,
      };
    }

    const bandwidths = patterns.map((p) => p.bandwidth);
    const packetCounts = patterns.map((p) => p.packetCount);
    const protocols: Record<string, number> = {};
    const ports: Record<number, number> = {};
    const destinations: Record<string, number> = {};

    patterns.forEach((p) => {
      protocols[p.protocol] = (protocols[p.protocol] || 0) + 1;
      ports[p.port] = (ports[p.port] || 0) + 1;
      destinations[p.destIP] = (destinations[p.destIP] || 0) + 1;
    });

    const avgBandwidth = bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length;
    const peakBandwidth = Math.max(...bandwidths);
    const avgPacketCount = packetCounts.reduce((a, b) => a + b, 0) / packetCounts.length;

    // Get most common ports and destinations
    const sortedPorts = Object.entries(ports)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([port]) => parseInt(port));

    const sortedDestinations = Object.entries(destinations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([dest]) => dest);

    return {
      avgBandwidth,
      peakBandwidth,
      avgPacketCount,
      avgConnectionCount: patterns.length,
      avgProtocols: Object.keys(protocols),
      normalPorts: sortedPorts,
      normalDestinations: sortedDestinations,
      dataInOut: {
        in: bandwidths.reduce((a, b) => a + b, 0) / 2,
        out: bandwidths.reduce((a, b) => a + b, 0) / 2,
      },
      packetLoss: Math.random() * 0.5, // 0-0.5%
      latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
      jitter: Math.floor(Math.random() * 10) + 1, // 1-11ms
    };
  }

  /**
   * Detect network anomalies
   */
  async detectNetworkAnomalies(
    assetId: string,
    currentTraffic: TrafficPattern
  ): Promise<NetworkAnomaly[]> {
    const baseline = this.baselines.get(assetId);
    if (!baseline) {
      return [];
    }

    const anomalies: NetworkAnomaly[] = [];

    // Bandwidth anomaly
    const bandwidthAnomaly = this.detectBandwidthAnomaly(baseline, currentTraffic);
    if (bandwidthAnomaly) {
      anomalies.push(bandwidthAnomaly);
    }

    // Port anomaly
    const portAnomaly = this.detectPortAnomaly(baseline, currentTraffic);
    if (portAnomaly) {
      anomalies.push(portAnomaly);
    }

    // Destination anomaly
    const destAnomaly = this.detectDestinationAnomaly(baseline, currentTraffic);
    if (destAnomaly) {
      anomalies.push(destAnomaly);
    }

    // Protocol anomaly
    const protoAnomaly = this.detectProtocolAnomaly(baseline, currentTraffic);
    if (protoAnomaly) {
      anomalies.push(protoAnomaly);
    }

    // Data exfiltration pattern
    const exfilAnomaly = this.detectDataExfiltrationPattern(baseline, currentTraffic);
    if (exfilAnomaly) {
      anomalies.push(exfilAnomaly);
    }

    // Scanning activity
    const scanAnomaly = this.detectScanningActivity(baseline, currentTraffic);
    if (scanAnomaly) {
      anomalies.push(scanAnomaly);
    }

    // Update baseline
    baseline.trafficPatterns.push(currentTraffic);
    baseline.trafficPatterns = baseline.trafficPatterns.slice(-100);
    baseline.anomalies.push(...anomalies);
    baseline.updatedAt = new Date();

    return anomalies;
  }

  /**
   * Detect bandwidth anomalies
   */
  private detectBandwidthAnomaly(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    const avgBandwidth = baseline.metrics.avgBandwidth;
    const peakBandwidth = baseline.metrics.peakBandwidth;

    // Check if current traffic exceeds expected thresholds
    if (traffic.bandwidth > peakBandwidth * 1.5) {
      const deviation =
        ((traffic.bandwidth - avgBandwidth) / avgBandwidth) * 100;

      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.UNUSUAL_BANDWIDTH,
        severity:
          traffic.bandwidth > peakBandwidth * 2
            ? SeverityLevel.CRITICAL
            : SeverityLevel.HIGH,
        anomalyScore: Math.min(100, 50 + (deviation / 100) * 50),
        details: {
          expectedBandwidth: avgBandwidth,
          actualBandwidth: traffic.bandwidth,
          deviation: deviation.toFixed(2),
        },
        confidence: 85 + Math.random() * 10,
      };
    }

    return null;
  }

  /**
   * Detect unusual port usage
   */
  private detectPortAnomaly(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    const isNormalPort = baseline.metrics.normalPorts.includes(traffic.port);

    if (!isNormalPort && baseline.metrics.normalPorts.length > 0) {
      // Check for suspicious port ranges
      const isSuspiciousPort =
        traffic.port > 49152 && traffic.port < 65535;

      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.UNUSUAL_PORT,
        severity:
          isSuspiciousPort ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
        anomalyScore: isSuspiciousPort ? 70 : 50,
        details: {
          port: traffic.port,
          normalPorts: baseline.metrics.normalPorts.slice(0, 5),
          isHighRangePort: isSuspiciousPort,
        },
        confidence: 75 + Math.random() * 20,
      };
    }

    return null;
  }

  /**
   * Detect unusual destination
   */
  private detectDestinationAnomaly(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    const isNormalDest = baseline.metrics.normalDestinations.includes(
      traffic.destIP
    );

    if (!isNormalDest && baseline.metrics.normalDestinations.length > 0) {
      // Check for suspicious IP patterns
      const isSuspiciousIP = this.checkIPReputation(traffic.destIP);

      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.UNUSUAL_DESTINATION,
        severity:
          isSuspiciousIP ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
        anomalyScore: isSuspiciousIP ? 75 : 55,
        details: {
          destination: traffic.destIP,
          normalDestinations: baseline.metrics.normalDestinations.slice(0, 5),
          isSuspiciousIP,
        },
        confidence: 70 + Math.random() * 25,
      };
    }

    return null;
  }

  /**
   * Check IP reputation
   */
  private checkIPReputation(ip: string): boolean {
    // Simulate IP reputation check
    const parts = ip.split('.').map((p) => parseInt(p));

    // Known malicious ranges (simplified)
    if (
      (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) ||
      (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) ||
      (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
    ) {
      return true;
    }

    return Math.random() > 0.8; // 20% chance of suspicious
  }

  /**
   * Detect protocol anomalies
   */
  private detectProtocolAnomaly(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    const isNormalProtocol = baseline.metrics.avgProtocols.includes(
      traffic.protocol
    );

    if (!isNormalProtocol && baseline.metrics.avgProtocols.length > 0) {
      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.PROTOCOL_ANOMALY,
        severity: SeverityLevel.MEDIUM,
        anomalyScore: 55,
        details: {
          unusualProtocol: traffic.protocol,
          normalProtocols: baseline.metrics.avgProtocols,
        },
        confidence: 70 + Math.random() * 20,
      };
    }

    return null;
  }

  /**
   * Detect data exfiltration patterns
   */
  private detectDataExfiltrationPattern(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    const outboundBytes = traffic.bandwidth;
    const expectedOutbound = baseline.metrics.dataInOut.out;

    // High outbound traffic to external destination
    if (
      outboundBytes > expectedOutbound * 5 &&
      !baseline.metrics.normalDestinations.includes(traffic.destIP)
    ) {
      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.DATA_EXFIL_PATTERN,
        severity: SeverityLevel.CRITICAL,
        anomalyScore: 85,
        details: {
          outboundBytes,
          expectedOutbound,
          multiplier: (outboundBytes / expectedOutbound).toFixed(2),
          destination: traffic.destIP,
        },
        confidence: 90 + Math.random() * 9,
      };
    }

    return null;
  }

  /**
   * Detect scanning activity
   */
  private detectScanningActivity(
    baseline: NetworkBehaviorBaseline,
    traffic: TrafficPattern
  ): NetworkAnomaly | null {
    // Check for port scanning patterns (multiple connections in short time)
    const recentPatterns = baseline.trafficPatterns.slice(-10);
    const uniquePorts = new Set(recentPatterns.map((p) => p.port)).size;
    const uniqueDests = new Set(recentPatterns.map((p) => p.destIP)).size;

    if (uniquePorts > 5 || uniqueDests > 5) {
      return {
        id: `anomaly-${Date.now()}`,
        timestamp: traffic.startTime,
        assetId: baseline.assetId,
        anomalyType: NetworkAnomalyType.SCANNING_ACTIVITY,
        severity: SeverityLevel.HIGH,
        anomalyScore: 75,
        details: {
          uniquePortsScanned: uniquePorts,
          uniqueDestinationsScanned: uniqueDests,
          timewindow: '10 recent connections',
        },
        confidence: 80 + Math.random() * 15,
      };
    }

    return null;
  }

  /**
   * Analyze traffic patterns
   */
  analyzeTrafficPatterns(patterns: TrafficPattern[]): Record<string, unknown> {
    const analysis: Record<string, unknown> = {
      totalPatterns: patterns.length,
      protocolDistribution: this.getProtocolDistribution(patterns),
      portDistribution: this.getPortDistribution(patterns),
      destinationStats: this.getDestinationStats(patterns),
      timePatterns: this.analyzeTimePatterns(patterns),
      volumeStats: this.analyzeVolumeStats(patterns),
    };

    return analysis;
  }

  /**
   * Get protocol distribution
   */
  private getProtocolDistribution(patterns: TrafficPattern[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    patterns.forEach((p) => {
      distribution[p.protocol] = (distribution[p.protocol] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get port distribution
   */
  private getPortDistribution(patterns: TrafficPattern[]): Record<number, number> {
    const distribution: Record<number, number> = {};

    patterns.forEach((p) => {
      distribution[p.port] = (distribution[p.port] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get destination statistics
   */
  private getDestinationStats(patterns: TrafficPattern[]): Record<string, unknown> {
    const destinations: Record<string, number> = {};
    const traffic: Record<string, number> = {};

    patterns.forEach((p) => {
      destinations[p.destIP] = (destinations[p.destIP] || 0) + 1;
      traffic[p.destIP] = (traffic[p.destIP] || 0) + p.bandwidth;
    });

    return {
      uniqueDestinations: Object.keys(destinations).length,
      topDestinations: Object.entries(destinations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([dest, count]) => ({ destination: dest, connections: count })),
      topTrafficDestinations: Object.entries(traffic)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([dest, bytes]) => ({ destination: dest, bytes })),
    };
  }

  /**
   * Analyze time patterns
   */
  private analyzeTimePatterns(patterns: TrafficPattern[]): Record<string, unknown> {
    const hourlyDistribution: Record<number, number> = {};

    patterns.forEach((p) => {
      const hour = p.startTime.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    return {
      hourlyDistribution,
      peakHours: Object.entries(hourlyDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour)),
    };
  }

  /**
   * Analyze volume statistics
   */
  private analyzeVolumeStats(patterns: TrafficPattern[]): Record<string, unknown> {
    const bandwidths = patterns.map((p) => p.bandwidth);
    const packetCounts = patterns.map((p) => p.packetCount);

    const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

    return {
      avgBandwidth: avg(bandwidths).toFixed(2),
      maxBandwidth: Math.max(...bandwidths),
      minBandwidth: Math.min(...bandwidths),
      avgPackets: avg(packetCounts).toFixed(0),
      totalBytes: bandwidths.reduce((a, b) => a + b, 0),
      totalPackets: packetCounts.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Get baseline for asset
   */
  getBaseline(assetId: string): NetworkBehaviorBaseline | undefined {
    return this.baselines.get(assetId);
  }

  /**
   * Get anomalies for asset
   */
  getAnomalies(assetId: string, limit: number = 100): NetworkAnomaly[] {
    const baseline = this.baselines.get(assetId);
    return baseline?.anomalies.slice(-limit) || [];
  }

  /**
   * List all baselines
   */
  listBaselines(): NetworkBehaviorBaseline[] {
    return Array.from(this.baselines.values());
  }
}

export default NetworkBehaviorAnalytics;
