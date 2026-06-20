export interface EnterpriseConnector {
  name: string;
  category: string;
  auth: 'oauth' | 'api_key' | 'webhook';
  enabled: boolean;
}

export const ENTERPRISE_INTEGRATIONS: Record<string, EnterpriseConnector> = {
  // Workspace Collaboration
  slack: {
    name: 'Slack',
    category: 'collaboration',
    auth: 'oauth',
    enabled: true
  },
  teams: {
    name: 'Microsoft Teams',
    category: 'collaboration',
    auth: 'oauth',
    enabled: true
  },
  discord: {
    name: 'Discord',
    category: 'collaboration',
    auth: 'oauth',
    enabled: true
  },

  // Cloud Storage
  google_drive: {
    name: 'Google Drive',
    category: 'storage',
    auth: 'oauth',
    enabled: true
  },
  onedrive: {
    name: 'Microsoft OneDrive',
    category: 'storage',
    auth: 'oauth',
    enabled: true
  },
  dropbox: {
    name: 'Dropbox',
    category: 'storage',
    auth: 'oauth',
    enabled: true
  },
  box: {
    name: 'Box',
    category: 'storage',
    auth: 'oauth',
    enabled: true
  },

  // Email
  gmail: {
    name: 'Gmail',
    category: 'email',
    auth: 'oauth',
    enabled: true
  },
  outlook: {
    name: 'Microsoft Outlook',
    category: 'email',
    auth: 'oauth',
    enabled: true
  },

  // Project Management
  jira: {
    name: 'Jira',
    category: 'project_management',
    auth: 'api_key',
    enabled: true
  },
  asana: {
    name: 'Asana',
    category: 'project_management',
    auth: 'api_key',
    enabled: true
  },
  monday: {
    name: 'Monday.com',
    category: 'project_management',
    auth: 'api_key',
    enabled: true
  },

  // Ticketing & Support
  servicenow: {
    name: 'ServiceNow',
    category: 'ticketing',
    auth: 'api_key',
    enabled: true
  },
  zendesk: {
    name: 'Zendesk',
    category: 'ticketing',
    auth: 'api_key',
    enabled: true
  },
  freshdesk: {
    name: 'Freshdesk',
    category: 'ticketing',
    auth: 'api_key',
    enabled: true
  },

  // SIEM & Monitoring
  splunk: {
    name: 'Splunk',
    category: 'siem',
    auth: 'api_key',
    enabled: true
  },
  datadog: {
    name: 'Datadog',
    category: 'monitoring',
    auth: 'api_key',
    enabled: true
  },
  new_relic: {
    name: 'New Relic',
    category: 'monitoring',
    auth: 'api_key',
    enabled: true
  },

  // Identity & Access
  okta: {
    name: 'Okta',
    category: 'iam',
    auth: 'oauth',
    enabled: true
  },
  azure_ad: {
    name: 'Azure Active Directory',
    category: 'iam',
    auth: 'oauth',
    enabled: true
  },
  ldap: {
    name: 'LDAP/Active Directory',
    category: 'iam',
    auth: 'api_key',
    enabled: true
  },

  // CRM
  salesforce: {
    name: 'Salesforce',
    category: 'crm',
    auth: 'oauth',
    enabled: true
  },
  hubspot: {
    name: 'HubSpot',
    category: 'crm',
    auth: 'api_key',
    enabled: true
  },

  // Webhooks & Automation
  zapier: {
    name: 'Zapier',
    category: 'automation',
    auth: 'webhook',
    enabled: true
  },
  make: {
    name: 'Make (formerly Integromat)',
    category: 'automation',
    auth: 'webhook',
    enabled: true
  },

  // Healthcare (For BlockStop Health)
  epic_emr: {
    name: 'Epic EHR',
    category: 'healthcare',
    auth: 'api_key',
    enabled: true
  },
  cerner: {
    name: 'Cerner',
    category: 'healthcare',
    auth: 'api_key',
    enabled: true
  },
  fhir: {
    name: 'FHIR',
    category: 'healthcare',
    auth: 'oauth',
    enabled: true
  }
};

export function getEnterpriseConnectors(category?: string): EnterpriseConnector[] {
  const connectors = Object.values(ENTERPRISE_INTEGRATIONS);
  return category ? connectors.filter(c => c.category === category) : connectors;
}

export function getConnectorsByTier(tier: string): EnterpriseConnector[] {
  const tierAccess: { [key: string]: string[] } = {
    free: [],
    neo: ['slack', 'teams', 'gmail', 'outlook', 'google-drive', 'onedrive'],
    pro: ['slack', 'teams', 'discord', 'gmail', 'outlook', 'google-drive', 'onedrive', 'dropbox', 'box', 'jira', 'servicenow', 'splunk'],
    office: Object.keys(ENTERPRISE_INTEGRATIONS).filter(k => k !== 'epic_emr' && k !== 'cerner' && k !== 'fhir'),
    health: Object.keys(ENTERPRISE_INTEGRATIONS)
  };

  const allowed = tierAccess[tier] || [];
  return Object.entries(ENTERPRISE_INTEGRATIONS)
    .filter(([key]) => allowed.includes(key))
    .map(([, value]) => value);
}
