// PRO Phase 31.1 - Threat Correlation Engine
// Production-grade threat correlation, clustering, and pattern detection

import {
  ThreatPrediction,
  ThreatCorrelation,
  CorrelatedThreat,
  CorrelationAnalysis,
  ThreatCluster,
  ThreatNetworkNode,
  TemporalPattern,
} from '@/types/pro-phase31';

// ============================================================================
// THREAT CORRELATION ENGINE
// ============================================================================

export class ThreatCorrelationEngine {
  private threats: Map<string, ThreatPrediction> = new Map();
  private correlations: Map<string, ThreatCorrelation> = new Map();
  private readonly CORRELATION_THRESHOLD = 0.65;
  private readonly TEMPORAL_WINDOW = 86400000; // 24 hours in ms

  /**
   * Register a threat for correlation analysis
   */
  registerThreat(threat: ThreatPrediction): void {
    this.threats.set(threat.threatId, threat);

    // Perform correlation on registration
    this.correlateWithExistingThreats(threat);
  }

  /**
   * Find threats correlated with a specific threat
   */
  findCorrelatedThreats(threatId: string, topN: number = 10): CorrelatedThreat[] {
    const primaryThreat = this.threats.get(threatId);
    if (!primaryThreat) return [];

    const correlations: CorrelatedThreat[] = [];

    for (const [otherId, otherThreat] of this.threats) {
      if (otherId === threatId) continue;

      const correlationScore = this.calculateCorrelationScore(primaryThreat, otherThreat);

      if (correlationScore >= this.CORRELATION_THRESHOLD) {
        const commonFactors = this.findCommonFactors(primaryThreat, otherThreat);

        correlations.push({
          threatId: otherId,
          correlationScore: Math.round(correlationScore * 100) / 100,
          commonFactors,
          timeline: {
            first: new Date(
              Math.min(primaryThreat.timestamp.getTime(), otherThreat.timestamp.getTime())
            ),
            last: new Date(
              Math.max(primaryThreat.timestamp.getTime(), otherThreat.timestamp.getTime())
            ),
            occurrences: 2,
          },
          severity: otherThreat.riskScore > 0.7 ? 'critical' : otherThreat.riskScore > 0.5 ? 'high' : 'medium',
          sharedAttributes: this.getSharedAttributes(primaryThreat, otherThreat),
        });
      }
    }

    return correlations.sort((a, b) => b.correlationScore - a.correlationScore).slice(0, topN);
  }

  /**
   * Calculate correlation score between two threats
   */
  private calculateCorrelationScore(threat1: ThreatPrediction, threat2: ThreatPrediction): number {
    let score = 0;
    const weights = {
      sameSource: 0.25,
      sameTarget: 0.25,
      similarPredictions: 0.2,
      samePattern: 0.15,
      temporal: 0.15,
    };

    // Same source IP
    if (threat1.features.sourceIp === threat2.features.sourceIp) {
      score += weights.sameSource;
    }

    // Same destination IP
    if (threat1.features.destinationIp === threat2.features.destinationIp) {
      score += weights.sameTarget;
    }

    // Similar threat predictions
    const predictionSimilarity = this.cosineSimilarity(
      Object.values(threat1.predictions),
      Object.values(threat2.predictions)
    );
    score += weights.similarPredictions * predictionSimilarity;

    // Same anomalous patterns
    const commonPatterns = threat1.features.anomalousPatterns.filter((p) =>
      threat2.features.anomalousPatterns.includes(p)
    );
    if (commonPatterns.length > 0) {
      score += weights.samePattern * Math.min(commonPatterns.length / 3, 1);
    }

    // Temporal proximity (within 24 hours)
    const timeDiff = Math.abs(threat1.timestamp.getTime() - threat2.timestamp.getTime());
    if (timeDiff <= this.TEMPORAL_WINDOW) {
      score += weights.temporal * (1 - timeDiff / this.TEMPORAL_WINDOW);
    }

    return Math.min(score, 1);
  }

