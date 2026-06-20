// Integration Management System
import {
  Integration,
  IntegrationTemplate,
  IntegrationConfig,
  TemplateField,
} from './types';
import crypto from 'crypto';

class IntegrationManager {
  private integrations: Map<string, Integration> = new Map();
  private templates: Map<string, IntegrationTemplate> = new Map();

  registerIntegration(
    name: string,
    type: string,
    category: string,
    config: IntegrationConfig,
    orgId?: string
  ): Integration {
    const id = crypto.randomUUID();
    const integration: Integration = {
      id,
      name,
      type: type as any,
      category,
      description: '',
      version: '1.0.0',
      enabled: false,
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.integrations.set(id, integration);
    return integration;
  }

  getIntegration(integrationId: string): Integration | null {
    return this.integrations.get(integrationId) || null;
  }

  listIntegrations(
    type?: string,
    enabled?: boolean
  ): Integration[] {
    return Array.from(this.integrations.values()).filter(i => {
      if (type && i.type !== type) return false;
      if (enabled !== undefined && i.enabled !== enabled) return false;
      return true;
    });
  }

  enableIntegration(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.enabled = true;
      integration.updatedAt = new Date();
      return true;
    }
    return false;
  }

  disableIntegration(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    if (integration) {
      integration.enabled = false;
      integration.updatedAt = new Date();
      return true;
    }
    return false;
  }

  updateIntegrationConfig(
    integrationId: string,
    config: Partial<IntegrationConfig>
  ): Integration | null {
    const integration = this.integrations.get(integrationId);
    if (!integration) return null;

    integration.config = { ...integration.config, ...config };
    integration.updatedAt = new Date();
    return integration;
  }

  deleteIntegration(integrationId: string): boolean {
    return this.integrations.delete(integrationId);
  }

  registerTemplate(
    name: string,
    type: string,
    description: string,
    requiredFields: TemplateField[]
  ): IntegrationTemplate {
    const id = crypto.randomUUID();
    const template: IntegrationTemplate = {
      id,
      name,
      type,
      description,
      requiredFields,
      documentation: '',
    };

    this.templates.set(id, template);
    return template;
  }

  getTemplate(templateId: string): IntegrationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  listTemplates(type?: string): IntegrationTemplate[] {
    return Array.from(this.templates.values()).filter(t =>
      type ? t.type === type : true
    );
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    try {
      // Test based on integration type
      switch (integration.type) {
        case 'siem':
          return await this.testSIEMIntegration(integration);
        case 'ticketing':
          return await this.testTicketingIntegration(integration);
        case 'communication':
          return await this.testCommunicationIntegration(integration);
        default:
          return false;
      }
    } catch (error) {
      console.error('Integration test failed:', error);
      return false;
    }
  }

