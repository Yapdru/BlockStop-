import { AttackChain, AttackPhase, AttackEvent } from './types';
import { aggregateScores, normalizeScore } from './utils';
import { ATTACK_PHASES, MITRE_TACTICS } from './constants';

export class AttackChainAnalyzer {
  private chains: Map<string, AttackChain> = new Map();

  createChain(events: AttackEvent[]): AttackChain {
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const chainId = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const phases = this.groupEventsIntoPhases(sortedEvents);
    const targetedAssets = this.extractAssets(sortedEvents);
    const successProbability = this.calculateSuccessProbability(sortedEvents, phases);
    const estimatedImpact = this.calculateEstimatedImpact(sortedEvents);
    const detectionGaps = this.identifyDetectionGaps(phases);

    const chain: AttackChain = {
      id: chainId,
      phases,
      timeline: sortedEvents,
      targetedAssets,
      successProbability,
      estimatedImpact,
      detectionGaps,
    };

    this.chains.set(chainId, chain);
    return chain;
  }

  private groupEventsIntoPhases(events: AttackEvent[]): AttackPhase[] {
    const phases: AttackPhase[] = [];
    const phaseMap = new Map<string, AttackEvent[]>();

    events.forEach((event) => {
      const phaseType = event.type;
      if (!phaseMap.has(phaseType)) {
        phaseMap.set(phaseType, []);
      }
      phaseMap.get(phaseType)!.push(event);
    });

    let phaseId = 0;
    phaseMap.forEach((phaseEvents, phaseType) => {
      const mitreTactics = this.mapPhaseToTactics(phaseType);
      const techniques = this.extractTechniques(phaseEvents);
      const observables = this.extractObservables(phaseEvents);
      const confidence = this.calculatePhaseConfidence(phaseEvents);

      phases.push({
        id: `phase-${phaseId++}`,
        mitreTactics,
        techniques,
        observables,
        timestamp: phaseEvents[0].timestamp,
        confidence,
      });
    });

    return phases;
  }

  private mapPhaseToTactics(phaseType: string): string[] {
    const tacticsMap: Record<string, string[]> = {
      'reconnaissance': ['reconnaissance', 'resource-development'],
      'exploitation': ['initial-access', 'execution'],
      'lateral-movement': ['lateral-movement', 'privilege-escalation'],
      'exfiltration': ['collection', 'exfiltration', 'command-control'],
      'impact': ['impact'],
    };
    return tacticsMap[phaseType] || [];
  }

  private extractTechniques(events: AttackEvent[]): string[] {
    const techniques = new Set<string>();
    events.forEach((event) => {
      event.indicators.forEach((ind) => {
        if (ind.includes('technique')) techniques.add(ind);
      });
    });
    return Array.from(techniques);
  }

  private extractObservables(events: AttackEvent[]): string[] {
    return events.flatMap(e => e.indicators);
  }

  private calculatePhaseConfidence(events: AttackEvent[]): number {
    const avgSeverity = events.reduce((sum, e) => sum + e.severity, 0) / events.length;
    return Math.min(1, (avgSeverity / 100) * 0.9 + 0.1);
  }

  private extractAssets(events: AttackEvent[]): string[] {
    const assets = new Set<string>();
    events.forEach((event) => {
      assets.add(event.target);
    });
    return Array.from(assets);
  }

  private calculateSuccessProbability(events: AttackEvent[], phases: AttackPhase[]): number {
    const phaseConfidences = phases.map(p => p.confidence);
    const avgConfidence = phaseConfidences.length > 0 ? aggregateScores(phaseConfidences) : 0;

    const eventSequence = this.evaluateEventSequence(events);
    const probability = (avgConfidence * 0.6 + eventSequence * 0.4) / 100;

    return normalizeScore(probability, 0, 1);
  }

  private evaluateEventSequence(events: AttackEvent[]): number {
    if (events.length < 2) return 50;

    let sequenceScore = 0;
    const validSequences = [
      ['reconnaissance', 'exploitation'],
      ['exploitation', 'lateral-movement'],
      ['lateral-movement', 'exfiltration'],
      ['exfiltration', 'impact'],
    ];

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i].type;
      const next = events[i + 1].type;
      if (validSequences.some(seq => seq[0] === current && seq[1] === next)) {
        sequenceScore += 20;
      }
    }

    return Math.min(100, sequenceScore + (events.length * 5));
  }

  private calculateEstimatedImpact(events: AttackEvent[]): number {
    const severities = events.map(e => e.severity);
    const maxSeverity = Math.max(...severities);
    const affectedAssets = new Set(events.map(e => e.target)).size;

    const impactScore = (maxSeverity * 0.6 + affectedAssets * 5);
    return normalizeScore(impactScore, 0, 100);
  }

  private identifyDetectionGaps(phases: AttackPhase[]): string[] {
    const gaps: string[] = [];

    phases.forEach((phase) => {
      if (phase.confidence < 0.6) {
        gaps.push(`Low confidence detection in phase: ${phase.mitreTactics[0] || 'unknown'}`);
      }
      if (phase.observables.length === 0) {
        gaps.push(`No observables detected in phase: ${phase.mitreTactics[0] || 'unknown'}`);
      }
    });

    return gaps;
  }

  analyzeChain(chainId: string): object {
    const chain = this.chains.get(chainId);
    if (!chain) return {};

    return {
      id: chain.id,
      phases: chain.phases.length,
      totalEvents: chain.timeline.length,
      successProbability: (chain.successProbability * 100).toFixed(1),
      estimatedImpact: chain.estimatedImpact,
      assetCount: chain.targetedAssets.length,
      detectionGaps: chain.detectionGaps.length,
    };
  }

  getHighRiskChains(): AttackChain[] {
    return Array.from(this.chains.values())
      .filter(chain => chain.successProbability > 0.7 || chain.estimatedImpact > 75)
      .sort((a, b) => (b.successProbability * b.estimatedImpact) - (a.successProbability * a.estimatedImpact));
  }

  predictNextPhase(chainId: string): string | null {
    const chain = this.chains.get(chainId);
    if (!chain || chain.phases.length === 0) return null;

    const lastPhase = chain.phases[chain.phases.length - 1];
    const transitions: Record<string, string> = {
      'reconnaissance': 'exploitation',
      'exploitation': 'lateral-movement',
      'lateral-movement': 'exfiltration',
      'exfiltration': 'impact',
    };

    const lastTactic = lastPhase.mitreTactics[0];
    return transitions[lastTactic] || null;
  }
}
