/**
 * BlockStop OFFICE Tier - Professional Integrations
 * ServiceNow, Jira, Azure DevOps, PagerDuty, Splunk, Datadog integration management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ProfessionalIntegration,
  ProfessionalIntegrationType,
  IntegrationCredentials,
  SyncConfiguration,
  FieldMapping,
  IntegrationHealthStatus,
} from '@/types/office-tier';

export class ProfessionalIntegrationManager {
  private integrations: Map<string, ProfessionalIntegration> = new Map();
  private syncLogs: Array<any> = [];
  private healthChecks: Map<string, IntegrationHealthStatus> = new Map();

  /**
   * Create professional integration
   */
  public createIntegration(
    organizationId: string,
    type: ProfessionalIntegrationType,
    credentials: IntegrationCredentials
  ): ProfessionalIntegration {
    const integration: ProfessionalIntegration = {
      id: `int-${uuidv4()}`,
      organizationId,
      type,
      enabled: false,
      credentials,
      syncConfig: {
        enabled: false,
        interval: 60,
        direction: 'bidirectional',
        mappings: this.getDefaultMappings(type),
      },
      healthStatus: {
        status: 'unknown',
        lastCheck: new Date(),
      },
    };

    this.integrations.set(integration.id, integration);
    this.healthChecks.set(integration.id, integration.healthStatus);

    return integration;
  }

  /**
   * Get default field mappings for integration type
   */
  private getDefaultMappings(type: ProfessionalIntegrationType): FieldMapping[] {
    const mappings: Record<ProfessionalIntegrationType, FieldMapping[]> = {
      servicenow: [
        { sourceField: 'incident_id', targetField: 'number' },
        { sourceField: 'title', targetField: 'short_description' },
        { sourceField: 'severity', targetField: 'severity' },
        { sourceField: 'status', targetField: 'state' },
      ],
      jira: [
        { sourceField: 'incident_id', targetField: 'key' },
        { sourceField: 'title', targetField: 'summary' },
        { sourceField: 'severity', targetField: 'priority' },
        { sourceField: 'assigned_to', targetField: 'assignee' },
      ],
      azure_devops: [
        { sourceField: 'incident_id', targetField: 'id' },
        { sourceField: 'title', targetField: 'title' },
        { sourceField: 'status', targetField: 'state' },
      ],
      pagerduty: [
        { sourceField: 'incident_id', targetField: 'incident_number' },
        { sourceField: 'title', targetField: 'title' },
        { sourceField: 'severity', targetField: 'urgency' },
      ],
      splunk: [
        { sourceField: 'timestamp', targetField: 'timestamp' },
        { sourceField: 'event_type', targetField: 'sourcetype' },
      ],
      datadog: [
        { sourceField: 'alert_id', targetField: 'id' },
        { sourceField: 'metric', targetField: 'metric' },
        { sourceField: 'threshold', targetField: 'threshold' },
      ],
      slack_workspace: [
        { sourceField: 'message', targetField: 'text' },
        { sourceField: 'channel', targetField: 'channel' },
      ],
      new_relic: [
        { sourceField: 'alert_id', targetField: 'incident_id' },
        { sourceField: 'entity', targetField: 'entity_name' },
      ],
    };

    return mappings[type] || [];
  }

  /**
   * Get integration by ID
   */
  public getIntegration(integrationId: string): ProfessionalIntegration | null {
    return this.integrations.get(integrationId) || null;
  }

  /**
   * Get organization integrations
   */
  public getOrganizationIntegrations(organizationId: string): ProfessionalIntegration[] {
    return Array.from(this.integrations.values()).filter(
      (i) => i.organizationId === organizationId
    );
  }

  /**
   * Get integration by type
   */
  public getIntegrationByType(
    organizationId: string,
    type: ProfessionalIntegrationType
  ): ProfessionalIntegration | null {
    for (const integration of this.integrations.values()) {
      if (integration.organizationId === organizationId && integration.type === type) {
        return integration;
      }
    }
    return null;
  }

  /**
   * Enable integration
   */
  public enableIntegration(integrationId: string): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.enabled = true;
  }

  /**
   * Disable integration
   */
  public disableIntegration(integrationId: string): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.enabled = false;
    integration.syncConfig.enabled = false;
  }

  /**
   * Enable sync
   */
  public enableSync(
    integrationId: string,
    interval: number,
    direction: 'bidirectional' | 'inbound' | 'outbound'
  ): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.syncConfig.enabled = true;
    integration.syncConfig.interval = interval;
    integration.syncConfig.direction = direction;
  }

  /**
   * Disable sync
   */
  public disableSync(integrationId: string): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.syncConfig.enabled = false;
  }

  /**
   * Test integration connection
   */
  public async testConnection(integrationId: string): Promise<{ success: boolean; message: string }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      // Simulate connection test based on type
      const result = await this.performConnectionTest(integration.type, integration.credentials);

      // Update health status
      if (result.success) {
        integration.healthStatus = {
          status: 'healthy',
          lastCheck: new Date(),
        };
      } else {
        integration.healthStatus = {
          status: 'error',
          lastCheck: new Date(),
          errorMessage: result.message,
        };
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      integration.healthStatus = {
        status: 'error',
        lastCheck: new Date(),
        errorMessage: errorMsg,
      };

      return { success: false, message: errorMsg };
    }
  }

  /**
   * Perform connection test for specific type
   */
  private async performConnectionTest(
    type: ProfessionalIntegrationType,
    credentials: IntegrationCredentials
  ): Promise<{ success: boolean; message: string }> {
    // Simulate API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!credentials.baseUrl && !credentials.apiKey) {
          resolve({ success: false, message: 'Missing required credentials' });
        } else {
          resolve({ success: true, message: `${type} connection successful` });
        }
      }, 500);
    });
  }

  /**
   * Sync data
   */
  public async syncData(integrationId: string): Promise<{
    success: boolean;
    itemsSynced: number;
    errors: string[];
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return { success: false, itemsSynced: 0, errors: ['Integration not found'] };
    }

    if (!integration.syncConfig.enabled) {
      return { success: false, itemsSynced: 0, errors: ['Sync not enabled'] };
    }

    try {
      const result = await this.performSync(integration);

      integration.lastSync = new Date();
      integration.healthStatus.lastCheck = new Date();

      // Log sync
      this.logSync(integrationId, 'success', result);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sync failed';
      integration.healthStatus = {
        status: 'degraded',
        lastCheck: new Date(),
        errorMessage: errorMsg,
      };

      this.logSync(integrationId, 'error', { error: errorMsg });

      return {
        success: false,
        itemsSynced: 0,
        errors: [errorMsg],
      };
    }
  }

  /**
   * Perform sync based on integration type
   */
  private async performSync(integration: ProfessionalIntegration): Promise<{
    success: boolean;
    itemsSynced: number;
    errors: string[];
  }> {
    // Simulate sync based on type
    const itemCount = Math.floor(Math.random() * 100) + 10;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          itemsSynced: itemCount,
          errors: [],
        });
      }, 1000);
    });
  }

  /**
   * Log sync activity
   */
  private logSync(integrationId: string, status: string, details: any): void {
    this.syncLogs.push({
      integrationId,
      timestamp: new Date(),
      status,
      details,
    });

    // Keep last 1000 logs
    if (this.syncLogs.length > 1000) {
      this.syncLogs.shift();
    }
  }

  /**
   * Get sync logs
   */
  public getSyncLogs(
    integrationId: string,
    limit: number = 50
  ): Array<{ timestamp: Date; status: string; details: any }> {
    return this.syncLogs
      .filter((log) => log.integrationId === integrationId)
      .slice(-limit);
  }

  /**
   * Update field mappings
   */
  public updateFieldMappings(integrationId: string, mappings: FieldMapping[]): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    integration.syncConfig.mappings = mappings;
  }

  /**
   * Get health status
   */
  public getHealthStatus(integrationId: string): IntegrationHealthStatus {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        status: 'unknown',
        lastCheck: new Date(),
      };
    }

    return integration.healthStatus;
  }

  /**
   * Get integration dashboard
   */
  public getIntegrationDashboard(organizationId: string): {
    activeIntegrations: number;
    totalIntegrations: number;
    healthyIntegrations: number;
    degradedIntegrations: number;
    errorIntegrations: number;
    lastSyncTimes: Record<string, Date>;
    syncStatistics: Record<string, any>;
  } {
    const integrations = this.getOrganizationIntegrations(organizationId);

    const healthyIntegrations = integrations.filter(
      (i) => i.healthStatus.status === 'healthy'
    ).length;
    const degradedIntegrations = integrations.filter(
      (i) => i.healthStatus.status === 'degraded'
    ).length;
    const errorIntegrations = integrations.filter(
      (i) => i.healthStatus.status === 'error'
    ).length;

    const lastSyncTimes: Record<string, Date> = {};
    const syncStatistics: Record<string, any> = {};

    for (const integration of integrations) {
      if (integration.lastSync) {
        lastSyncTimes[integration.type] = integration.lastSync;
      }

      const logs = this.getSyncLogs(integration.id, 10);
      const successfulSyncs = logs.filter((l) => l.status === 'success').length;
      const failedSyncs = logs.filter((l) => l.status === 'error').length;

      syncStatistics[integration.type] = {
        successRate: logs.length > 0 ? (successfulSyncs / logs.length) * 100 : 0,
        totalAttempts: logs.length,
        successful: successfulSyncs,
        failed: failedSyncs,
      };
    }

    return {
      activeIntegrations: integrations.filter((i) => i.enabled).length,
      totalIntegrations: integrations.length,
      healthyIntegrations,
      degradedIntegrations,
      errorIntegrations,
      lastSyncTimes,
      syncStatistics,
    };
  }

  /**
   * Get integration recommendations
   */
  public getRecommendations(organizationId: string): string[] {
    const integrations = this.getOrganizationIntegrations(organizationId);
    const recommendations: string[] = [];

    // Check for unhealthy integrations
    const unhealthyCount = integrations.filter((i) => i.healthStatus.status !== 'healthy').length;
    if (unhealthyCount > 0) {
      recommendations.push(`${unhealthyCount} integration(s) are not healthy - review immediately`);
    }

    // Check for disabled syncs on enabled integrations
    const disabledSyncs = integrations.filter(
      (i) => i.enabled && !i.syncConfig.enabled
    ).length;
    if (disabledSyncs > 0) {
      recommendations.push(`${disabledSyncs} enabled integration(s) have sync disabled`);
    }

    // Check for inactive syncs
    const inactiveSyncs = integrations.filter((i) => {
      if (!i.lastSync) return true;
      const hoursSinceSync = (new Date().getTime() - i.lastSync.getTime()) / 1000 / 60 / 60;
      return hoursSinceSync > i.syncConfig.interval * 2 / 60;
    });

    if (inactiveSyncs.length > 0) {
      recommendations.push(`${inactiveSyncs.length} integration(s) have not synced recently`);
    }

    return recommendations;
  }

  /**
   * Delete integration
   */
  public deleteIntegration(integrationId: string): void {
    this.integrations.delete(integrationId);
    this.healthChecks.delete(integrationId);
  }

  /**
   * Schedule sync
   */
  public scheduleSyncJob(integrationId: string): void {
    // In production, this would schedule a recurring job
    const integration = this.integrations.get(integrationId);
    if (integration && integration.syncConfig.enabled) {
      // Simulate job scheduling
      console.log(
        `Scheduled sync for ${integration.type} every ${integration.syncConfig.interval} minutes`
      );
    }
  }
}

/**
 * SIEM Integration Helper
 */
export class SIEMIntegrationHelper {
  /**
   * Get supported SIEM platforms
   */
  static getSupportedPlatforms(): Array<{
    name: string;
    apiVersion: string;
    requiresOnPremises: boolean;
  }> {
    return [
      { name: 'Splunk', apiVersion: 'v2', requiresOnPremises: true },
      { name: 'Datadog', apiVersion: 'v1', requiresOnPremises: false },
      { name: 'Elastic', apiVersion: 'v8', requiresOnPremises: true },
      { name: 'New Relic', apiVersion: 'v1', requiresOnPremises: false },
    ];
  }

  /**
   * Get sample payload for SIEM integration
   */
  static getSamplePayload(siemType: string): any {
    const payloads: Record<string, any> = {
      splunk: {
        event: {
          timestamp: new Date().toISOString(),
          sourcetype: 'blockstop:threat',
          threat_type: 'malware',
          severity: 'high',
        },
      },
      datadog: {
        alert: {
          id: 'alert_123',
          timestamp: new Date().toISOString(),
          metric: 'threat.detected',
          threshold: 1,
        },
      },
    };

    return payloads[siemType.toLowerCase()] || {};
  }
}
