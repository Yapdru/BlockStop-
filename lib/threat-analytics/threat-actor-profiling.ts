import { ThreatActor, AttributionConfidence } from './types';
import { calculateSimilarity, aggregateScores } from './utils';
import { ATTRIBUTION_EVIDENCE_TYPES } from './constants';

export class ThreatActorProfiler {
  private actors: Map<string, ThreatActor> = new Map();
  private actorRelationships: Map<string, Set<string>> = new Map();
  private capabilityInventory: Map<string, string[]> = new Map();

  registerActor(actor: ThreatActor): void {
    this.actors.set(actor.id, actor);
    this.capabilityInventory.set(actor.id, actor.capabilities);
  }

  profileActorCapabilities(actorId: string): string[] {
    return this.capabilityInventory.get(actorId) || [];
  }

  attributeThreat(indicators: string[], metadata: Record<string, unknown>): AttributionConfidence[] {
    const attributions: AttributionConfidence[] = [];

    this.actors.forEach((actor) => {
      const capabilityScore = this.calculateCapabilityMatch(indicators, actor);
      const infrastructureScore = this.evaluateInfrastructure(metadata, actor);
      const motiveScore = this.evaluateMotive(metadata, actor);

      const overallConfidence = (capabilityScore * 0.4 + infrastructureScore * 0.35 + motiveScore * 0.25);

      if (overallConfidence >= 0.5) {
        attributions.push({
          actor: actor.name,
          confidence: overallConfidence,
          evidence: this.collectEvidence(actor, indicators, metadata),
          motive: actor.motivations[0] || 'unknown',
          capability: this.selectTopCapability(actor, indicators),
        });
      }
    });

    return attributions.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateCapabilityMatch(indicators: string[], actor: ThreatActor): number {
    let matches = 0;
    indicators.forEach((ind) => {
      const match = actor.capabilities.some(cap => calculateSimilarity(ind, cap) > 0.7);
      if (match) matches++;
    });
    return Math.min(1, matches / Math.max(1, indicators.length));
  }

  private evaluateInfrastructure(metadata: Record<string, unknown>, actor: ThreatActor): number {
    const infrastructure = metadata.infrastructure as string | undefined;
    if (!infrastructure) return 0.3;

    const similarActors = Array.from(this.actors.values())
      .filter(a => a.id !== actor.id && (a.infrastructure || '').includes(infrastructure))
      .length;

    return Math.min(1, 0.5 + (similarActors * 0.1));
  }

  private evaluateMotive(metadata: Record<string, unknown>, actor: ThreatActor): number {
    const targetSector = metadata.targetSector as string | undefined;
    if (!targetSector) return 0.3;

    const motiveMatch = actor.targetedSectors.some(sec => sec.toLowerCase() === targetSector.toLowerCase());
    return motiveMatch ? 0.9 : 0.3;
  }

  private collectEvidence(actor: ThreatActor, indicators: string[], metadata: Record<string, unknown>): string[] {
    const evidence: string[] = [];

    const capabilities = actor.capabilities.filter(cap =>
      indicators.some(ind => calculateSimilarity(ind, cap) > 0.7)
    );
    if (capabilities.length > 0) {
      evidence.push(`Matching capabilities: ${capabilities.slice(0, 2).join(', ')}`);
    }

    if (actor.lastActive && actor.lastActive.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) {
      evidence.push('Actor recently active');
    }

    if (actor.knownCampaigns.length > 0) {
      evidence.push(`Part of known campaign: ${actor.knownCampaigns[0]}`);
    }

    return evidence.slice(0, 3);
  }

  private selectTopCapability(actor: ThreatActor, indicators: string[]): string {
    const matches = actor.capabilities
      .map(cap => ({
        capability: cap,
        score: Math.max(...indicators.map(ind => calculateSimilarity(ind, cap))),
      }))
      .sort((a, b) => b.score - a.score);

    return matches[0]?.capability || actor.capabilities[0] || 'unknown';
  }

  getActorThreatLevel(actorId: string): 'critical' | 'high' | 'medium' | 'low' {
    const actor = this.actors.get(actorId);
    return actor?.riskLevel || 'medium';
  }

  findActorAliases(actorId: string): string[] {
    const actor = this.actors.get(actorId);
    return actor?.aliases || [];
  }

  getActorTargets(actorId: string): string[] {
    const actor = this.actors.get(actorId);
    return actor?.targetedSectors || [];
  }

  associateActors(actorId1: string, actorId2: string, confidence: number): void {
    if (!this.actorRelationships.has(actorId1)) {
      this.actorRelationships.set(actorId1, new Set());
    }
    if (confidence > 0.6) {
      this.actorRelationships.get(actorId1)!.add(actorId2);
    }
  }

  getRelatedActors(actorId: string): string[] {
    return Array.from(this.actorRelationships.get(actorId) || new Set());
  }

  calculateOperationalSecurityRating(actorId: string): number {
    const actor = this.actors.get(actorId);
    if (!actor) return 0;

    return normalizeScore(actor.operationalSecurityScore, 0, 100);
  }

  actorComparisonMatrix(): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};

    Array.from(this.actors.values()).forEach((actor1) => {
      matrix[actor1.id] = {};
      Array.from(this.actors.values()).forEach((actor2) => {
        if (actor1.id === actor2.id) {
          matrix[actor1.id][actor2.id] = 1;
        } else {
          const commonCaps = actor1.capabilities.filter(c =>
            actor2.capabilities.includes(c)
          ).length / Math.max(actor1.capabilities.length, actor2.capabilities.length);

          const commonTargets = actor1.targetedSectors.filter(t =>
            actor2.targetedSectors.includes(t)
          ).length / Math.max(actor1.targetedSectors.length, actor2.targetedSectors.length);

          matrix[actor1.id][actor2.id] = (commonCaps * 0.6 + commonTargets * 0.4);
        }
      });
    });

    return matrix;
  }
}

function normalizeScore(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}
