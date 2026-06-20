/**
 * CrowdStrike Falcon Integration
 * Integrates BlockStop threats with CrowdStrike Falcon EDR
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface FalconIncident {
  incident_type: string;
  state: string;
  severity: string;
  created_timestamp: string;
  modified_timestamp: string;
  assigned_to_name?: string;
  description: string;
  name: string;
}

interface DetectionEvent {
  device_id: string;
  detection_id: string;
  created_timestamp: string;
  severity: string;
  behavior: string;
  pattern_id?: string;
}

export class CrowdStrikeIntegration extends IntegrationBase {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.clientId = config.auth.credentials['client_id'];
    this.clientSecret = config.auth.credentials['client_secret'];
    this.apiUrl = config.endpoints?.['api_url'] || 'https://api.crowdstrike.com';
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
      throw new Error(`CrowdStrike API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Refresh OAuth2 access token
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${this.apiUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data: any = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
    this.logEvent('auth_refresh', { success: true });
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const event = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'crowdstrike',
      category: event.category || 'detection',
      severity: this.mapSeverity(event.severity),
      title: event.title || 'CrowdStrike Detection',
      description: event.description || 'Threat detected',
      data: event,
      relatedEntities: [event.device_id].filter(Boolean),
      tags: ['crowdstrike', 'edr', event.behavior || 'malware'].filter(Boolean),
    };
  }

  /**
   * Create incident from threat
   */
  async createIncident(event: TransformedEvent, deviceId: string): Promise<string> {
    const incident: FalconIncident = {
      name: event.title,
      description: event.description,
      incident_type: 'BLOCKSTOP_THREAT',
      state: 'new',
      severity: this.mapCrowdStrikeSeverity(event.severity),
      created_timestamp: new Date().toISOString(),
      modified_timestamp: new Date().toISOString(),
    };

    const result = await this.makeRequest<{ incident_id: string }>(
      'POST',
      '/incidents/entities/incidents/v1',
      { incidents: [incident] }
    );

    return result.incident_id;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(deviceId: string): Promise<any> {
    const result = await this.makeRequest<any>(
      'GET',
      `/devices/entities/devices/v2?ids=${deviceId}`
    );

    return result.resources?.[0];
  }

  /**
   * Quarantine device
   */
  async quarantineDevice(deviceId: string, enable: boolean = true): Promise<void> {
    const action = enable ? 'contain' : 'lift_containment';

    await this.makeRequest(
      'POST',
      `/devices/entities/devices-actions/v2?action_name=${action}`,
      { ids: [deviceId] }
    );
  }

  /**
   * Get detections for device
   */
  async getDeviceDetections(deviceId: string, limit: number = 100): Promise<DetectionEvent[]> {
    const result = await this.makeRequest<{ resources: DetectionEvent[] }>(
      'GET',
      `/detects/entities/summaries/GET/v1?filter=device.device_id:'${deviceId}'&limit=${limit}`
    );

    return result.resources || [];
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<FalconIncident> {
    const result = await this.makeRequest<{ resources: FalconIncident[] }>(
      'GET',
      `/incidents/entities/incidents/v1?ids=${incidentId}`
    );

    return result.resources?.[0];
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(incidentId: string, state: 'new' | 'acknowledged' | 'in_progress' | 'resolved'): Promise<void> {
    await this.makeRequest(
      'PATCH',
      `/incidents/entities/incidents/v1`,
      {
        incidents: [
          {
            incident_id: incidentId,
            state,
          },
        ],
      }
    );
  }

  /**
   * Search detections
   */
  async searchDetections(query: string): Promise<any[]> {
    const result = await this.makeRequest<any>(
      'POST',
      '/detects/queries/detects/v1',
      { filter: query }
    );

    return result.resources || [];
  }

  /**
   * Map severity
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

  /**
   * Map to CrowdStrike severity
   */
  private mapCrowdStrikeSeverity(severity: TransformedEvent['severity']): string {
    const severityMap: Record<TransformedEvent['severity'], string> = {
      critical: '5',
      high: '4',
      medium: '3',
      low: '2',
      info: '1',
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
      await this.makeRequest('GET', '/incidents/queries/incidents/v1');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'CrowdStrike integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.clientId = newConfig.auth.credentials['client_id'];
    this.clientSecret = newConfig.auth.credentials['client_secret'];
    this.apiUrl = newConfig.endpoints?.['api_url'] || 'https://api.crowdstrike.com';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createCrowdStrikeIntegration(name: string, config: IntegrationConfig): Promise<CrowdStrikeIntegration> {
  const integration = new CrowdStrikeIntegration(name, config);
  await integration.initialize();
  return integration;
}
