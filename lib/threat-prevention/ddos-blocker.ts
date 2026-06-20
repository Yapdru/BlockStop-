import { Threat } from './types';
import { generateThreatId, calculateConfidence } from './utils';

interface NetworkPacket {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  packetSize: number;
  timestamp: number;
  flags?: string;
}

interface TrafficStatistics {
  totalPackets: number;
  totalBytes: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  uniqueSourceIps: number;
  protocolDistribution: Record<string, number>;
}

export class DDoSBlocker {
  private packetLog: Map<number, NetworkPacket[]> = new Map();
  private trafficBaseline: TrafficStatistics | null = null;
  private thresholds = {
    packetsPerSec: 10000,
    bytesPerSec: 100 * 1024 * 1024, // 100 MB/s
    uniqueSources: 1000,
    suspiciousProto: 5000,
  };

  async detectDDoS(packets: NetworkPacket[]): Promise<Threat | null> {
    if (packets.length === 0) return null;

    const stats = this.calculateTrafficStatistics(packets);
    const indicators = this.analyzeTraffic(stats, packets);

    if (indicators.length === 0) return null;

    const confidence = calculateConfidence(
      indicators.length,
      8 // Normalize against typical indicator count
    );

    if (confidence < 0.6) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'DDOS',
      severity: 'MEDIUM',
      timestamp: Date.now(),
      source: 'DDoSBlocker',
      description: `DDoS attack detected: ${indicators.join(', ')}`,
      behaviorIndicators: indicators,
      metadata: {
        packetsPerSecond: stats.packetsPerSecond,
        bytesPerSecond: stats.bytesPerSecond,
        uniqueSourceIps: stats.uniqueSourceIps,
        totalPackets: stats.totalPackets,
        protocolDistribution: stats.protocolDistribution,
      },
    };

    this.recordPackets(packets);
    return threat;
  }

  private calculateTrafficStatistics(
    packets: NetworkPacket[]
  ): TrafficStatistics {
    if (packets.length === 0) {
      return {
        totalPackets: 0,
        totalBytes: 0,
        packetsPerSecond: 0,
        bytesPerSecond: 0,
        uniqueSourceIps: 0,
        protocolDistribution: {},
      };
    }

    const timestamps = packets.map((p) => p.timestamp).sort((a, b) => a - b);
    const timeSpan = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 || 1;

    const uniqueSources = new Set(packets.map((p) => p.sourceIp)).size;
    const totalBytes = packets.reduce((sum, p) => sum + p.packetSize, 0);

    const protocolDist: Record<string, number> = {};
    for (const packet of packets) {
      protocolDist[packet.protocol] = (protocolDist[packet.protocol] || 0) + 1;
    }

    return {
      totalPackets: packets.length,
      totalBytes,
      packetsPerSecond: packets.length / timeSpan,
      bytesPerSecond: totalBytes / timeSpan,
      uniqueSourceIps: uniqueSources,
      protocolDistribution: protocolDist,
    };
  }

  private analyzeTraffic(
    stats: TrafficStatistics,
    packets: NetworkPacket[]
  ): string[] {
    const indicators: string[] = [];

    // Detect volumetric attack
    if (stats.packetsPerSecond > this.thresholds.packetsPerSec) {
      indicators.push('volumetric_attack');
    }

    if (stats.bytesPerSecond > this.thresholds.bytesPerSec) {
      indicators.push('bandwidth_saturation');
    }

    // Detect UDP flood
    if (stats.protocolDistribution.UDP &&
        stats.protocolDistribution.UDP > stats.totalPackets * 0.7) {
      indicators.push('udp_flood');
    }

    // Detect ICMP flood
    if (stats.protocolDistribution.ICMP &&
        stats.protocolDistribution.ICMP > stats.totalPackets * 0.6) {
      indicators.push('icmp_flood');
    }

    // Detect SYN flood
    const synPackets = packets.filter((p) => p.flags?.includes('SYN')).length;
    if (synPackets > packets.length * 0.7) {
      indicators.push('syn_flood');
    }

    // Detect DNS amplification
    if (stats.protocolDistribution.DNS &&
        stats.protocolDistribution.DNS > stats.totalPackets * 0.5) {
      // Check for small requests to many servers
      const requestSizes = packets
        .filter((p) => p.protocol === 'DNS')
        .map((p) => p.packetSize);
      const avgSize = requestSizes.reduce((a, b) => a + b, 0) / requestSizes.length;
      if (avgSize < 100) {
        indicators.push('dns_amplification_attack');
      }
    }

    // Detect NTP amplification
    if (stats.protocolDistribution.NTP &&
        stats.protocolDistribution.NTP > 1000) {
      indicators.push('ntp_amplification_attack');
    }

    // Detect HTTP flood
    const httpProtos = (stats.protocolDistribution.TCP || 0) +
                       (stats.protocolDistribution.HTTPS || 0);
    if (httpProtos > stats.totalPackets * 0.8 &&
        stats.packetsPerSecond > 1000) {
      indicators.push('http_flood');
    }

    // Detect source IP spoofing pattern
    if (stats.uniqueSourceIps > this.thresholds.uniqueSources) {
      indicators.push('source_spoofing_pattern');
    }

    // Detect fragmented packets (can indicate attack)
    const fragmentedPackets = packets.filter(
      (p) => p.flags?.includes('MF') || p.flags?.includes('DF')
    ).length;
    if (fragmentedPackets > packets.length * 0.3) {
      indicators.push('fragmented_packet_attack');
    }

    // Detect slow DDoS
    if (stats.packetsPerSecond > 100 &&
        stats.packetsPerSecond < 1000 &&
        stats.bytesPerSecond > this.thresholds.bytesPerSec * 0.5) {
      indicators.push('slow_ddos_attack');
    }

    // Detect geographic anomaly (simplified)
    const singleSourceDominance = stats.uniqueSourceIps > 0 &&
                                 stats.uniqueSourceIps < 10 &&
                                 stats.packetsPerSecond > 5000;
    if (singleSourceDominance) {
      indicators.push('single_source_dominance');
    }

    return indicators;
  }

  private recordPackets(packets: NetworkPacket[]): void {
    if (packets.length === 0) return;

    const destIp = packets[0].destinationIp;
    if (!this.packetLog.has(0)) {
      this.packetLog.set(0, []);
    }
    this.packetLog.get(0)!.push(...packets);

    // Keep last 100,000 packets
    const log = this.packetLog.get(0)!;
    if (log.length > 100000) {
      log.splice(0, log.length - 100000);
    }
  }

  setBaseline(stats: TrafficStatistics): void {
    this.trafficBaseline = stats;
  }

  getBaseline(): TrafficStatistics | null {
    return this.trafficBaseline;
  }

  updateThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  clearLog(): void {
    this.packetLog.clear();
  }
}

export default DDoSBlocker;