  private async testSIEMIntegration(integration: Integration): Promise<boolean> {
    const { apiEndpoint, apiKey } = integration.config;
    if (!apiEndpoint || !apiKey) return false;

    try {
      const response = await fetch(`${apiEndpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testTicketingIntegration(
    integration: Integration
  ): Promise<boolean> {
    const { apiEndpoint, apiKey } = integration.config;
    if (!apiEndpoint || !apiKey) return false;

    try {
      const response = await fetch(`${apiEndpoint}/api/3/issues`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testCommunicationIntegration(
    integration: Integration
  ): Promise<boolean> {
    const { webhook } = integration.config;
    if (!webhook) return false;

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        timeout: 5000,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  createIntegrationFromTemplate(
    templateId: string,
    name: string,
    parameters: Record<string, any>
  ): Integration | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Validate required fields
    for (const field of template.requiredFields) {
      if (!parameters[field.name]) {
        throw new Error(`Missing required field: ${field.name}`);
      }
    }

    return this.registerIntegration(name, template.type, '', {
      parameters,
      authentication: 'api_key',
      testable: true,
    });
  }
}

export const integrationManager = new IntegrationManager();

// Pre-built Integration Templates
export function initializeDefaultTemplates() {
  // SIEM Templates
  integrationManager.registerTemplate(
    'Splunk',
    'siem',
    'Send BlockStop threats to Splunk',
    [
      {
        name: 'apiEndpoint',
        type: 'string',
        label: 'Splunk API Endpoint',
        required: true,
        placeholder: 'https://splunk.example.com:8089',
      },
      {
        name: 'apiKey',
        type: 'string',
        label: 'API Key',
        required: true,
        placeholder: 'Enter your API key',
      },
      {
        name: 'index',
        type: 'string',
        label: 'Target Index',
        required: false,
        placeholder: 'blockstop_threats',
      },
    ]
  );

  integrationManager.registerTemplate(
    'Elasticsearch',
    'siem',
    'Send BlockStop threats to Elasticsearch',
    [
      {
        name: 'apiEndpoint',
        type: 'string',
        label: 'Elasticsearch Endpoint',
        required: true,
        placeholder: 'https://elastic.example.com:9200',
      },
      {
        name: 'username',
        type: 'string',
        label: 'Username',
        required: true,
      },
      {
        name: 'password',
        type: 'string',
        label: 'Password',
        required: true,
      },
      {
        name: 'index',
        type: 'string',
        label: 'Index Name',
        required: false,
        placeholder: 'blockstop-threats',
      },
    ]
  );

  // Ticketing Templates
  integrationManager.registerTemplate(
    'Jira',
    'ticketing',
    'Create Jira issues from BlockStop alerts',
    [
      {
        name: 'apiEndpoint',
        type: 'string',
        label: 'Jira Instance URL',
        required: true,
        placeholder: 'https://jira.example.com',
      },
      {
        name: 'apiKey',
        type: 'string',
        label: 'API Token',
        required: true,
      },
      {
        name: 'projectKey',
        type: 'string',
        label: 'Project Key',
        required: true,
        placeholder: 'SEC',
      },
    ]
  );

  integrationManager.registerTemplate(
    'ServiceNow',
    'ticketing',
    'Create ServiceNow incidents from BlockStop threats',
    [
      {
        name: 'apiEndpoint',
        type: 'string',
        label: 'ServiceNow Instance URL',
        required: true,
      },
      {
        name: 'apiKey',
        type: 'string',
        label: 'API Key',
        required: true,
      },
    ]
  );

  // Communication Templates
  integrationManager.registerTemplate(
    'Slack',
    'communication',
    'Send BlockStop alerts to Slack',
    [
      {
        name: 'webhook',
        type: 'string',
        label: 'Slack Webhook URL',
        required: true,
        placeholder: 'https://hooks.slack.com/services/...',
      },
      {
        name: 'channel',
        type: 'string',
        label: 'Channel',
        required: false,
        placeholder: '#security-alerts',
      },
    ]
  );

  integrationManager.registerTemplate(
    'Microsoft Teams',
    'communication',
    'Send BlockStop alerts to Microsoft Teams',
    [
      {
        name: 'webhook',
        type: 'string',
        label: 'Teams Webhook URL',
        required: true,
      },
    ]
  );

  // Threat Intelligence Templates
  integrationManager.registerTemplate(
    'VirusTotal',
    'threat_intel',
    'Enrich threats with VirusTotal data',
    [
      {
        name: 'apiKey',
        type: 'string',
        label: 'VirusTotal API Key',
        required: true,
      },
    ]
  );

  integrationManager.registerTemplate(
    'AlienVault OTX',
    'threat_intel',
    'Enrich threats with AlienVault OTX data',
    [
      {
        name: 'apiKey',
        type: 'string',
        label: 'OTX API Key',
        required: true,
      },
    ]
  );

  // Cloud Provider Templates
  integrationManager.registerTemplate(
    'AWS',
    'cloud',
    'Integrate with AWS services',
    [
      {
        name: 'accessKeyId',
        type: 'string',
        label: 'Access Key ID',
        required: true,
      },
      {
        name: 'secretAccessKey',
        type: 'string',
        label: 'Secret Access Key',
        required: true,
      },
      {
        name: 'region',
        type: 'string',
        label: 'AWS Region',
        required: false,
        placeholder: 'us-east-1',
      },
    ]
  );
}
