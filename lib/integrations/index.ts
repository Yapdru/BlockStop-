/**
 * BlockStop Integrations Index
 * Central export of all integration clients and utilities
 */

// SIEM Clients
export { default as SplunkClient } from './splunk-client';
export { default as ElasticsearchClient } from './elasticsearch-client';

// Incident Response Clients
export { default as ServiceNowClient } from './servicenow-client';
export { default as JiraClient } from './jira-client';

// Communication Clients
export { default as SlackClient } from './slack-client';
export { default as TeamsClient } from './teams-client';

// Email Clients
export { default as GmailClient } from './gmail-client';
export { default as ExchangeClient } from './exchange-client';

// Webhook Management
export { default as WebhookManager } from './webhook-manager';
export { default as WebhookValidator } from './webhook-validator';

// Custom Integration
export { default as CustomIntegrationBuilder } from './custom-integration-builder';

/**
 * Integration registry for runtime management
 */
export const IntegrationRegistry = {
  siem: {
    splunk: 'SplunkClient',
    elasticsearch: 'ElasticsearchClient',
  },
  incidentResponse: {
    servicenow: 'ServiceNowClient',
    jira: 'JiraClient',
  },
  communication: {
    slack: 'SlackClient',
    teams: 'TeamsClient',
  },
  email: {
    gmail: 'GmailClient',
    exchange: 'ExchangeClient',
  },
  webhooks: {
    manager: 'WebhookManager',
    validator: 'WebhookValidator',
  },
  custom: {
    builder: 'CustomIntegrationBuilder',
  },
};

/**
 * Integration configuration interface
 */
export interface IntegrationConfig {
  name: string;
  enabled: boolean;
  type: keyof typeof IntegrationRegistry;
  subtype: string;
  credentials: Record<string, any>;
  options?: Record<string, any>;
}

/**
 * Load integration from configuration
 */
export async function loadIntegration(config: IntegrationConfig): Promise<any> {
  const { type, subtype, credentials, options } = config;

  switch (type) {
    case 'siem':
      if (subtype === 'splunk') {
        const { default: SplunkClient } = await import('./splunk-client');
        return new SplunkClient(
          credentials.url,
          credentials.hecToken,
          options || {}
        );
      } else if (subtype === 'elasticsearch') {
        const { default: ElasticsearchClient } = await import('./elasticsearch-client');
        return new ElasticsearchClient(credentials.url, options || {});
      }
      break;

    case 'incidentResponse':
      if (subtype === 'servicenow') {
        const { default: ServiceNowClient } = await import('./servicenow-client');
        return new ServiceNowClient(
          credentials.url,
          credentials.username,
          credentials.password,
          options || {}
        );
      } else if (subtype === 'jira') {
        const { default: JiraClient } = await import('./jira-client');
        return new JiraClient(
          credentials.url,
          credentials.email,
          credentials.token,
          options || {}
        );
      }
      break;

    case 'communication':
      if (subtype === 'slack') {
        const { default: SlackClient } = await import('./slack-client');
        return new SlackClient(credentials.botToken);
      } else if (subtype === 'teams') {
        const { default: TeamsClient } = await import('./teams-client');
        return new TeamsClient(
          credentials.botId,
          credentials.botPassword,
          credentials.serviceUrl
        );
      }
      break;

    case 'email':
      if (subtype === 'gmail') {
        const { default: GmailClient } = await import('./gmail-client');
        return new GmailClient(credentials.accessToken);
      } else if (subtype === 'exchange') {
        const { default: ExchangeClient } = await import('./exchange-client');
        return new ExchangeClient(
          credentials.accessToken,
          credentials.tenantId,
          options || {}
        );
      }
      break;

    case 'webhooks':
      if (subtype === 'manager') {
        const { default: WebhookManager } = await import('./webhook-manager');
        return new WebhookManager();
      }
      break;

    case 'custom':
      if (subtype === 'builder') {
        const { default: CustomIntegrationBuilder } = await import('./custom-integration-builder');
        return new CustomIntegrationBuilder(credentials.config);
      }
      break;

    default:
      throw new Error(`Unknown integration type: ${type}`);
  }

  throw new Error(`Unknown integration subtype: ${subtype}`);
}

/**
 * Initialize all configured integrations
 */
export async function initializeIntegrations(
  configs: IntegrationConfig[]
): Promise<Map<string, any>> {
  const integrations = new Map<string, any>();

  for (const config of configs) {
    if (config.enabled) {
      try {
        const instance = await loadIntegration(config);
        integrations.set(config.name, instance);
        console.log(`[Integrations] Initialized: ${config.name}`);
      } catch (error) {
        console.error(`[Integrations] Failed to initialize ${config.name}:`, error);
      }
    }
  }

  return integrations;
}

/**
 * Health check for all integrations
 */
export async function healthCheckIntegrations(
  integrations: Map<string, any>
): Promise<Record<string, { healthy: boolean; error?: string }>> {
  const results: Record<string, { healthy: boolean; error?: string }> = {};

  for (const [name, instance] of integrations.entries()) {
    try {
      if (typeof instance.healthCheck === 'function') {
        const result = await instance.healthCheck();
        results[name] = result;
      } else {
        results[name] = { healthy: true };
      }
    } catch (error) {
      results[name] = {
        healthy: false,
        error: String(error),
      };
    }
  }

  return results;
}

/**
 * Get integration by name
 */
export function getIntegration(integrations: Map<string, any>, name: string): any {
  return integrations.get(name);
}

/**
 * List all available integrations
 */
export function listAvailableIntegrations(): string[] {
  const list: string[] = [];

  for (const category of Object.values(IntegrationRegistry)) {
    for (const integration of Object.keys(category)) {
      list.push(integration);
    }
  }

  return list;
}

export default {
  IntegrationRegistry,
  loadIntegration,
  initializeIntegrations,
  healthCheckIntegrations,
  getIntegration,
  listAvailableIntegrations,
};
