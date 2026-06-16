// Attribution Engine - Maps IOCs to threat actors

import { query } from '@/lib/db';
import { IOC, ThreatActor } from './types';
import { cacheManager } from './cache-manager';

export class AttributionEngine {
  private knownActors: Map<string, ThreatActor> = new Map();

  async initialize(): Promise<void> {
    try {
      const result = await query(`SELECT * FROM threat_actors WHERE active = true`);

      for (const row of result.rows) {
        const actor: ThreatActor = {
          id: String(row.id),
          name: String(row.name),
          aliases: JSON.parse(String(row.aliases || '[]')),
          description: String(row.description),
          origin: String(row.origin),
          motivations: JSON.parse(String(row.motivations || '[]')),
          capabilities: JSON.parse(String(row.capabilities || '[]')),
          targetedSectors: JSON.parse(String(row.targeted_sectors || '[]')),
          campaigns: JSON.parse(String(row.campaigns || '[]')),
          infrastructure: [],
          firstSeen: new Date(String(row.first_seen)),
          lastSeen: new Date(String(row.last_seen)),
          confidence: Number(row.confidence),
        };

        this.knownActors.set(actor.id, actor);
      }

      console.log(`[AttributionEngine] Loaded ${this.knownActors.size} threat actors`);
    } catch (error) {
      console.error('[AttributionEngine] Initialization error:', error);
    }
  }

  async attributeIOC(ioc: IOC): Promise<Array<{ actor: ThreatActor; confidence: number }>> {
    const cacheKey = `attribute:${ioc.id}`;
    const cached = cacheManager.get<Array<{ actor: ThreatActor; confidence: number }>>(cacheKey);

    if (cached) {
      return cached;
    }

    const attributions: Array<{ actor: ThreatActor; confidence: number }> = [];

    for (const actor of this.knownActors.values()) {
      const confidence = this.calculateAttributionConfidence(ioc, actor);
      if (confidence > 0.3) {
        attributions.push({ actor, confidence });
      }
    }

    // Sort by confidence
    attributions.sort((a, b) => b.confidence - a.confidence);

    cacheManager.set(cacheKey, attributions, 3600000); // 1 hour cache

    return attributions;
  }

  async attributeIOCs(iocs: IOC[]): Promise<Map<string, Array<{ actor: ThreatActor; confidence: number }>>> {
    const attributions = new Map<string, Array<{ actor: ThreatActor; confidence: number }>>();

    for (const ioc of iocs) {
      const attribution = await this.attributeIOC(ioc);
      attributions.set(ioc.id, attribution);
    }

    return attributions;
  }

  private calculateAttributionConfidence(ioc: IOC, actor: ThreatActor): number {
    let confidence = 0;

    // Check tag matches
    for (const tag of ioc.tags) {
      // Match against actor name/aliases
      if (actor.aliases.some((alias) => tag.toLowerCase().includes(alias.toLowerCase()))) {
        confidence += 0.3;
      }

      // Match against capabilities
      if (actor.capabilities.some((cap) => tag.toLowerCase().includes(cap.toLowerCase()))) {
        confidence += 0.2;
      }

      // Match against campaigns
      if (actor.campaigns.some((camp) => tag.toLowerCase().includes(camp.toLowerCase()))) {
        confidence += 0.25;
      }
    }

    // TTPs matching
    const iocTags = ioc.tags.join(' ').toLowerCase();
    const actorTTPs = [...actor.capabilities, ...actor.campaigns].join(' ').toLowerCase();

    if (this.calculateSimilarity(iocTags, actorTTPs) > 0.6) {
      confidence += 0.2;
    }

    // Infrastructure matching
    if (actor.infrastructure.some((inf) => inf.value === ioc.value)) {
      confidence += 0.4;
    }

    return Math.min(confidence, 1);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  async getActorProfile(actorId: string): Promise<ThreatActor | null> {
    const cacheKey = `actor:${actorId}`;
    const cached = cacheManager.get<ThreatActor>(cacheKey);

    if (cached) {
      return cached;
    }

    const actor = this.knownActors.get(actorId);

    if (actor) {
      cacheManager.set(cacheKey, actor, 3600000); // 1 hour cache
    }

    return actor || null;
  }

  async searchActors(query: string): Promise<ThreatActor[]> {
    const cacheKey = `search-actors:${query}`;
    const cached = cacheManager.get<ThreatActor[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await query(
        `SELECT * FROM threat_actors
         WHERE name ILIKE $1 OR aliases::text ILIKE $1
         ORDER BY confidence DESC
         LIMIT 20`,
        [`%${query}%`]
      );

      const actors = result.rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        aliases: JSON.parse(String(row.aliases || '[]')),
        description: String(row.description),
        origin: String(row.origin),
        motivations: JSON.parse(String(row.motivations || '[]')),
        capabilities: JSON.parse(String(row.capabilities || '[]')),
        targetedSectors: JSON.parse(String(row.targeted_sectors || '[]')),
        campaigns: JSON.parse(String(row.campaigns || '[]')),
        infrastructure: [],
        firstSeen: new Date(String(row.first_seen)),
        lastSeen: new Date(String(row.last_seen)),
        confidence: Number(row.confidence),
      }));

      cacheManager.set(cacheKey, actors, 1800000); // 30 minutes cache

      return actors;
    } catch (error) {
      console.error('[AttributionEngine] Search error:', error);
      return [];
    }
  }

  async createActor(actor: ThreatActor): Promise<void> {
    try {
      await query(
        `INSERT INTO threat_actors (
          id, name, aliases, description, origin, motivations, capabilities,
          targeted_sectors, campaigns, first_seen, last_seen, confidence, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
         ON CONFLICT (id) DO UPDATE SET
         name = $2, last_seen = $11, confidence = $12`,
        [
          actor.id,
          actor.name,
          JSON.stringify(actor.aliases),
          actor.description,
          actor.origin,
          JSON.stringify(actor.motivations),
          JSON.stringify(actor.capabilities),
          JSON.stringify(actor.targetedSectors),
          JSON.stringify(actor.campaigns),
          actor.firstSeen,
          actor.lastSeen,
          actor.confidence,
        ]
      );

      this.knownActors.set(actor.id, actor);
      cacheManager.deletePattern(/^actor:/);
      console.log(`[AttributionEngine] Created actor: ${actor.name}`);
    } catch (error) {
      console.error('[AttributionEngine] Create actor error:', error);
      throw error;
    }
  }
}

export const attributionEngine = new AttributionEngine();