  /**
   * Find common factors between threats
   */
  private findCommonFactors(threat1: ThreatPrediction, threat2: ThreatPrediction): string[] {
    const factors: string[] = [];

    if (threat1.features.sourceIp === threat2.features.sourceIp) {
      factors.push(`Same Source IP: ${threat1.features.sourceIp}`);
    }

    if (threat1.features.destinationIp === threat2.features.destinationIp) {
      factors.push(`Same Destination IP: ${threat1.features.destinationIp}`);
    }

    if (threat1.features.asn === threat2.features.asn) {
      factors.push(`Same ASN: ${threat1.features.asn}`);
    }

    if (threat1.features.protocol === threat2.features.protocol) {
      factors.push(`Same Protocol: ${threat1.features.protocol}`);
    }

    const commonPatterns = threat1.features.anomalousPatterns.filter((p) =>
      threat2.features.anomalousPatterns.includes(p)
    );
    if (commonPatterns.length > 0) {
      factors.push(`Shared Patterns: ${commonPatterns.join(', ')}`);
    }

    if (
      threat1.predictions.malware > 0.7 &&
      threat2.predictions.malware > 0.7
    ) {
      factors.push('Both identified as malware');
    }

    return factors;
  }

  /**
   * Get shared attributes between threats
   */
  private getSharedAttributes(threat1: ThreatPrediction, threat2: ThreatPrediction): Record<string, any> {
    return {
      sourceIp: threat1.features.sourceIp === threat2.features.sourceIp ? threat1.features.sourceIp : null,
      destinationIp: threat1.features.destinationIp === threat2.features.destinationIp ? threat1.features.destinationIp : null,
      protocol: threat1.features.protocol === threat2.features.protocol ? threat1.features.protocol : null,
      asn: threat1.features.asn === threat2.features.asn ? threat1.features.asn : null,
      country: threat1.features.geoLocation.country === threat2.features.geoLocation.country ? threat1.features.geoLocation.country : null,
      riskScoreDiff: Math.abs(threat1.riskScore - threat2.riskScore),
    };
  }

  /**
   * Correlate threat with existing threats
   */
  private correlateWithExistingThreats(threat: ThreatPrediction): void {
    const correlatedThreats = this.findCorrelatedThreats(threat.threatId);

    if (correlatedThreats.length > 0) {
      const correlation: ThreatCorrelation = {
        primaryThreatId: threat.threatId,
        correlatedThreats,
        correlationScore: correlatedThreats.reduce((sum, t) => sum + t.correlationScore, 0) / correlatedThreats.length,
        correlationType: this.determineCorrelationType(threat, correlatedThreats),
        lastUpdated: new Date(),
      };

      this.correlations.set(threat.threatId, correlation);
    }
  }

  /**
   * Determine type of correlation
   */
  private determineCorrelationType(
    threat: ThreatPrediction,
    correlated: CorrelatedThreat[]
  ): ThreatCorrelation['correlationType'] {
    if (correlated.some((t) => threat.features.sourceIp === this.threats.get(t.threatId)?.features.sourceIp)) {
      return 'same-source';
    }
    if (correlated.some((t) => threat.features.destinationIp === this.threats.get(t.threatId)?.features.destinationIp)) {
      return 'same-target';
    }
    if (correlated.some((t) => {
      const other = this.threats.get(t.threatId);
      return threat.features.anomalousPatterns.some((p) => other?.features.anomalousPatterns.includes(p));
    })) {
      return 'same-pattern';
    }

    const timeDiff = correlated.reduce((max, t) => {
      const other = this.threats.get(t.threatId);
      return Math.max(max, Math.abs(threat.timestamp.getTime() - (other?.timestamp.getTime() || 0)));
    }, 0);

    if (timeDiff <= this.TEMPORAL_WINDOW) {
      return 'timeframe';
    }

    return 'same-campaign';
  }

