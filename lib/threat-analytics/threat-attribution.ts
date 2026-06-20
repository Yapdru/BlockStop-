import { ThreatActor, AttributionConfidence } from './types';
import { calculateSimilarity, aggregateScores, normalizeScore } from './utils';

export class ThreatAttributionEngine {
  private attributionCache: Map<string, AttributionConfidence[]> = new Map();
  private actorProfiles: Map<string, ThreatActor> = new Map();
  private evidenceWeights = {
    toolset: 0.25,
    tactics: 0.25,
    targets: 0.2,
    timing: 0.15,
    infrastructure: 0.15,
  };

  registerActorProfile(actor: ThreatActor): void {
    this.actorProfiles.set(actor.id, actor);
  }

  performAttribution(indicators: Map<string, unknown>, metadata: Record<string, unknown>): AttributionConfidence[] {
    const cacheKey = this.generateCacheKey(indicators);
    const cached = this.attributionCache.get(cacheKey);

    if (cached) return cached;

    const attributions: AttributionConfidence[] = [];

    this.actorProfiles.forEach((actor) => {
      const toolsetScore = this.evaluateToolset(indicators, actor);
      const tacticsScore = this.evaluateTactics(indicators, actor);
      const targetsScore = this.evaluateTargets(metadata, actor);
      const timingScore = this.evaluateTiming(metadata, actor);
      const infrastructureScore = this.evaluateInfrastructure(indicators, actor);

      const scores = [toolsetScore, tacticsScore, targetsScore, timingScore, infrastructureScore];
      const weights = Object.values(this.evidenceWeights);
      const overallConfidence = aggregateScores(scores, weights);

      if (overallConfidence >= 0.4) {
        attributions.push({
          actor: actor.name,
          confidence: normalizeScore(overallConfidence, 0, 1),
          evidence: this.gatherEvidence(actor, indicators, metadata),
          motive: this.determineMotive(actor, metadata),
          capability: this.selectCapability(actor, indicators),
        });
      }
    });

    const sorted = attributions.sort((a, b) => b.confidence - a.confidence);
    this.attributionCache.set(cacheKey, sorted);

    return sorted;
  }

  private evaluateToolset(indicators: Map<string, unknown>, actor: ThreatActor): number {
    let matches = 0;
    let totalComparisons = 0;

    indicators.forEach((indicator) => {
      if (typeof indicator === 'string') {
        totalComparisons++;
        const match = actor.capabilities.some(cap =>
          calculateSimilarity(indicator, cap) > 0.75
        );
        if (match) matches++;
      }
    });

    return totalComparisons > 0 ? matches / totalComparisons : 0.3;
  }

  private evaluateTactics(indicators: Map<string, unknown>, actor: ThreatActor): number {
    let score = 0;
    indicators.forEach((indicator) => {
      if (typeof indicator === 'string') {
        const isMitreTactic = actor.capabilities.some(cap =>
          cap.toLowerCase().includes('tactic') || cap.toLowerCase().includes('technique')
        );
        if (isMitreTactic) score += 0.5;
      }
    });

    return Math.min(1, score / Math.max(1, indicators.size));
  }

  private evaluateTargets(metadata: Record<string, unknown>, actor: ThreatActor): number {
    const targetSector = metadata.targetSector as string | undefined;
    if (!targetSector) return 0.3;

    const exactMatch = actor.targetedSectors.some(sec =>
      sec.toLowerCase() === targetSector.toLowerCase()
    );

    if (exactMatch) return 1;

    const partialMatch = actor.targetedSectors.some(sec =>
      calculateSimilarity(sec, targetSector) > 0.7
    );

    return partialMatch ? 0.7 : 0.3;
  }

  private evaluateTiming(metadata: Record<string, unknown>, actor: ThreatActor): number {
    const eventTime = metadata.timestamp ? new Date(metadata.timestamp as string) : new Date();
    const lastActiveTime = actor.lastActive;

    if (!lastActiveTime) return 0.4;

    const daysSinceActive = (eventTime.getTime() - lastActiveTime.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 7) return 0.95;
    if (daysSinceActive < 30) return 0.75;
    if (daysSinceActive < 90) return 0.5;
    if (daysSinceActive < 180) return 0.3;

    return 0.1;
  }

  private evaluateInfrastructure(indicators: Map<string, unknown>, actor: ThreatActor): number {
    let infrastructureMatches = 0;
    let infrastructureChecks = 0;

    indicators.forEach((indicator) => {
      if (typeof indicator === 'string' && (indicator.includes('.') || indicator.includes(':'))) {
        infrastructureChecks++;
        const hasMatchingInfrastructure = actor.capabilities.some(cap =>
          cap.toLowerCase().includes('infrastructure') && calculateSimilarity(indicator, cap) > 0.7
        );
        if (hasMatchingInfrastructure) infrastructureMatches++;
      }
    });

    return infrastructureChecks > 0 ? infrastructureMatches / infrastructureChecks : 0.4;
  }

  private gatherEvidence(actor: ThreatActor, indicators: Map<string, unknown>, metadata: Record<string, unknown>): string[] {
    const evidence: string[] = [];

    if (actor.knownCampaigns.length > 0) {
      evidence.push(`Known campaigns: ${actor.knownCampaigns.slice(0, 2).join(', ')}`);
    }

    const capabilityMatch = actor.capabilities.filter(cap =>
      Array.from(indicators.values()).some(ind =>
        typeof ind === 'string' && calculateSimilarity(ind, cap) > 0.7
      )
    );
    if (capabilityMatch.length > 0) {
      evidence.push(`Capability match: ${capabilityMatch[0]}`);
    }

    const targetMatch = actor.targetedSectors.some(sec =>
      sec === metadata.targetSector
    );
    if (targetMatch) {
      evidence.push('Target sector match');
    }

    return evidence.slice(0, 3);
  }

  private determineMotive(actor: ThreatActor, metadata: Record<string, unknown>): string {
    if (actor.motivations.length === 0) return 'unknown';

    const targetSector = metadata.targetSector as string | undefined;
    const sectorMatch = actor.targetedSectors.find(sec =>
      targetSector && sec.toLowerCase() === targetSector.toLowerCase()
    );

    return sectorMatch ? actor.motivations[0] : 'likely ' + actor.motivations[0];
  }

  private selectCapability(actor: ThreatActor, indicators: Map<string, unknown>): string {
    const matches = actor.capabilities
      .map(cap => ({
        capability: cap,
        score: Math.max(...Array.from(indicators.values()).map(ind =>
          typeof ind === 'string' ? calculateSimilarity(ind, cap) : 0
        )),
      }))
      .sort((a, b) => b.score - a.score);

    return matches[0]?.capability || actor.capabilities[0] || 'unknown';
  }

  getTopAttributions(limit: number = 5): AttributionConfidence[] {
    const allAttributions: AttributionConfidence[] = [];
    this.attributionCache.forEach(attrs => allAttributions.push(...attrs));

    return allAttributions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  clearAttributionCache(): void {
    this.attributionCache.clear();
  }

  private generateCacheKey(indicators: Map<string, unknown>): string {
    const keys = Array.from(indicators.keys()).sort().join('|');
    return `attribution-${keys}`;
  }
}
