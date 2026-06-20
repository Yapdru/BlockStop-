import { ThreatPattern, AnalyticsResult, AnomalyRecord } from './types';
import { calculatePatternScore, detectAnomalies, calculateTrend } from './utils';
import { THREAT_CATEGORIES, MIN_PATTERN_CONFIDENCE } from './constants';

export class ThreatPatternAnalyzer {
  private patterns: Map<string, ThreatPattern> = new Map();
  private patternFrequency: Map<string, number[]> = new Map();

  addPattern(pattern: ThreatPattern): void {
    this.patterns.set(pattern.id, pattern);
    if (!this.patternFrequency.has(pattern.id)) {
      this.patternFrequency.set(pattern.id, []);
    }
    this.patternFrequency.get(pattern.id)!.push(pattern.occurrences);
  }

  detectPatterns(indicators: string[]): ThreatPattern[] {
    const detectedPatterns: ThreatPattern[] = [];

    this.patterns.forEach((pattern) => {
      const matchCount = pattern.signatures.filter(sig =>
        indicators.some(ind => ind.includes(sig) || sig.includes(ind))
      ).length;

      const matchRatio = matchCount / pattern.signatures.length;
      if (matchRatio >= MIN_PATTERN_CONFIDENCE && pattern.confidence >= MIN_PATTERN_CONFIDENCE) {
        detectedPatterns.push(pattern);
      }
    });

    return detectedPatterns.sort((a, b) => calculatePatternScore(b) - calculatePatternScore(a));
  }

  analyzePatternEvolution(patternId: string): AnalyticsResult {
    const pattern = this.patterns.get(patternId);
    const frequencies = this.patternFrequency.get(patternId) || [];

    const anomalies = detectAnomalies(frequencies, frequencies[0] || 0);
    const trendValue = frequencies.length > 0 ? (frequencies[frequencies.length - 1] / frequencies[0]) : 1;

    return {
      timestamp: new Date(),
      dataPoints: frequencies.length,
      patterns: pattern ? [pattern] : [],
      anomalies,
      riskScore: pattern ? calculatePatternScore(pattern) : 0,
      recommendations: this.generateRecommendations(pattern, anomalies, trendValue),
    };
  }

  private generateRecommendations(pattern: ThreatPattern | undefined, anomalies: AnomalyRecord[], trend: number): string[] {
    const recommendations: string[] = [];

    if (!pattern) return recommendations;

    if (pattern.severity > 75) {
      recommendations.push(`Immediate investigation required for ${pattern.name} - High severity pattern detected`);
    }

    if (anomalies.length > 0) {
      recommendations.push('Unusual pattern frequency detected - Monitor for coordinated activity');
    }

    if (trend > 1.5) {
      recommendations.push('Pattern occurrence increasing - Consider escalating threat level');
    }

    if (pattern.category === THREAT_CATEGORIES.C2) {
      recommendations.push('Command & Control indicators detected - Block identified infrastructure immediately');
    }

    return recommendations;
  }

  getPatternsByCategory(category: string): ThreatPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.category === category);
  }

  calculateCategoryRisk(category: string): number {
    const patterns = this.getPatternsByCategory(category);
    if (patterns.length === 0) return 0;

    const totalScore = patterns.reduce((sum, p) => sum + calculatePatternScore(p), 0);
    return Math.min(100, (totalScore / patterns.length) * 0.8);
  }

  getSuspiciousSignatures(threshold: number = 0.8): string[] {
    const signatures: Set<string> = new Set();

    this.patterns.forEach((pattern) => {
      if (pattern.confidence >= threshold && pattern.severity >= 60) {
        pattern.signatures.forEach(sig => signatures.add(sig));
      }
    });

    return Array.from(signatures);
  }

  getPatternCorrelations(patternId: string): Map<string, number> {
    const pattern = this.patterns.get(patternId);
    const correlations = new Map<string, number>();

    if (!pattern) return correlations;

    this.patterns.forEach((otherPattern) => {
      if (otherPattern.id === patternId) return;

      const commonSignatures = pattern.signatures.filter(sig =>
        otherPattern.signatures.includes(sig)
      ).length;

      if (commonSignatures > 0) {
        const similarity = commonSignatures / Math.max(pattern.signatures.length, otherPattern.signatures.length);
        correlations.set(otherPattern.id, similarity);
      }
    });

    return correlations;
  }

  updatePatternConfidence(patternId: string, newEvidence: number): void {
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      pattern.confidence = Math.min(1, pattern.confidence + newEvidence * 0.01);
      pattern.lastSeen = new Date();
      pattern.occurrences++;
    }
  }

  exportPatternSignatures(): Record<string, string[]> {
    const export_data: Record<string, string[]> = {};
    this.patterns.forEach((pattern) => {
      export_data[pattern.id] = pattern.signatures;
    });
    return export_data;
  }
}
