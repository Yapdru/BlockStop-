// Campaign Detector - Groups related IOCs into threat campaigns

import { query } from '@/lib/db';
import { IOC, Campaign } from './types';
import { cacheManager } from './cache-manager';

export class CampaignDetector {
  async detectCampaigns(iocs: IOC[]): Promise<Campaign[]> {
    const campaigns: Campaign[] = [];
    const clusters = this.clusterIOCs(iocs);

    for (const cluster of clusters) {
      const campaign = await this.createCampaign(cluster);
      campaigns.push(campaign);
    }

    return campaigns;
  }

  private clusterIOCs(iocs: IOC[]): IOC[][] {
    const clusters: IOC[][] = [];
    const processed = new Set<string>();

    for (const ioc of iocs) {
      if (processed.has(ioc.id)) continue;

      const cluster: IOC[] = [ioc];
      processed.add(ioc.id);

      // Find similar IOCs
      for (const other of iocs) {
        if (!processed.has(other.id) && this.areRelated(ioc, other)) {
          cluster.push(other);
          processed.add(other.id);
        }
      }

      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private areRelated(ioc1: IOC, ioc2: IOC): boolean {
    // Same source
    if (ioc1.source === ioc2.source) return true;

    // Common tags
    const commonTags = ioc1.tags.filter((tag) => ioc2.tags.includes(tag));
    if (commonTags.length > 0) return true;

    // Similar confidence and type
    if (ioc1.type === ioc2.type && Math.abs(ioc1.confidence - ioc2.confidence) < 15) {
      return true;
    }

    // Time proximity (within 24 hours)
    const timeDiff = Math.abs(ioc1.firstSeen.getTime() - ioc2.firstSeen.getTime());
    if (timeDiff < 24 * 60 * 60 * 1000) {
      return true;
    }

    return false;
  }

  private async createCampaign(cluster: IOC[]): Promise<Campaign> {
    // Generate campaign ID from cluster
    const campaignId = this.generateCampaignId(cluster);

    // Extract campaign name from tags
    const campaignName = this.extractCampaignName(cluster);

    // Extract actors
    const actors = this.extractActors(cluster);

    // Extract tactics/techniques
    const tactics = this.extractTactics(cluster);

    return {
      id: campaignId,
      name: campaignName,
      description: `Campaign detected from ${cluster.length} related indicators`,
      startDate: new Date(Math.min(...cluster.map((ioc) => ioc.firstSeen.getTime()))),
      endDate: undefined,
      attributedActors: actors,
      tactics,
      techniques: this.extractTechniques(cluster),
      iocs: cluster,
      confidence: this.calculateConfidence(cluster),
      relatedCampaigns: [],
    };
  }

  private generateCampaignId(cluster: IOC[]): string {
    const combined = cluster.map((ioc) => ioc.id).sort().join(':');
    const hash = Buffer.from(combined).toString('base64').substring(0, 12);
    return `campaign:${hash}`;
  }

  private extractCampaignName(cluster: IOC[]): string {
    // Look for campaign names in tags
    const tags = cluster.flatMap((ioc) => ioc.tags);
    const campaignTags = tags.filter(
      (tag) => tag.includes('campaign') || tag.includes('operation') || tag.includes('apt')
    );

    if (campaignTags.length > 0) {
      return campaignTags[0].replace(/campaign|operation|apt/gi, '').trim() || 'Unknown Campaign';
    }

    // Generate from characteristics
    return `Campaign-${cluster[0].source}-${new Date().toLocaleDateString()}`;
  }

  private extractActors(cluster: IOC[]): string[] {
    const actors = new Set<string>();
    const tags = cluster.flatMap((ioc) => ioc.tags);

    const actorPatterns = ['apt', 'group', 'gang', 'team', 'lazarus', 'equation', 'fancy'];

    for (const tag of tags) {
      for (const pattern of actorPatterns) {
        if (tag.toLowerCase().includes(pattern)) {
          actors.add(tag);
        }
      }
    }

    return Array.from(actors);
  }

  private extractTactics(cluster: IOC[]): string[] {
    const tactics = new Set<string>();
    const tags = cluster.flatMap((ioc) => ioc.tags);

    const tacticPatterns = [
      'initial-access',
      'execution',
      'persistence',
      'privilege-escalation',
      'defense-evasion',
      'credential-access',
      'discovery',
      'lateral-movement',
      'collection',
      'exfiltration',
      'impact',
    ];

    for (const tag of tags) {
      for (const tactic of tacticPatterns) {
        if (tag.toLowerCase().includes(tactic)) {
          tactics.add(tactic);
        }
      }
    }

    return Array.from(tactics);
  }

  private extractTechniques(cluster: IOC[]): string[] {
    const techniques = new Set<string>();
    const tags = cluster.flatMap((ioc) => ioc.tags);

    const techniquePatterns = [
      'spear-phishing',
      'malware',
      'command-line',
      'powershell',
      'registry',
      'dns',
      'http',
      'ssh',
      'rdp',
      'c2',
    ];

    for (const tag of tags) {
      for (const technique of techniquePatterns) {
        if (tag.toLowerCase().includes(technique)) {
          techniques.add(technique);
        }
      }
    }

    return Array.from(techniques);
  }

  private calculateConfidence(cluster: IOC[]): number {
    const avgConfidence = cluster.reduce((sum, ioc) => sum + ioc.confidence, 0) / cluster.length;
    const clusterStrength = Math.min(cluster.length / 10, 1);

    return (avgConfidence + clusterStrength * 100) / 2 / 100;
  }

  async searchCampaigns(query: string): Promise<Campaign[]> {
    const cacheKey = `campaigns:search:${query}`;
    const cached = cacheManager.get<Campaign[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await query(
        `SELECT * FROM campaigns WHERE name ILIKE $1 OR description ILIKE $1 LIMIT 20`,
        [`%${query}%`]
      );

      const campaigns = result.rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        startDate: new Date(String(row.start_date)),
        endDate: row.end_date ? new Date(String(row.end_date)) : undefined,
        attributedActors: JSON.parse(String(row.attributed_actors || '[]')),
        tactics: JSON.parse(String(row.tactics || '[]')),
        techniques: JSON.parse(String(row.techniques || '[]')),
        iocs: [],
        confidence: Number(row.confidence),
        relatedCampaigns: JSON.parse(String(row.related_campaigns || '[]')),
      }));

      cacheManager.set(cacheKey, campaigns, 3600000); // 1 hour cache

      return campaigns;
    } catch (error) {
      console.error('[CampaignDetector] Search error:', error);
      return [];
    }
  }
}

export const campaignDetector = new CampaignDetector();
