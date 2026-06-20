import { ThreatPattern, AnalyticsResult } from './types';
import { ThreatPatternAnalyzer } from './threat-patterns';
import { AttackChainAnalyzer } from './attack-chain-analysis';
import { ThreatActorProfiler } from './threat-actor-profiling';
import { ThreatLifecycleAnalyzer } from './threat-lifecycle';
import { ThreatAttributionEngine } from './threat-attribution';
import { ThreatTrendingEngine } from './threat-trending';
import { ThreatCorrelationEngine } from './threat-correlation';
import { IOCAnalyzer } from './iocs-analysis';

export class ThreatAnalyticsEngine {
  private patternAnalyzer: ThreatPatternAnalyzer;
  private chainAnalyzer: AttackChainAnalyzer;
  private actorProfiler: ThreatActorProfiler;
  private lifecycleAnalyzer: ThreatLifecycleAnalyzer;
  private attributionEngine: ThreatAttributionEngine;
  private trendingEngine: ThreatTrendingEngine;
  private correlationEngine: ThreatCorrelationEngine;
  private iocAnalyzer: IOCAnalyzer;

  constructor() {
    this.patternAnalyzer = new ThreatPatternAnalyzer();
    this.chainAnalyzer = new AttackChainAnalyzer();
    this.actorProfiler = new ThreatActorProfiler();
    this.lifecycleAnalyzer = new ThreatLifecycleAnalyzer();
    this.attributionEngine = new ThreatAttributionEngine();
    this.trendingEngine = new ThreatTrendingEngine();
    this.correlationEngine = new ThreatCorrelationEngine();
    this.iocAnalyzer = new IOCAnalyzer();
  }

  analyzeIndicators(indicators: string[]): AnalyticsResult {
    const patterns = this.patternAnalyzer.detectPatterns(indicators);
    const timestamp = new Date();

    const riskScore = this.calculateAggregateRiskScore(patterns);
    const recommendations = this.generateRecommendations(patterns);

    return {
      timestamp,
      dataPoints: indicators.length,
      patterns,
      anomalies: [],
      riskScore,
      recommendations,
    };
  }

  performThreatAnalysis(threatId: string, data: Record<string, unknown>): object {
    const analysisResult = {
      threatId,
      timestamp: new Date().toISOString(),
      patterns: this.patternAnalyzer.getSuspiciousSignatures(),
      lifecycle: this.lifecycleAnalyzer.getLifecycleMetrics(threatId),
      attribution: this.attributionEngine.getTopAttributions(),
      trends: this.trendingEngine.getTrendVisualizationData(threatId, 'activity'),
      correlations: this.correlationEngine.findCorrelatedThreats(threatId),
    };

    return analysisResult;
  }

  private calculateAggregateRiskScore(patterns: ThreatPattern[]): number {
    if (patterns.length === 0) return 0;

    const scores = patterns.map((p) => {
      const baseScore = (p.severity * 0.6 + p.confidence * 100 * 0.4);
      return baseScore;
    });

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.min(100, avgScore * 1.2);
  }

  private generateRecommendations(patterns: ThreatPattern[]): string[] {
    const recommendations: string[] = [];

    if (patterns.length === 0) {
      return ['Continue monitoring for suspicious activity'];
    }

    const criticalPatterns = patterns.filter(p => p.severity > 80);
    if (criticalPatterns.length > 0) {
      recommendations.push('Critical threat detected - Initiate incident response');
    }

    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.9);
    if (highConfidencePatterns.length > 0) {
      recommendations.push('High confidence detections - Escalate to security team');
    }

    return recommendations.slice(0, 5);
  }

  getEngineStatus(): object {
    return {
      pattern_analyzer: 'active',
      chain_analyzer: 'active',
      actor_profiler: 'active',
      lifecycle_analyzer: 'active',
      attribution_engine: 'active',
      trending_engine: 'active',
      correlation_engine: 'active',
      ioc_analyzer: 'active',
      timestamp: new Date().toISOString(),
    };
  }

  reset(): void {
    this.patternAnalyzer = new ThreatPatternAnalyzer();
    this.chainAnalyzer = new AttackChainAnalyzer();
    this.actorProfiler = new ThreatActorProfiler();
    this.lifecycleAnalyzer = new ThreatLifecycleAnalyzer();
    this.attributionEngine = new ThreatAttributionEngine();
    this.trendingEngine = new ThreatTrendingEngine();
    this.correlationEngine = new ThreatCorrelationEngine();
    this.iocAnalyzer = new IOCAnalyzer();
  }

  // Expose sub-engines for advanced use
  getPatternAnalyzer(): ThreatPatternAnalyzer {
    return this.patternAnalyzer;
  }

  getChainAnalyzer(): AttackChainAnalyzer {
    return this.chainAnalyzer;
  }

  getActorProfiler(): ThreatActorProfiler {
    return this.actorProfiler;
  }

  getLifecycleAnalyzer(): ThreatLifecycleAnalyzer {
    return this.lifecycleAnalyzer;
  }

  getAttributionEngine(): ThreatAttributionEngine {
    return this.attributionEngine;
  }

  getTrendingEngine(): ThreatTrendingEngine {
    return this.trendingEngine;
  }

  getCorrelationEngine(): ThreatCorrelationEngine {
    return this.correlationEngine;
  }

  getIOCAnalyzer(): IOCAnalyzer {
    return this.iocAnalyzer;
  }
}

export default ThreatAnalyticsEngine;
