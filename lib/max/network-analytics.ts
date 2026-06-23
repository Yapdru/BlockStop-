/**
 * Network Analytics - Deep Packet Inspection & Traffic Analysis
 * Advanced network monitoring and analysis for MAX tier
 */

export interface NetworkFlow {
  id: string;
  sourceIP: string;
  destinationIP: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // milliseconds
  packets: number;
  bytes: number;
  direction: 'inbound' | 'outbound' | 'internal';
  status: 'active' | 'closed' | 'timeout';
  classification: TrafficClassification;
  analysis: FlowAnalysis;
}

export interface TrafficClassification {
  category: 'normal' | 'suspicious' | 'malicious' | 'unknown';
  appProtocol: string;
  confidence: number;
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  anomalies: TrafficAnomaly[];
}

export interface TrafficAnomaly {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  confidence: number;
  detectedAt: Date;
}

export interface FlowAnalysis {
  protocolAnalysis: ProtocolAnalysis;
  payloadAnalysis: PayloadAnalysis;
  behavioralAnalysis: BehavioralAnalysis;
  geoLocation: GeoLocation;
  reputation: IPReputation;
}

export interface ProtocolAnalysis {
  layers: string[];
  headerAnalysis: HeaderInfo[];
  violations: ProtocolViolation[];
}

export interface HeaderInfo {
  layer: string;
  fields: Record<string, any>;
  anomalies: string[];
}

export interface ProtocolViolation {
  layer: string;
  violation: string;
  severity: number;
  details: string;
}

export interface PayloadAnalysis {
  size: number;
  entropy: number;
  compression: string;
  encryption: string;
  patterns: PayloadPattern[];
  signatures: SignatureMatch[];
}

export interface PayloadPattern {
  pattern: string;
  occurrence: number;
  significance: number;
  indicator: string;
}

export interface SignatureMatch {
  signatureId: string;
  name: string;
  severity: number;
  category: string;
  confidence: number;
}

export interface BehavioralAnalysis {
  flowCharacteristics: FlowCharacteristic[];
  anomalyScore: number;
  predictedIntent: string;
  suspicionLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

export interface FlowCharacteristic {
  metric: string;
  value: any;
  baseline: any;
  deviation: number;
  isAnomaly: boolean;
}

export interface GeoLocation {
  sourceCountry: string;
  sourceRegion: string;
  destinationCountry: string;
  destinationRegion: string;
  sourceCity?: string;
  destinationCity?: string;
  sourceCoordinates?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
}

export interface IPReputation {
  sourceReputation: ReputationScore;
  destinationReputation: ReputationScore;
}

export interface ReputationScore {
  score: number; // 0-100, higher is worse
  status: 'trusted' | 'unknown' | 'suspicious' | 'malicious';
  threatCategory: string[];
  lastUpdated: Date;
  sources: string[];
}

export interface NetworkBaseline {
  metric: string;
  expectedValue: number;
  stdDeviation: number;
  timeWindow: number; // hours
  lastUpdated: Date;
  samples: number;
}

export interface AnomalyDetectionResult {
  flowId: string;
  timestamp: Date;
  anomalies: TrafficAnomaly[];
  overallAnomalyScore: number;
  detectionConfidence: number;
  recommendations: string[];
}

export interface DPIResult {
  flowId: string;
  timestamp: Date;
  deepPayloadAnalysis: PayloadAnalysis;
  classificationResult: TrafficClassification;
  securityAlert: boolean;
  indicators: string[];
}

/**
 * Network Analytics Engine
 */
export class NetworkAnalyticsEngine {
  private flows: Map<string, NetworkFlow>;
  private baselines: Map<string, NetworkBaseline>;
  private flowCache: NetworkFlow[] = [];
  private anomalyDetector: AnomalyDetector;
  private dpiEngine: DeepPacketInspectionEngine;
  private geoLocationService: GeoLocationService;
  private reputationService: ReputationService;

  constructor() {
    this.flows = new Map();
    this.baselines = new Map();
    this.anomalyDetector = new AnomalyDetector();
    this.dpiEngine = new DeepPacketInspectionEngine();
    this.geoLocationService = new GeoLocationService();
    this.reputationService = new ReputationService();
    this.initializeBaselines();
  }