  /**
   * Perform comprehensive correlation analysis
   */
  analyzeCorrelations(): CorrelationAnalysis {
    const threatArray = Array.from(this.threats.values());

    // Create threat clusters
    const clusters = this.clusterThreats(threatArray);

    // Build threat network
    const networkNodes = this.buildThreatNetwork(threatArray);

    // Identify temporal patterns
    const temporalPatterns = this.identifyTemporalPatterns(threatArray);

    return {
      totalThreats: threatArray.length,
      correlationClusters: clusters,
      threatNetwork: networkNodes,
      temporalPatterns,
    };
  }

  /**
   * Cluster threats using hierarchical clustering
   */
  private clusterThreats(threats: ThreatPrediction[]): ThreatCluster[] {
    if (threats.length === 0) return [];

    const clusters: ThreatCluster[] = [];
    const processed = new Set<string>();

    for (const threat of threats) {
      if (processed.has(threat.threatId)) continue;

      const cluster: ThreatCluster = {
        clusterId: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threatIds: [threat.threatId],
        clusterSize: 1,
        confidence: 1.0,
        commonCharacteristics: [],
        likelyAttackName: this.suggestAttackName(threat),
        estimatedOrigin: threat.features.geoLocation.country,
      };

      processed.add(threat.threatId);

      // Find similar threats
      for (const other of threats) {
        if (processed.has(other.threatId)) continue;

        const score = this.calculateCorrelationScore(threat, other);
        if (score >= this.CORRELATION_THRESHOLD) {
          cluster.threatIds.push(other.threatId);
          cluster.clusterSize++;
          processed.add(other.threatId);
        }
      }

      if (cluster.threatIds.length > 1) {
        cluster.confidence = Math.min(
          cluster.threatIds.reduce((sum, id) => {
            const t = this.threats.get(id);
            return sum + (t?.confidenceScore || 0);
          }, 0) / cluster.threatIds.length,
          1
        );

        const commonChars = this.getClusterCommonCharacteristics(cluster);
        cluster.commonCharacteristics = commonChars;
      }

      clusters.push(cluster);
    }

    return clusters.sort((a, b) => b.clusterSize - a.clusterSize);
  }

  /**
   * Get common characteristics for a cluster
   */
  private getClusterCommonCharacteristics(cluster: ThreatCluster): string[] {
    const characteristics: string[] = [];
    const threats = cluster.threatIds.map((id) => this.threats.get(id)).filter(Boolean) as ThreatPrediction[];

    if (threats.length === 0) return [];

    // Find common source ASN
    const asnMap = new Map<string, number>();
    threats.forEach((t) => {
      asnMap.set(t.features.asn, (asnMap.get(t.features.asn) || 0) + 1);
    });
    const commonAsn = Array.from(asnMap.entries()).sort((a, b) => b[1] - a[1])[0];
    if (commonAsn && commonAsn[1] > threats.length / 2) {
      characteristics.push(`Common ASN: ${commonAsn[0]}`);
    }

    // Find common protocol
    const protocolMap = new Map<string, number>();
    threats.forEach((t) => {
      protocolMap.set(t.features.protocol, (protocolMap.get(t.features.protocol) || 0) + 1);
    });
    const commonProtocol = Array.from(protocolMap.entries()).sort((a, b) => b[1] - a[1])[0];
    if (commonProtocol && commonProtocol[1] > threats.length / 2) {
      characteristics.push(`Protocol: ${commonProtocol[0]}`);
    }

    // Find common threat type
    const threatTypeMap = new Map<string, number>();
    threats.forEach((t) => {
      const topThreat = Object.entries(t.predictions).sort((a, b) => b[1] - a[1])[0];
      if (topThreat) {
        threatTypeMap.set(topThreat[0], (threatTypeMap.get(topThreat[0]) || 0) + 1);
      }
    });
    const commonThreatType = Array.from(threatTypeMap.entries()).sort((a, b) => b[1] - a[1])[0];
    if (commonThreatType) {
      characteristics.push(`Threat Type: ${commonThreatType[0]}`);
    }

    return characteristics;
  }

