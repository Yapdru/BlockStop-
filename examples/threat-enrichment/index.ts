/**
 * Threat Enrichment Example Plugin
 * Demonstrates how to enrich threats with external intelligence
 */

import {
  Plugin,
  createPluginContext,
  HookType,
  PluginContext,
} from '@blockstop/plugin-sdk';

export class ThreatEnrichmentPlugin extends Plugin {
  private threatCache: Map<string, any> = new Map();

  async initialize() {
    super.initialize();
    this.context.logger.info('Threat Enrichment plugin initialized');

    // Register hook to listen for new threats
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        await this.enrichThreat(threat);
      },
      10 // High priority
    );

    this.context.logger.info('Threat enrichment hook registered');
  }

  private async enrichThreat(threat: any): Promise<void> {
    try {
      this.context.logger.debug('Enriching threat:', threat.id);

      // Check cache first
      if (this.threatCache.has(threat.id)) {
        this.context.logger.debug('Using cached enrichment for threat:', threat.id);
        return;
      }

      // Fetch intelligence from external sources
      const intelligence = await this.fetchIntelligence(threat.id);

      if (intelligence) {
        // Store enrichment in BlockStop
        await this.context.api.enrichThreat(threat.id, {
          additionalData: {
            reputation: intelligence.reputation,
            firstSeen: intelligence.firstSeen,
            lastSeen: intelligence.lastSeen,
            sources: intelligence.sources,
            tags: intelligence.tags,
            relatedIPs: intelligence.relatedIPs,
          },
          riskScore: intelligence.riskScore,
          confidence: intelligence.confidence,
          tags: intelligence.tags,
        });

        // Cache the enrichment
        this.threatCache.set(threat.id, intelligence);
        this.context.logger.info('Threat enriched successfully:', threat.id);
      }
    } catch (error) {
      this.context.logger.error(
        'Failed to enrich threat:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async fetchIntelligence(threatId: string): Promise<any> {
    // Example: Query external threat intelligence API
    // In production, use your own API endpoint
    try {
      // Simulate API call
      const intelligence = {
        reputation: Math.floor(Math.random() * 100),
        firstSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(),
        sources: ['ExternalThreatFeed', 'CommunityReports'],
        tags: ['malware', 'trojan', 'c2'],
        relatedIPs: [
          '192.168.1.1',
          '10.0.0.1',
        ],
        riskScore: 85,
        confidence: 0.95,
      };

      this.context.logger.debug(
        'Intelligence fetched:',
        intelligence
      );
      return intelligence;
    } catch (error) {
      this.context.logger.error(
        'Failed to fetch intelligence:',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  async execute(action: string, params?: Record<string, unknown>): Promise<any> {
    switch (action) {
      case 'enrichThreatManually':
        return await this.enrichThreat(params?.threat);

      case 'getCacheStats':
        return {
          cacheSize: this.threatCache.size,
          cachedThreats: Array.from(this.threatCache.keys()),
        };

      case 'clearCache':
        this.threatCache.clear();
        return { success: true };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async shutdown() {
    this.context.logger.info('Threat Enrichment plugin shutting down');
    this.threatCache.clear();
    super.shutdown();
  }
}

// Export for plugin system
export default ThreatEnrichmentPlugin;
