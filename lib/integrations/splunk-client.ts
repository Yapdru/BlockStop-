/**
 * Splunk HEC (HTTP Event Collector) Client
 * Handles event submission to Splunk Enterprise/Cloud
 */

import axios, { AxiosInstance } from 'axios';

interface SplunkEventData {
  event: Record<string, any>;
  sourcetype?: string;
  source?: string;
  host?: string;
  index?: string;
  time?: number;
}

interface SplunkHECResponse {
  text: string;
  code: number;
  invalid_event_number?: number;
}

export class SplunkClient {
  private client: AxiosInstance;
  private token: string;
  private endpoint: string;

  constructor(
    splunkUrl: string,
    hecToken: string,
    options: { verifySsl?: boolean; batchSize?: number } = {}
  ) {
    this.endpoint = `${splunkUrl}/services/collector`;
    this.token = hecToken;

    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        Authorization: `Splunk ${hecToken}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: !options.verifySsl ? { rejectUnauthorized: false } : undefined,
    });

    // Add error handling interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[SplunkClient] Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Send a single event to Splunk
   */
  async sendEvent(data: SplunkEventData): Promise<SplunkHECResponse> {
    try {
      const response = await this.client.post('/event', {
        event: data.event,
        sourcetype: data.sourcetype || 'blockstop:scan',
        source: data.source || 'blockstop',
        host: data.host || 'blockstop-pro',
        index: data.index || 'main',
        time: data.time || Math.floor(Date.now() / 1000),
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send Splunk event: ${error}`);
    }
  }

  /**
   * Send multiple events in a batch
   */
  async sendEventBatch(events: SplunkEventData[]): Promise<SplunkHECResponse> {
    try {
      const payload = events
        .map((event) => JSON.stringify({
          event: event.event,
          sourcetype: event.sourcetype || 'blockstop:scan',
          source: event.source || 'blockstop',
          host: event.host || 'blockstop-pro',
          index: event.index || 'main',
          time: event.time || Math.floor(Date.now() / 1000),
        }))
        .join('\n');

      const response = await this.client.post('/event', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send Splunk event batch: ${error}`);
    }
  }

  /**
   * Send raw event (pre-formatted)
   */
  async sendRawEvent(rawData: string, metadata?: Partial<SplunkEventData>): Promise<SplunkHECResponse> {
    try {
      const response = await this.client.post('/raw', rawData, {
        params: {
          sourcetype: metadata?.sourcetype || 'blockstop:raw',
          source: metadata?.source || 'blockstop',
          host: metadata?.host || 'blockstop-pro',
          index: metadata?.index || 'main',
          time: metadata?.time || Math.floor(Date.now() / 1000),
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send raw Splunk event: ${error}`);
    }
  }

  /**
   * Health check for HEC connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('[SplunkClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Validate HEC token
   */
  async validateToken(): Promise<{ isValid: boolean; error?: string }> {
    try {
      await this.sendEvent({
        event: { message: 'BlockStop HEC token validation' },
        sourcetype: 'blockstop:validation',
      });
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default SplunkClient;