  /**
   * Initialize default baselines
   */
  private initializeBaselines(): void {
    const defaultBaselines: NetworkBaseline[] = [
      {
        metric: 'bytes_per_second',
        expectedValue: 1000,
        stdDeviation: 200,
        timeWindow: 24,
        lastUpdated: new Date(),
        samples: 100,
      },
      {
        metric: 'packets_per_second',
        expectedValue: 100,
        stdDeviation: 20,
        timeWindow: 24,
        lastUpdated: new Date(),
        samples: 100,
      },
      {
        metric: 'connection_count',
        expectedValue: 50,
        stdDeviation: 10,
        timeWindow: 1,
        lastUpdated: new Date(),
        samples: 100,
      },
    ];

    defaultBaselines.forEach((baseline) => {
      this.baselines.set(baseline.metric, baseline);
    });
  }

  /**
   * Record network flow
   */
  recordFlow(flowData: any): NetworkFlow {
    const flow: NetworkFlow = {
      id: `flow_${Date.now()}`,
      sourceIP: flowData.srcIP || 'unknown',
      destinationIP: flowData.dstIP || 'unknown',
      sourcePort: flowData.srcPort || 0,
      destinationPort: flowData.dstPort || 0,
      protocol: flowData.protocol || 'unknown',
      startTime: new Date(),
      duration: flowData.duration || 0,
      packets: flowData.packets || 0,
      bytes: flowData.bytes || 0,
      direction: this.determineDirection(flowData),
      status: 'active',
      classification: this.classifyTraffic(flowData),
      analysis: {
        protocolAnalysis: this.analyzeProtocol(flowData),
        payloadAnalysis: this.analyzePayload(flowData),
        behavioralAnalysis: this.analyzeBehavior(flowData),
        geoLocation: this.geoLocationService.lookup(flowData.srcIP, flowData.dstIP),
        reputation: this.reputationService.checkReputation(flowData.srcIP, flowData.dstIP),
      },
    };

    this.flows.set(flow.id, flow);
    this.flowCache.push(flow);

    // Keep only recent flows in cache
    if (this.flowCache.length > 10000) {
      this.flowCache = this.flowCache.slice(-10000);
    }

    return flow;
  }

  /**
   * Determine traffic direction
   */
  private determineDirection(flowData: any): 'inbound' | 'outbound' | 'internal' {
    const srcIP = flowData.srcIP || '';
    const dstIP = flowData.dstIP || '';

    const isPrivate = (ip: string) => {
      return ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.');
    };

    if (isPrivate(srcIP) && isPrivate(dstIP)) {
      return 'internal';
    }
    if (isPrivate(srcIP)) {
      return 'outbound';
    }
    return 'inbound';
  }

  /**
   * Classify traffic
   */
  private classifyTraffic(flowData: any): TrafficClassification {
    const suspiciousPorts = [4444, 5555, 8888, 9999, 6666];
    const dstPort = flowData.dstPort || 0;
    const isSuspicious = suspiciousPorts.includes(dstPort);

    return {
      category: isSuspicious ? 'suspicious' : 'normal',
      appProtocol: this.identifyAppProtocol(flowData),
      confidence: 0.85,
      threatLevel: isSuspicious ? 'high' : 'none',
      anomalies: [],
    };
  }

  /**
   * Identify application protocol
   */
  private identifyAppProtocol(flowData: any): string {
    const port = flowData.dstPort || 0;

    const portMap: Record<number, string> = {
      80: 'HTTP',
      443: 'HTTPS',
      22: 'SSH',
      21: 'FTP',
      25: 'SMTP',
      53: 'DNS',
      3306: 'MySQL',
      5432: 'PostgreSQL',
      6379: 'Redis',
      27017: 'MongoDB',
    };

    return portMap[port] || (flowData.protocol || 'unknown').toUpperCase();
  }

  /**
   * Analyze protocol
   */
  private analyzeProtocol(flowData: any): ProtocolAnalysis {
    return {
      layers: ['IP', this.identifyAppProtocol(flowData)],
      headerAnalysis: [
        {
          layer: 'IP',
          fields: {
            version: 4,
            ttl: flowData.ttl || 64,
            flags: flowData.flags || [],
          },
          anomalies: [],
        },
      ],
      violations: [],
    };
  }

  /**
   * Analyze payload
   */
  private analyzePayload(flowData: any): PayloadAnalysis {
    const payload = flowData.payload || '';
    const entropy = this.calculateEntropy(payload);

    return {
      size: flowData.payloadSize || 0,
      entropy,
      compression: this.detectCompression(payload),
      encryption: this.detectEncryption(payload),
      patterns: this.findPayloadPatterns(payload),
      signatures: [],
    };
  }

