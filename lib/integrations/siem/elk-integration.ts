/**
 * Elasticsearch/ELK Integration
 * Connects BlockStop threats to ELK Stack for indexing and analysis
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface ElasticsearchDocument {
  _id: string;
  _index: string;
  _type: string;
  _source: any;
}

interface SearchHit {
  _id: string;
  _index: string;
  _score: number;
  _source: any;
}

export class ELKIntegration extends IntegrationBase {
  private esHost: string;
  private esPort: string;
  private indexName: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.esHost = config.endpoints?.['host'] || 'localhost';
    this.esPort = config.endpoints?.['port'] || '9200';
    this.indexName = config.endpoints?.['index'] || 'blockstop-threats';
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `http://${this.esHost}:${this.esPort}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'elasticsearch',
      category: threat.category || 'security_event',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Event',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['elk', 'elasticsearch', threat.type].filter(Boolean),
    };
  }

  /**
   * Index a threat document
   */
  async indexThreat(event: TransformedEvent): Promise<string> {
    const document = {
      threat_id: event.id,
      title: event.title,
      severity: event.severity,
      category: event.category,
      timestamp: event.timestamp,
      data: event.data,
      tags: event.tags,
      source: 'blockstop',
    };

    const result = await this.makeRequest<{ _id: string; _index: string }>(
      'POST',
      `/${this.indexName}/_doc`,
      document
    );

    return result._id;
  }

  /**
   * Search for threats
   */
  async searchThreats(query: Record<string, any>, limit: number = 100): Promise<SearchHit[]> {
    const searchBody = {
      query,
      size: limit,
      sort: [{ timestamp: { order: 'desc' } }],
    };

    const result = await this.makeRequest<{ hits: { hits: SearchHit[] } }>(
      'POST',
      `/${this.indexName}/_search`,
      searchBody
    );

    return result.hits.hits;
  }

  /**
   * Search threats by severity
   */
  async searchBySeverity(severity: string, days: number = 7): Promise<SearchHit[]> {
    const query = {
      bool: {
        must: [
          { match: { severity } },
          {
            range: {
              timestamp: {
                gte: `now-${days}d`,
              },
            },
          },
        ],
      },
    };

    return this.searchThreats(query);
  }

  /**
   * Aggregate threat statistics
   */
  async getThreatStats(days: number = 7): Promise<Record<string, any>> {
    const agg = {
      aggs: {
        severity_distribution: {
          terms: {
            field: 'severity.keyword',
          },
        },
        category_distribution: {
          terms: {
            field: 'category.keyword',
          },
        },
        threats_by_day: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'day',
          },
        },
      },
      query: {
        range: {
          timestamp: {
            gte: `now-${days}d`,
          },
        },
      },
      size: 0,
    };

    const result = await this.makeRequest<any>(
      'POST',
      `/${this.indexName}/_search`,
      agg
    );

    return result.aggregations;
  }

  /**
   * Create index mapping
   */
  async createIndexMapping(): Promise<void> {
    const mapping = {
      mappings: {
        properties: {
          threat_id: { type: 'keyword' },
          title: { type: 'text' },
          severity: { type: 'keyword' },
          category: { type: 'keyword' },
          timestamp: { type: 'date' },
          data: { type: 'object', enabled: true },
          tags: { type: 'keyword' },
          source: { type: 'keyword' },
        },
      },
    };

    try {
      await this.makeRequest('PUT', `/${this.indexName}`, mapping);
    } catch (error) {
      if (!String(error).includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * Delete old indices
   */
  async deleteOldIndices(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.makeRequest<any>(
      'POST',
      `/${this.indexName}*/_delete_by_query`,
      {
        query: {
          range: {
            timestamp: {
              lt: cutoffDate.toISOString(),
            },
          },
        },
      }
    );

    return result.deleted || 0;
  }

  /**
   * Map event severity
   */
  private mapSeverity(severity?: string): TransformedEvent['severity'] {
    const severityMap: Record<string, TransformedEvent['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'info',
    };

    return severityMap[severity?.toLowerCase() || 'medium'] || 'medium';
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/_cluster/health');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'ELK integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.esHost = newConfig.endpoints?.['host'] || 'localhost';
    this.esPort = newConfig.endpoints?.['port'] || '9200';
    this.indexName = newConfig.endpoints?.['index'] || 'blockstop-threats';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createELKIntegration(name: string, config: IntegrationConfig): Promise<ELKIntegration> {
  const integration = new ELKIntegration(name, config);
  await integration.initialize();
  return integration;
}