  /**
   * Suggest attack name based on threat patterns
   */
  private suggestAttackName(threat: ThreatPrediction): string {
    const predictions = threat.predictions;
    const topThreat = Object.entries(predictions).sort((a, b) => b[1] - a[1])[0];

    if (!topThreat) return 'Unknown Attack';

    const threatType = topThreat[0];
    const confidence = topThreat[1];

    if (confidence > 0.9) {
      return `Confirmed ${threatType.toUpperCase()} Attack`;
    } else if (confidence > 0.7) {
      return `Suspected ${threatType.toUpperCase()} Activity`;
    } else {
      return `Potential ${threatType.toUpperCase()} Pattern`;
    }
  }

  /**
   * Build threat network graph
   */
  private buildThreatNetwork(threats: ThreatPrediction[]): ThreatNetworkNode[] {
    const nodes: ThreatNetworkNode[] = [];

    for (const threat of threats) {
      const correlations = this.findCorrelatedThreats(threat.threatId);
      const connections = correlations.map((c) => c.threatId);

      // Calculate centrality score (how connected this node is)
      let centralityScore = 0;
      for (const correlation of correlations) {
        centralityScore += correlation.correlationScore;
      }
      centralityScore = connections.length > 0 ? centralityScore / connections.length : 0;

      nodes.push({
        threatId: threat.threatId,
        severity: threat.riskScore > 0.8 ? 'critical' : threat.riskScore > 0.6 ? 'high' : 'medium',
        connections,
        connectionWeights: correlations.map((c) => c.correlationScore),
        centralityScore: Math.round(centralityScore * 100) / 100,
      });
    }

    return nodes;
  }

  /**
   * Identify temporal patterns
   */
  private identifyTemporalPatterns(threats: ThreatPrediction[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    const hourBuckets = new Map<number, number>();
    const dayBuckets = new Map<string, number>();

    for (const threat of threats) {
      const hour = threat.timestamp.getHours();
      hourBuckets.set(hour, (hourBuckets.get(hour) || 0) + 1);

      const day = threat.timestamp.toISOString().split('T')[0];
      dayBuckets.set(day, (dayBuckets.get(day) || 0) + 1);
    }

    // Find peak hours
    const peakHour = Array.from(hourBuckets.entries()).sort((a, b) => b[1] - a[1])[0];
    if (peakHour) {
      patterns.push({
        pattern: `Peak activity at ${peakHour[0]}:00 UTC`,
        frequency: 'hourly',
        occurrences: peakHour[1],
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        likelihood: (peakHour[1] / threats.length) * 100,
      });
    }

    // Find peak days
    const peakDay = Array.from(dayBuckets.entries()).sort((a, b) => b[1] - a[1])[0];
    if (peakDay) {
      patterns.push({
        pattern: `Increased activity on ${peakDay[0]}`,
        frequency: 'daily',
        occurrences: peakDay[1],
        timeRange: {
          start: new Date(peakDay[0]),
          end: new Date(peakDay[0]),
        },
        likelihood: (peakDay[1] / threats.length) * 100,
      });
    }

    // Detect escalation patterns
    if (threats.length > 5) {
      const recentThreats = threats.slice(-5);
      const avgRiskScore = recentThreats.reduce((sum, t) => sum + t.riskScore, 0) / recentThreats.length;

      patterns.push({
        pattern: 'Increasing threat severity trend',
        frequency: 'continuous',
        occurrences: recentThreats.length,
        timeRange: {
          start: recentThreats[0].timestamp,
          end: recentThreats[recentThreats.length - 1].timestamp,
        },
        likelihood: avgRiskScore * 100,
      });
    }

    return patterns;
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Get all correlations
   */
  getAllCorrelations(): ThreatCorrelation[] {
    return Array.from(this.correlations.values());
  }

  /**
   * Clear old threats (older than 30 days)
   */
  clearOldThreats(daysOld: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, threat] of this.threats) {
      if (threat.timestamp < cutoffDate) {
        this.threats.delete(id);
        this.correlations.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Singleton instance for threat correlation
 */
export const threatCorrelationEngine = new ThreatCorrelationEngine();
