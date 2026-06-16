// Threat Correlation Engine - Links related IOCs and creates threat relationships

import { query } from '@/lib/db';
import { IOC, ThreatCorrelation, IOCRelationship } from './types';
import { cacheManager } from './cache-manager';

export class CorrelationEngine {
  async correlateIOCs(iocs: IOC[]): Promise<ThreatCorrelation[]> {
    const correlations: ThreatCorrelation[] = [];
    const processedPairs = new Set<string>();

    for (let i = 0; i < iocs.length; i++) {
      for (let j = i + 1; j < iocs.length; j++) {
        const ioc1 = iocs[i];
        const ioc2 = iocs[j];
        const pairKey = `${ioc1.id}:${ioc2.id}`;

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const relationship = this.findRelationship(ioc1, ioc2);
        if (relationship && relationship.strength > 50) {
          const correlation = await this.createCorrelation([ioc1, ioc2], relationship);
          correlations.push(correlation);
        }
      }
    }

    return correlations;
  }

  async findRelatedIOCs(ioc: IOC, limit: number = 20): Promise<IOC[]> {
    const cacheKey = `correlate:${ioc.id}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await query(
        `SELECT DISTINCT ti.* FROM threat_indicators ti
         JOIN ioc_relationships ir ON ti.id = ir.target_id
         WHERE ir.source_id = $1 AND ir.strength > 50
         ORDER BY ir.strength DESC
         LIMIT $2`,
        [ioc.id, limit]
      );

      const relatedIOCs = result.rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        type: String(row.type) as IOC['type'],
        value: String(row.value),
        source: String(row.source),
        confidence: Number(row.confidence),
        firstSeen: new Date(String(row.first_seen)),
        lastSeen: new Date(String(row.last_seen)),
        tags: JSON.parse(String(row.tags || '[]')),
        context: JSON.parse(String(row.context || '{}')),
      }));

      cacheManager.set(cacheKey, relatedIOCs, 3600000); // 1 hour cache

      return relatedIOCs;
    } catch (error) {
      console.error('[CorrelationEngine] Find related error:', error);
      return [];
    }
  }

  async getIOCGraph(iocId: string, depth: number = 2): Promise<{
    root: IOC;
    nodes: IOC[];
    edges: IOCRelationship[];
  }> {
    const cacheKey = `graph:${iocId}:${depth}`;
    const cached = cacheManager.get<unknown>(cacheKey);

    if (cached) {
      return cached as { root: IOC; nodes: IOC[]; edges: IOCRelationship[] };
    }

    const nodes: Map<string, IOC> = new Map();
    const edges: IOCRelationship[] = [];

    try {
      // Fetch root IOC
      const rootResult = await query(
        `SELECT * FROM threat_indicators WHERE id = $1`,
        [iocId]
      );

      if (rootResult.rows.length === 0) {
        throw new Error(`IOC not found: ${iocId}`);
      }

      const rootRow = rootResult.rows[0] as Record<string, unknown>;
      const root: IOC = {
        id: String(rootRow.id),
        type: String(rootRow.type) as IOC['type'],
        value: String(rootRow.value),
        source: String(rootRow.source),
        confidence: Number(rootRow.confidence),
        firstSeen: new Date(String(rootRow.first_seen)),
        lastSeen: new Date(String(rootRow.last_seen)),
        tags: JSON.parse(String(rootRow.tags || '[]')),
        context: JSON.parse(String(rootRow.context || '{}')),
      };

      nodes.set(root.id, root);

      // Fetch relationships in layers
      for (let d = 0; d < depth; d++) {
        const currentNodeIds = Array.from(nodes.keys());
        if (currentNodeIds.length === 0) break;

        const relResult = await query(
          `SELECT * FROM ioc_relationships
           WHERE source_id = ANY($1) AND strength > 40`,
          [currentNodeIds]
        );

        for (const rel of relResult.rows) {
          const targetId = String(rel.target_id);
          edges.push({
            sourceId: String(rel.source_id),
            targetId,
            type: String(rel.type) as IOCRelationship['type'],
            strength: Number(rel.strength),
          });

          if (!nodes.has(targetId)) {
            const iocResult = await query(
              `SELECT * FROM threat_indicators WHERE id = $1`,
              [targetId]
            );

            if (iocResult.rows.length > 0) {
              const iocRow = iocResult.rows[0] as Record<string, unknown>;
              nodes.set(targetId, {
                id: targetId,
                type: String(iocRow.type) as IOC['type'],
                value: String(iocRow.value),
                source: String(iocRow.source),
                confidence: Number(iocRow.confidence),
                firstSeen: new Date(String(iocRow.first_seen)),
                lastSeen: new Date(String(iocRow.last_seen)),
                tags: JSON.parse(String(iocRow.tags || '[]')),
                context: JSON.parse(String(iocRow.context || '{}')),
              });
            }
          }
        }
      }

      const graph = {
        root,
        nodes: Array.from(nodes.values()),
        edges,
      };

      cacheManager.set(cacheKey, graph, 1800000); // 30 minutes cache

      return graph;
    } catch (error) {
      console.error('[CorrelationEngine] Graph generation error:', error);
      throw error;
    }
  }

  private findRelationship(ioc1: IOC, ioc2: IOC): IOCRelationship | null {
    // Domain resolves to IP
    if (ioc1.type === 'domain' && ioc2.type === 'ip') {
      if (ioc1.context?.resolvedIPs?.includes(ioc2.value)) {
        return {
          sourceId: ioc1.id,
          targetId: ioc2.id,
          type: 'resolves-to',
          strength: 95,
        };
      }
    }

    // URL hosted on domain/IP
    if (ioc1.type === 'url' && (ioc2.type === 'domain' || ioc2.type === 'ip')) {
      try {
        const url = new URL(ioc1.value);
        const host = url.hostname;
        if (host === ioc2.value) {
          return {
            sourceId: ioc1.id,
            targetId: ioc2.id,
            type: 'hosted-on',
            strength: 100,
          };
        }
      } catch {
        // Invalid URL
      }
    }

    // Common tags indicate relationship
    const commonTags = this.getCommonTags(ioc1.tags, ioc2.tags);
    if (commonTags.length > 0 && commonTags.length >= Math.min(ioc1.tags.length, ioc2.tags.length) * 0.5) {
      return {
        sourceId: ioc1.id,
        targetId: ioc2.id,
        type: 'related-to',
        strength: Math.min(100, 50 + commonTags.length * 10),
      };
    }

    // Same source/similar confidence
    if (ioc1.source === ioc2.source && Math.abs(ioc1.confidence - ioc2.confidence) < 20) {
      return {
        sourceId: ioc1.id,
        targetId: ioc2.id,
        type: 'related-to',
        strength: 60,
      };
    }

    return null;
  }

  private getCommonTags(tags1: string[], tags2: string[]): string[] {
    return tags1.filter((tag) => tags2.includes(tag));
  }

  private async createCorrelation(
    iocs: IOC[],
    relationship: IOCRelationship
  ): Promise<ThreatCorrelation> {
    return {
      id: `corr:${iocs[0].id}:${iocs[1].id}`,
      iocs,
      correlationType: this.determineCorrelationType(iocs),
      confidence: relationship.strength / 100,
      relationships: [relationship],
      detectedAt: new Date(),
    };
  }

  private determineCorrelationType(
    iocs: IOC[]
  ): 'campaign' | 'actor' | 'infrastructure' | 'malware' {
    const types = iocs.map((ioc) => ioc.type);
    const tags = iocs.flatMap((ioc) => ioc.tags);

    if (tags.some((t) => t.includes('campaign'))) return 'campaign';
    if (tags.some((t) => t.includes('apt'))) return 'actor';
    if (types.includes('ip') && types.includes('domain')) return 'infrastructure';
    if (tags.some((t) => t.includes('malware'))) return 'malware';

    return 'infrastructure';
  }
}

export const correlationEngine = new CorrelationEngine();
