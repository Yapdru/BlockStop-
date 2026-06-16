/**
 * Plugin SDK API Client
 * Client for communicating with BlockStop plugin system
 */

import { HttpOptions, ThreatDetails, Threat, ScanResult, FileInfo } from './types';

export class PluginAPIClient {
  private baseUrl: string;
  private pluginId: string;
  private token?: string;

  constructor(baseUrl: string, pluginId: string, token?: string) {
    this.baseUrl = baseUrl;
    this.pluginId = pluginId;
    this.token = token;
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
    options?: HttpOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Plugin-ID': this.pluginId,
      ...options?.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: options?.timeout
          ? AbortSignal.timeout(options.timeout)
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async getThreatDetails(threatId: string): Promise<ThreatDetails | null> {
    try {
      return await this.request(`/api/threats/${threatId}`);
    } catch {
      return null;
    }
  }

  async enrichThreat(
    threatId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.request('PUT', `/api/threats/${threatId}/enrich`, data);
  }

  async reportThreat(data: {
    threatId: string;
    reason: string;
    evidence?: string[];
  }): Promise<string> {
    const result = await this.request<{ reportId: string }>(
      'POST',
      '/api/threats/report',
      data
    );
    return result.reportId;
  }

  async queryThreats(filter: Record<string, unknown>): Promise<Threat[]> {
    return await this.request('POST', '/api/threats/query', filter);
  }

  async getScanResults(scanId: string): Promise<ScanResult | null> {
    try {
      return await this.request(`/api/scans/${scanId}`);
    } catch {
      return null;
    }
  }

  async createScan(config: Record<string, unknown>): Promise<string> {
    const result = await this.request<{ scanId: string }>(
      'POST',
      '/api/scans',
      config
    );
    return result.scanId;
  }

  async queryScanResults(filter: Record<string, unknown>): Promise<ScanResult[]> {
    return await this.request('POST', '/api/scans/query', filter);
  }

  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    try {
      return await this.request(`/api/files/${fileId}`);
    } catch {
      return null;
    }
  }

  async analyzeFile(fileId: string): Promise<any> {
    return await this.request('POST', `/api/files/${fileId}/analyze`);
  }

  async queryFiles(filter: Record<string, unknown>): Promise<FileInfo[]> {
    return await this.request('POST', '/api/files/query', filter);
  }

  async sendIntegration(integrationId: string, data: unknown): Promise<unknown> {
    return await this.request(
      'POST',
      `/api/integrations/${integrationId}/send`,
      data
    );
  }

  async queryIntegration(
    integrationId: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    return await this.request(
      'POST',
      `/api/integrations/${integrationId}/query`,
      params
    );
  }

  async makeRequest<T = unknown>(
    method: string,
    path: string,
    data?: unknown,
    options?: HttpOptions
  ): Promise<T> {
    return await this.request<T>(method, path, data, options);
  }

  setToken(token: string): void {
    this.token = token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getPluginId(): string {
    return this.pluginId;
  }
}

export function createAPIClient(
  baseUrl: string,
  pluginId: string,
  token?: string
): PluginAPIClient {
  return new PluginAPIClient(baseUrl, pluginId, token);
}
