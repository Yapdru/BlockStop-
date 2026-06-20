import { Threat } from './types';
import { generateThreatId, calculateConfidence } from './utils';

interface NetworkConnection {
  processId: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  timestamp: number;
  bytesIn: number;
  bytesOut: number;
}

interface DnsQuery {
  processId: number;
  domain: string;
  queryType: string;
  resolvedIp: string;
  timestamp: number;
}

interface C2Indicator {
  type: string;
  value: string;
  confidence: number;
}

export class C2Blocker {
  private connectionLog: Map<number, NetworkConnection[]> = new Map();
  private dnsLog: Map<number, DnsQuery[]> = new Map();
  private knownC2Domains: Set<string> = new Set();
  private knownC2Ips: Set<string> = new Set();

  constructor() {
    this.initializeKnownC2List();
  }

  private initializeKnownC2List(): void {
    // Initialize with known C2 domains and IPs
    const c2Domains = [
      'cmd.example.com',
      'control.badactor.com',
      'beacon.malicious.net',
    ];

    const c2Ips = [
      '192.0.2.1',
      '198.51.100.1',
      '203.0.113.1',
    ];

    for (const domain of c2Domains) {
      this.knownC2Domains.add(domain.toLowerCase());
    }

    for (const ip of c2Ips) {
      this.knownC2Ips.add(ip);
    }
  }

  async detectC2Communication(
    processId: number,
    activities: {
      connections?: NetworkConnection[];
      dnsQueries?: DnsQuery[];
    }
  ): Promise<Threat | null> {
    const indicators: C2Indicator[] = [];

    // Analyze network connections
    if (activities.connections) {
      const connIndicators = this.analyzeConnections(activities.connections);
      indicators.push(...connIndicators);
      this.recordConnections(processId, activities.connections);
    }

    // Analyze DNS queries
    if (activities.dnsQueries) {
      const dnsIndicators = this.analyzeDNS(activities.dnsQueries);
      indicators.push(...dnsIndicators);
      this.recordDNS(processId, activities.dnsQueries);
    }

    if (indicators.length === 0) {
      return null;
    }

    // Calculate weighted confidence
    const avgConfidence =
      indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length;

    if (avgConfidence < 0.65) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'C2_COMMUNICATION',
      severity: 'HIGH',
      timestamp: Date.now(),
      source: 'C2Blocker',
      description: `C2 communication detected: ${indicators.map((i) => `${i.type}=${i.value}`).join(', ')}`,
      processId,
      behaviorIndicators: indicators.map((i) => `${i.type}_${i.value}`),
      metadata: {
        indicatorCount: indicators.length,
        avgConfidence,
        indicators: indicators.map((i) => ({
          type: i.type,
          value: i.value,
          confidence: i.confidence,
        })),
      },
    };

