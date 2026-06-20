/**
 * Microsoft Defender for Endpoint Integration
 * Integrates BlockStop threats with Microsoft Defender EDR
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface DefenderAlert {
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  classification: string;
  determination: string;
  detectionSource: string;
}

interface DefenderMachine {
  id: string;
  computerDnsName: string;
  osKernel: string;
  osVersion: string;
  rbacGroupId: number;
  healthStatus: string;
  riskScore: string;
}

export class DefenderIntegration extends IntegrationBase {
  private tenantId: string;
  private appId: string;
  private appSecret: string;
  private apiUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.tenantId = config.auth.credentials['tenant_id'];
    this.appId = config.auth.credentials['app_id'];
    this.appSecret = config.auth.credentials['app_secret'];
    this.apiUrl = 'https://api.securitycenter.microsoft.com/api';
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    // Ensure token is valid
    if (!this.accessToken || (this.tokenExpiry && this.tokenExpiry < new Date())) {
      await this.refreshAccessToken();
    }

    const url = `${this.apiUrl}${endpoint}`;
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
      throw new Error(`Defender API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Refresh OAuth2 access token
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.appId,
          client_secret: this.appSecret,
          scope: 'https://api.securitycenter.microsoft.com/.default',
          grant_type: 'client_credentials',
        }).toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: any = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    this.logEvent('auth_refresh', { success: true });
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const alert = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'defender',
      category: alert.category || 'detection',
      severity: this.mapSeverity(alert.severity),
      title: alert.title || 'Microsoft Defender Alert',
      description: alert.description || 'Threat detected',
      data: alert,
      relatedEntities: [alert.machineId].filter(Boolean),
      tags: ['defender', 'edr', 'microsoft', alert.classification].filter(Boolean),
    };
  }

  /**
   * Create alert from threat
   */
  async createAlert(event: TransformedEvent, machineId?: string): Promise<string> {
    const alert: DefenderAlert = {
      title: event.title,
      description: event.description,
      severity: this.mapDefenderSeverity(event.severity),
      category: event.category,
      status: 'new',
      classification: 'TruePositive',
      determination: 'Malware',
      detectionSource: 'BlockStop',
    };

    const result = await this.makeRequest<{ id: string }>(
      'POST',
      '/alerts',
      alert
    );

    return result.id;
  }

  /**
   * Get machine information
   */
  async getMachineInfo(machineId: string): Promise<DefenderMachine> {
    const result = await this.makeRequest<{ value: DefenderMachine[] }>(
      'GET',
      `/machines('${machineId}')`
    );

    return result.value?.[0];
  }

  /**
   * Isolate machine
   */
  async isolateMachine(machineId: string, isolationType: 'Full' | 'Selective'): Promise<void> {
    await this.makeRequest(
      'POST',
      `/machines/${machineId}/isolate`,
      { isolationType, comment: 'Isolated by BlockStop' }
    );
  }

  /**
   * Release machine from isolation
   */
  async releaseMachineFromIsolation(machineId: string): Promise<void> {
    await this.makeRequest(
      'POST',
      `/machines/${machineId}/unisolate`,
      { comment: 'Released from BlockStop isolation' }
    );
  }

  /**
   * Get machine alerts
   */
  async getMachineAlerts(machineId: string, limit: number = 100): Promise<any[]> {
    const result = await this.makeRequest<{ value: any[] }>(
      'GET',
      `/machines/${machineId}/alerts?$top=${limit}`
    );

    return result.value || [];
  }

  /**
   * Search for alerts
   */
  async searchAlerts(filter: string): Promise<any[]> {
    const result = await this.makeRequest<{ value: any[] }>(
      'GET',
      `/alerts?$filter=${encodeURIComponent(filter)}`
    );

    return result.value || [];
  }

  /**
   * Get threat intelligence
   */
  async getThreatInfo(threatName: string): Promise<any> {
    const result = await this.makeRequest<any>(
      'GET',
      `/threatIntelligence/indicators?$filter=contains(indicatorValue,'${threatName}')`
    );

    return result.value?.[0];
  }

  /**
   * List machines with vulnerabilities
   */
  async getVulnerableMachines(limit: number = 100): Promise<DefenderMachine[]> {
    const result = await this.makeRequest<{ value: DefenderMachine[] }>(
      'GET',
      `/machines?$filter=riskScore ne 'None'&$top=${limit}`
    );

    return result.value || [];
  }

  /**
   * Map severity
   */
  private mapSeverity(severity?: string): TransformedEvent['severity'] {
    const severityMap: Record<string, TransformedEvent['severity']> = {
      high: 'critical',
      medium: 'high',
      low: 'medium',
      informational: 'info',
    };

    return severityMap[severity?.toLowerCase() || 'medium'] || 'medium';
  }

  /**
   * Map to Defender severity
   */
  private mapDefenderSeverity(severity: TransformedEvent['severity']): string {
    const severityMap: Record<TransformedEvent['severity'], string> = {
      critical: 'High',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      info: 'Informational',
    };

    return severityMap[severity];
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken || ''}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/machines?$top=1');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Defender integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.tenantId = newConfig.auth.credentials['tenant_id'];
    this.appId = newConfig.auth.credentials['app_id'];
    this.appSecret = newConfig.auth.credentials['app_secret'];
    this.logEvent('config_change', { updated: true });
  }
}

export async function createDefenderIntegration(name: string, config: IntegrationConfig): Promise<DefenderIntegration> {
  const integration = new DefenderIntegration(name, config);
  await integration.initialize();
  return integration;
}
