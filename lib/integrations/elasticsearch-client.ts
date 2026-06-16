/**
 * Elasticsearch Client
 * Handles event indexing to Elasticsearch/OpenSearch
 */

import axios, { AxiosInstance } from 'axios';

interface ElasticsearchDocument {
  timestamp: string;
  event_type: string;
  source: string;
  severity: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

interface BulkOperation {
  index?: { _index: string; _id?: string };
  create?: { _index: string; _id?: string };
  doc: Record<string, any>;
}

export class ElasticsearchClient {
  private client: AxiosInstance;
  private indexPrefix: string;

  constructor(
    elasticsearchUrl: string,
    options: {
      username?: string;
      password?: string;
      apiKey?: string;
      indexPrefix?: string;
      verifySsl?: boolean;
    } = {}
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.apiKey) {
      headers.Authorization = `ApiKey ${options.apiKey}`;
    } else if (options.username && options.password) {
      const auth = Buffer.from(`${options.username}:${options.password}`).toString('base64');
      headers.Authorization = `Basic ${auth}`;
    }

    this.client = axios.create({
      baseURL: elasticsearchUrl,
      headers,
      httpsAgent: !options.verifySsl ? { rejectUnauthorized: false } : undefined,
    });

    this.indexPrefix = options.indexPrefix || 'blockstop';

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[ElasticsearchClient] Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Get index name with timestamp
   */
  private getIndexName(type: string = 'scan'): string {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${this.indexPrefix}-${type}-${year}.${month}.${day}`;
  }

  /**
   * Index a single document
   */
  async indexDocument(
    doc: ElasticsearchDocument,
    type: string = 'scan',
    id?: string
  ): Promise<{ _id: string; _index: string; created: boolean }> {
    try {
      const index = this.getIndexName(type);
      const response = await this.client.post(`/${index}/_doc${id ? `/${id}` : ''}`, doc);

      return {
        _id: response.data._id,
        _index: response.data._index,
        created: response.data.result === 'created',
      };
    } catch (error) {
      throw new Error(`Failed to index Elasticsearch document: ${error}`);
    }
  }

  /**
   * Bulk index multiple documents
   */
  async bulkIndex(
    documents: Array<{ doc: ElasticsearchDocument; type?: string; id?: string }>,
    refreshPolicy: boolean = true
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    try {
      const bulkOps: string[] = [];
      const errors: any[] = [];

      for (const { doc, type = 'scan', id } of documents) {
        const index = this.getIndexName(type);
        bulkOps.push(
          JSON.stringify({
            index: { _index: index, _id: id },
          })
        );
        bulkOps.push(JSON.stringify(doc));
      }

      const response = await this.client.post(
        `/_bulk${refreshPolicy ? '?refresh=true' : ''}`,
        bulkOps.join('\n') + '\n',
        {
          headers: { 'Content-Type': 'application/x-ndjson' },
        }
      );

      // Track successes and failures
      let success = 0;
      let failed = 0;

      if (response.data.items) {
        response.data.items.forEach((item: any) => {
          const operation = item.index || item.create;
          if (operation.status >= 200 && operation.status < 300) {
            success++;
          } else {
            failed++;
            errors.push(operation);
          }
        });
      }

      return { success, failed, errors };
    } catch (error) {
      throw new Error(`Failed to bulk index Elasticsearch documents: ${error}`);
    }
  }

  /**
   * Search documents
   */
  async search(
    query: Record<string, any>,
    type: string = 'scan',
    size: number = 10
  ): Promise<{
    total: number;
    hits: Array<{ _id: string; _source: ElasticsearchDocument }>;
  }> {
    try {
      const index = this.getIndexName(type);
      const response = await this.client.post(`/${index}/_search`, {
        query,
        size,
      });

      return {
        total: response.data.hits.total.value,
        hits: response.data.hits.hits,
      };
    } catch (error) {
      throw new Error(`Failed to search Elasticsearch: ${error}`);
    }
  }

  /**
   * Aggregate data
   */
  async aggregate(
    aggs: Record<string, any>,
    query?: Record<string, any>,
    type: string = 'scan'
  ): Promise<Record<string, any>> {
    try {
      const index = this.getIndexName(type);
      const response = await this.client.post(`/${index}/_search`, {
        query: query || { match_all: {} },
        aggs,
        size: 0,
      });

      return response.data.aggregations;
    } catch (error) {
      throw new Error(`Failed to aggregate Elasticsearch data: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/_cluster/health');
      return response.status === 200;
    } catch (error) {
      console.error('[ElasticsearchClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Create index with template
   */
  async createIndexTemplate(type: string = 'scan'): Promise<boolean> {
    try {
      await this.client.put(`/_index_template/${this.indexPrefix}-${type}-template`, {
        index_patterns: [`${this.indexPrefix}-${type}-*`],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              event_type: { type: 'keyword' },
              source: { type: 'keyword' },
              severity: { type: 'keyword' },
              data: { type: 'object', enabled: true },
            },
          },
        },
      });
      return true;
    } catch (error) {
      console.error(`Failed to create index template: ${error}`);
      return false;
    }
  }
}

export default ElasticsearchClient;