    return threat;
  }

  private analyzeConnections(connections: NetworkConnection[]): C2Indicator[] {
    const indicators: C2Indicator[] = [];

    if (connections.length === 0) return indicators;

    // Check for known C2 IPs
    for (const conn of connections) {
      if (this.knownC2Ips.has(conn.destinationIp)) {
        indicators.push({
          type: 'known_c2_ip',
          value: conn.destinationIp,
          confidence: 0.95,
        });
      }
    }

    // Detect beaconing pattern (periodic connections)
    const beaconPattern = this.detectBeaconingPattern(connections);
    if (beaconPattern.detected) {
      indicators.push({
        type: 'beaconing_pattern',
        value: `interval_${beaconPattern.interval}ms`,
        confidence: beaconPattern.confidence,
      });
    }

    // Detect unusual ports
    const unusualPorts = connections.filter(
      (c) => c.destinationPort > 49152 || (c.destinationPort > 1024 && c.destinationPort < 5000)
    );
    if (unusualPorts.length > 0) {
      indicators.push({
        type: 'unusual_port_usage',
        value: `${unusualPorts.length}_connections`,
        confidence: 0.6,
      });
    }

    // Detect reverse connections (unusual outbound to low ports)
    const reverseConns = connections.filter(
      (c) => c.destinationPort < 1024 && c.destinationPort !== 443 && c.destinationPort !== 80
    );
    if (reverseConns.length > 0) {
      indicators.push({
        type: 'reverse_shell_pattern',
        value: `to_port_${reverseConns[0].destinationPort}`,
        confidence: 0.75,
      });
    }

    // Detect suspicious data transfer patterns
    for (const conn of connections) {
      if (conn.bytesOut > 0 && conn.bytesIn === 0) {
        indicators.push({
          type: 'one_way_communication',
          value: `${(conn.bytesOut / 1024).toFixed(2)}KB_out`,
          confidence: 0.65,
        });
        break; // Only count once
      }
    }

    // Detect connections outside business hours (simplified)
    const hour = new Date(connections[0].timestamp).getHours();
    if (hour < 6 || hour > 22) {
      indicators.push({
        type: 'off_hours_communication',
        value: `hour_${hour}`,
        confidence: 0.5,
      });
    }

    return indicators;
  }

  private analyzeDNS(dnsQueries: DnsQuery[]): C2Indicator[] {
    const indicators: C2Indicator[] = [];

    if (dnsQueries.length === 0) return indicators;

    // Check for known C2 domains
    for (const query of dnsQueries) {
      const domainLower = query.domain.toLowerCase();
      if (this.knownC2Domains.has(domainLower)) {
        indicators.push({
          type: 'known_c2_domain',
          value: domainLower,
          confidence: 0.95,
        });
      }
    }

    // Detect domain generation algorithm (DGA) patterns
    const dgaPattern = this.detectDGAPattern(dnsQueries);
    if (dgaPattern.detected) {
      indicators.push({
        type: 'dga_pattern',
        value: `${dgaPattern.uniqueDomains}_unique_domains`,
        confidence: dgaPattern.confidence,
      });
    }

    // Detect DNS tunneling
    const longDomains = dnsQueries.filter((q) => q.domain.length > 50);
    if (longDomains.length > 5) {
      indicators.push({
        type: 'dns_tunneling_attempt',
        value: `${longDomains.length}_long_queries`,
        confidence: 0.7,
      });
    }

    // Detect NXDOMAIN patterns (failed domain lookups)
    const failedLookups = dnsQueries.filter(
      (q) => q.resolvedIp === '0.0.0.0' || q.resolvedIp === ''
    );
    if (failedLookups.length > dnsQueries.length * 0.5) {
      indicators.push({
        type: 'failed_dns_lookups',
        value: `${((failedLookups.length / dnsQueries.length) * 100).toFixed(0)}%`,
        confidence: 0.65,
      });
    }

    // Detect DNS query frequency
    if (dnsQueries.length > 20) {
      indicators.push({
        type: 'high_dns_query_rate',
        value: `${dnsQueries.length}_queries`,
        confidence: 0.6,
      });
    }

    // Detect suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    const suspiciousDomains = dnsQueries.filter((q) =>
      suspiciousTlds.some((tld) => q.domain.endsWith(tld))
    );
    if (suspiciousDomains.length > 0) {
      indicators.push({
        type: 'suspicious_tld',
        value: suspiciousDomains[0].domain,
        confidence: 0.7,
      });
    }

    return indicators;
  }

  private detectBeaconingPattern(
    connections: NetworkConnection[]
  ): { detected: boolean; interval: number; confidence: number } {
    if (connections.length < 3) {
      return { detected: false, interval: 0, confidence: 0 };
    }

    const timestamps = connections.map((c) => c.timestamp).sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // Check if beaconing is regular (low std dev relative to mean)
    const isRegular = stdDev < avgInterval * 0.2;
    const confidence = isRegular ? 0.8 : 0;

    return {
      detected: isRegular && avgInterval > 5000, // Beacon every 5+ seconds
      interval: Math.round(avgInterval),
      confidence,
    };
  }

  private detectDGAPattern(
    dnsQueries: DnsQuery[]
  ): { detected: boolean; uniqueDomains: number; confidence: number } {
    const uniqueDomains = new Set(dnsQueries.map((q) => q.domain.toLowerCase())).size;
    const queryCount = dnsQueries.length;

    // DGA typically has high ratio of unique domains to total queries
    const uniqueRatio = uniqueDomains / queryCount;

    if (uniqueRatio > 0.7 && uniqueDomains > 10) {
      return {
        detected: true,
        uniqueDomains,
        confidence: Math.min(uniqueRatio, 1.0),
      };
    }

    return { detected: false, uniqueDomains, confidence: 0 };
  }

  private recordConnections(processId: number, connections: NetworkConnection[]): void {
    if (!this.connectionLog.has(processId)) {
      this.connectionLog.set(processId, []);
    }
    this.connectionLog.get(processId)!.push(...connections);
  }

  private recordDNS(processId: number, dnsQueries: DnsQuery[]): void {
    if (!this.dnsLog.has(processId)) {
      this.dnsLog.set(processId, []);
    }
    this.dnsLog.get(processId)!.push(...dnsQueries);
  }

  addKnownC2(type: 'domain' | 'ip', value: string): void {
    if (type === 'domain') {
      this.knownC2Domains.add(value.toLowerCase());
    } else {
      this.knownC2Ips.add(value);
    }
  }
}

export default C2Blocker;