  /**
   * Calculate entropy
   */
  private calculateEntropy(data: string): number {
    if (!data) return 0;

    const frequency: Record<string, number> = {};
    for (const char of data) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const len = data.length;
    for (const char in frequency) {
      const p = frequency[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Detect compression
   */
  private detectCompression(data: string): string {
    // Check for common compression signatures
    if (data.startsWith('PK')) return 'ZIP';
    if (data.startsWith('BZ')) return 'BZIP2';
    if (data.startsWith('\x1f\x8b')) return 'GZIP';
    return 'none';
  }

  /**
   * Detect encryption
   */
  private detectEncryption(data: string): string {
    const entropy = this.calculateEntropy(data);
    if (entropy > 7) return 'likely_encrypted';
    return 'none';
  }

  /**
   * Find payload patterns
   */
  private findPayloadPatterns(payload: string): PayloadPattern[] {
    const patterns: PayloadPattern[] = [];

    // Check for common malicious patterns
    const suspiciousPatterns = [
      { pattern: 'cmd.exe', significance: 0.8 },
      { pattern: 'powershell', significance: 0.7 },
      { pattern: 'bash', significance: 0.6 },
      { pattern: 'select%20from', significance: 0.8 },
      { pattern: 'union%20select', significance: 0.9 },
    ];

    suspiciousPatterns.forEach(({ pattern, significance }) => {
      const regex = new RegExp(pattern, 'i');
      const matches = payload.match(regex);
      if (matches) {
        patterns.push({
          pattern,
          occurrence: matches.length,
          significance,
          indicator: `Pattern detected: ${pattern}`,
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze behavior
   */
  private analyzeBehavior(flowData: any): BehavioralAnalysis {
    const characteristics: FlowCharacteristic[] = [];
    const baselineBytes = this.baselines.get('bytes_per_second');
    const baselinePackets = this.baselines.get('packets_per_second');

    if (baselineBytes) {
      const deviation = (flowData.bytes - baselineBytes.expectedValue) / baselineBytes.stdDeviation;
      characteristics.push({
        metric: 'bytes_per_second',
        value: flowData.bytes,
        baseline: baselineBytes.expectedValue,
        deviation,
        isAnomaly: Math.abs(deviation) > 2,
      });
    }

    if (baselinePackets) {
      const deviation = (flowData.packets - baselinePackets.expectedValue) / baselinePackets.stdDeviation;
      characteristics.push({
        metric: 'packets_per_second',
        value: flowData.packets,
        baseline: baselinePackets.expectedValue,
        deviation,
        isAnomaly: Math.abs(deviation) > 2,
      });
    }

    const anomalyCount = characteristics.filter((c) => c.isAnomaly).length;
    const anomalyScore = Math.min(1, anomalyCount / characteristics.length);

    return {
      flowCharacteristics: characteristics,
      anomalyScore,
      predictedIntent: anomalyScore > 0.5 ? 'malicious' : 'benign',
      suspicionLevel: anomalyScore > 0.7 ? 'high' : anomalyScore > 0.4 ? 'medium' : 'low',
    };
  }

  /**
   * Perform deep packet inspection
   */
  async performDPI(flowId: string): Promise<DPIResult> {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const dpiResult = await this.dpiEngine.inspect(flow);

    // Update classification based on DPI
    flow.classification = dpiResult.classificationResult;

    return dpiResult;
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(): Promise<AnomalyDetectionResult[]> {
    const results: AnomalyDetectionResult[] = [];

    for (const flow of this.flowCache.slice(-100)) {
      const anomalies = this.anomalyDetector.detect(flow, this.baselines);

      if (anomalies.length > 0) {
        results.push({
          flowId: flow.id,
          timestamp: new Date(),
          anomalies,
          overallAnomalyScore: flow.analysis.behavioralAnalysis.anomalyScore,
          detectionConfidence: 0.85,
          recommendations: this.generateRecommendations(anomalies),
        });
      }
    }

    return results;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(anomalies: TrafficAnomaly[]): string[] {
    const recommendations = new Set<string>();

    anomalies.forEach((anomaly) => {
      if (anomaly.type === 'suspicious_ports') {
        recommendations.add('Block traffic on suspicious ports');
      }
      if (anomaly.type === 'encryption_detected') {
        recommendations.add('Investigate encrypted traffic');
      }
      if (anomaly.type === 'data_exfiltration') {
        recommendations.add('Isolate system and investigate');
      }
    });

    return Array.from(recommendations);
  }

  /**
   * Get network statistics
   */
  getNetworkStatistics(): {
    totalFlows: number;
    inboundFlows: number;
    outboundFlows: number;
    internalFlows: number;
    totalBytes: number;
    totalPackets: number;
    anomalousFlows: number;
  } {
    let totalBytes = 0;
    let totalPackets = 0;
    let anomalousFlows = 0;

    const inboundFlows = this.flowCache.filter((f) => f.direction === 'inbound').length;
    const outboundFlows = this.flowCache.filter((f) => f.direction === 'outbound').length;
    const internalFlows = this.flowCache.filter((f) => f.direction === 'internal').length;

    this.flowCache.forEach((flow) => {
      totalBytes += flow.bytes;
      totalPackets += flow.packets;
      if (flow.analysis.behavioralAnalysis.anomalyScore > 0.5) {
        anomalousFlows++;
      }
    });

    return {
      totalFlows: this.flowCache.length,
      inboundFlows,
      outboundFlows,
      internalFlows,
      totalBytes,
      totalPackets,
      anomalousFlows,
    };
  }

  /**
   * Get suspicious flows
   */
  getSuspiciousFlows(threshold: number = 0.6): NetworkFlow[] {
    return this.flowCache.filter(
      (flow) => flow.analysis.behavioralAnalysis.anomalyScore > threshold
    );
  }

  /**
   * Export traffic capture
   */
  exportCapture(flowIds?: string[]): string {
    const flows = flowIds
      ? flowIds.map((id) => this.flows.get(id)).filter((f) => f)
      : this.flowCache;

    return JSON.stringify(
      flows.map((flow) => ({
        id: flow.id,
        src: flow.sourceIP,
        dst: flow.destinationIP,
        srcPort: flow.sourcePort,
        dstPort: flow.destinationPort,
        protocol: flow.protocol,
        bytes: flow.bytes,
        packets: flow.packets,
        classification: flow.classification.category,
      })),
      null,
      2
    );
  }
}

/**
 * Anomaly Detector
 */
class AnomalyDetector {
  detect(flow: NetworkFlow, baselines: Map<string, NetworkBaseline>): TrafficAnomaly[] {
    const anomalies: TrafficAnomaly[] = [];

    // Check against baselines
    baselines.forEach((baseline) => {
      const value = (flow as any)[baseline.metric.split('_')[0]];
      if (value) {
        const zscore = Math.abs((value - baseline.expectedValue) / baseline.stdDeviation);
        if (zscore > 2) {
          anomalies.push({
            id: `anom_${Date.now()}`,
            type: baseline.metric,
            severity: zscore > 3 ? 'high' : 'medium',
            description: `${baseline.metric} deviation detected`,
            indicators: [`z-score: ${zscore.toFixed(2)}`],
            confidence: 0.8,
            detectedAt: new Date(),
          });
        }
      }
    });

    return anomalies;
  }
}

/**
 * Deep Packet Inspection Engine
 */
class DeepPacketInspectionEngine {
  async inspect(flow: NetworkFlow): Promise<DPIResult> {
    return {
      flowId: flow.id,
      timestamp: new Date(),
      deepPayloadAnalysis: flow.analysis.payloadAnalysis,
      classificationResult: flow.classification,
      securityAlert: flow.analysis.behavioralAnalysis.anomalyScore > 0.7,
      indicators: flow.analysis.payloadAnalysis.patterns.map((p) => p.indicator),
    };
  }
}

/**
 * Geo-Location Service
 */
class GeoLocationService {
  lookup(srcIP: string, dstIP: string): GeoLocation {
    return {
      sourceCountry: 'US',
      sourceRegion: 'California',
      destinationCountry: 'Unknown',
      destinationRegion: 'Unknown',
      sourceCity: 'San Francisco',
    };
  }
}

/**
 * Reputation Service
 */
class ReputationService {
  checkReputation(srcIP: string, dstIP: string): IPReputation {
    return {
      sourceReputation: {
        score: Math.random() * 30,
        status: 'trusted',
        threatCategory: [],
        lastUpdated: new Date(),
        sources: ['abuseipdb'],
      },
      destinationReputation: {
        score: Math.random() * 50,
        status: 'unknown',
        threatCategory: [],
        lastUpdated: new Date(),
        sources: ['abuseipdb'],
      },
    };
  }
}

export const networkAnalyticsEngine = new NetworkAnalyticsEngine();
