/**
 * ServiceNow Integration
 * Creates and manages incidents in ServiceNow
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface SNOWIncident {
  number: string;
  sys_id: string;
  short_description: string;
  description: string;
  priority: string;
  urgency: string;
  impact: string;
  assignment_group: string;
  state: string;
  created_on: string;
  updated_on: string;
}

export class ServiceNowIntegration extends IntegrationBase {
  private instanceUrl: string;
  private username: string;
  private password: string;
  private table: string;
  private assignmentGroup?: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.instanceUrl = config.endpoints?.['instance_url'] || 'https://dev00000.service-now.com';
    this.table = config.endpoints?.['table'] || 'incident';
    this.username = config.auth.credentials['username'];
    this.password = config.auth.credentials['password'];
    this.assignmentGroup = config.endpoints?.['assignment_group'];
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.instanceUrl}/api/now/${endpoint}`;
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
      throw new Error(`ServiceNow API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result as T;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'servicenow',
      category: threat.category || 'security_incident',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Incident',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['servicenow', 'incident', threat.type].filter(Boolean),
    };
  }

  /**
   * Create incident from threat
   */
  async createIncident(event: TransformedEvent): Promise<string> {
    const incident = {
      short_description: `${event.severity.toUpperCase()}: ${event.title}`,
      description: event.description,
      priority: this.mapPriority(event.severity),
      urgency: this.mapUrgency(event.severity),
      impact: '1',
      assignment_group: this.assignmentGroup || 'Security Team',
      u_blockstop_threat_id: event.id,
      u_blockstop_severity: event.severity,
      u_blockstop_category: event.category,
      cmdb_ci: 'BlockStop',
    };

    const result = await this.makeRequest<SNOWIncident>(
      'POST',
      `v2/table/${this.table}`,
      incident
    );

    return result.number;
  }

  /**
   * Update incident
   */
  async updateIncident(incidentNumber: string, updates: Record<string, any>): Promise<void> {
    await this.makeRequest(
      'PATCH',
      `v2/table/${this.table}?sysparm_query=number=${incidentNumber}`,
      updates
    );
  }

  /**
   * Get incident
   */
  async getIncident(incidentNumber: string): Promise<SNOWIncident> {
    const result = await this.makeRequest<SNOWIncident[]>(
      'GET',
      `v2/table/${this.table}?sysparm_query=number=${incidentNumber}&sysparm_limit=1`
    );

    return result[0];
  }

  /**
   * Get incidents by filter
   */
  async getIncidents(filter: string, limit: number = 100): Promise<SNOWIncident[]> {
    return this.makeRequest<SNOWIncident[]>(
      'GET',
      `v2/table/${this.table}?sysparm_query=${encodeURIComponent(filter)}&sysparm_limit=${limit}`
    );
  }

  /**
   * Close incident
   */
  async closeIncident(incidentNumber: string, closeCode: string, closeNotes: string): Promise<void> {
    await this.updateIncident(incidentNumber, {
      state: '7', // Closed
      close_code: closeCode,
      close_notes: closeNotes,
    });
  }

  /**
   * Resolve incident
   */
  async resolveIncident(incidentNumber: string, resolution: string): Promise<void> {
    await this.updateIncident(incidentNumber, {
      state: '6', // Resolved
      resolution_code: 'Resolved',
      close_notes: resolution,
    });
  }

  /**
   * Add work note
   */
  async addWorkNote(incidentNumber: string, note: string): Promise<void> {
    await this.makeRequest(
      'POST',
      `v2/table/incident/${incidentNumber}/work_notes`,
      {
        work_notes: note,
      }
    );
  }

  /**
   * Assign incident
   */
  async assignIncident(incidentNumber: string, assignedTo: string): Promise<void> {
    await this.updateIncident(incidentNumber, {
      assigned_to: assignedTo,
      state: '2', // In Progress
    });
  }

  /**
   * Search incidents
   */
  async searchIncidents(query: string): Promise<SNOWIncident[]> {
    const filter = `short_descriptionLIKE${encodeURIComponent(query)}`;
    return this.getIncidents(filter);
  }

  /**
   * Create change request
   */
  async createChangeRequest(title: string, description: string): Promise<string> {
    const change = {
      short_description: title,
      description,
      type: 'standard',
      urgency: '3',
      impact: '3',
      reason_for_change: 'Security incident remediation',
    };

    const result = await this.makeRequest<any>(
      'POST',
      'v2/table/change_request',
      change
    );

    return result.number;
  }

  /**
   * Map severity to priority
   */
  private mapPriority(severity: TransformedEvent['severity']): string {
    const priorityMap: Record<TransformedEvent['severity'], string> = {
      critical: '1',
      high: '2',
      medium: '3',
      low: '4',
      info: '5',
    };

    return priorityMap[severity];
  }

  /**
   * Map severity to urgency
   */
  private mapUrgency(severity: TransformedEvent['severity']): string {
    const urgencyMap: Record<TransformedEvent['severity'], string> = {
      critical: '1',
      high: '2',
      medium: '2',
      low: '3',
      info: '3',
    };

    return urgencyMap[severity];
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

  protected getAuthHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', `v2/table/${this.table}?sysparm_limit=1`);
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'ServiceNow integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.instanceUrl = newConfig.endpoints?.['instance_url'] || 'https://dev00000.service-now.com';
    this.table = newConfig.endpoints?.['table'] || 'incident';
    this.username = newConfig.auth.credentials['username'];
    this.password = newConfig.auth.credentials['password'];
    this.assignmentGroup = newConfig.endpoints?.['assignment_group'];
    this.logEvent('config_change', { updated: true });
  }
}

export async function createServiceNowIntegration(name: string, config: IntegrationConfig): Promise<ServiceNowIntegration> {
  const integration = new ServiceNowIntegration(name, config);
  await integration.initialize();
  return integration;
}
