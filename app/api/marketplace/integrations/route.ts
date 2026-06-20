/**
 * Integration Marketplace API
 * One-click integrations for Slack, Teams, Discord, etc.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface Integration {
  id: string;
  name: string;
  platform: 'slack' | 'teams' | 'discord' | 'zendesk' | 'jira' | 'pagerduty' | 'splunk';
  description: string;
  icon: string;
  category: 'communication' | 'ticketing' | 'monitoring' | 'siem' | 'incident_management';
  version: string;
  installCount: number;
  ratingScore: number;
  downloads: number;
  featured: boolean;
  oauthRequired: boolean;
  oauthScopes: string[];
  webhookSupport: boolean;
  configurationUrl: string;
  documentationUrl: string;
  supportEmail: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  features: {
    notifications: boolean;
    alerting: boolean;
    reporting: boolean;
    automation: boolean;
  };
  pricingTier: 'free' | 'pro' | 'max';
  revenueShare: number; // 70% to developer
}

export interface IntegrationConfig {
  integrationId: string;
  userId: string;
  workspaceId: string;
  configName: string;
  status: 'active' | 'inactive' | 'error';
  credentials: {
    apiKey?: string;
    accessToken?: string;
    webhookUrl?: string;
    teamId?: string;
    channelId?: string;
  };
  settings: {
    enableNotifications: boolean;
    enableAlerts: boolean;
    alertThreshold: number;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
    includeDetails: boolean;
  };
  installedAt: Date;
  lastConfiguredAt: Date;
  errorLog: Array<{ timestamp: Date; error: string }>;
}

export interface OAuthSetup {
  integrationId: string;
  userId: string;
  state: string;
  step: 'authorize' | 'configure' | 'verify' | 'complete';
  authorizationCode?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  createdAt: Date;
}

// In-memory storage
const integrations: Map<string, Integration> = new Map();
const userConfigs: Map<string, IntegrationConfig[]> = new Map();
const oauthSessions: Map<string, OAuthSetup> = new Map();

// Initialize with popular integrations
function initializeIntegrations() {
  const defaultIntegrations: Integration[] = [
    {
      id: 'slack-integration',
      name: 'Slack',
      platform: 'slack',
      description: 'Get BlockStop threat alerts in your Slack workspace',
      icon: 'slack',
      category: 'communication',
      version: '2.1.0',
      installCount: 5430,
      ratingScore: 4.8,
      downloads: 6200,
      featured: true,
      oauthRequired: true,
      oauthScopes: ['chat:write', 'incoming-webhook', 'commands:read'],
      webhookSupport: true,
      configurationUrl: 'https://slack.com/apps',
      documentationUrl: 'https://docs.blockstop.ai/integrations/slack',
      supportEmail: 'support@blockstop.ai',
      createdBy: 'blockstop-team',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      features: {
        notifications: true,
        alerting: true,
        reporting: true,
        automation: true,
      },
      pricingTier: 'free',
      revenueShare: 0,
    },
    {
      id: 'teams-integration',
      name: 'Microsoft Teams',
      platform: 'teams',
      description: 'Real-time threat notifications in Microsoft Teams',
      icon: 'teams',
      category: 'communication',
      version: '2.0.5',
      installCount: 3840,
      ratingScore: 4.7,
      downloads: 4500,
      featured: true,
      oauthRequired: true,
      oauthScopes: ['chat:write', 'team:read'],
      webhookSupport: true,
      configurationUrl: 'https://teams.microsoft.com',
      documentationUrl: 'https://docs.blockstop.ai/integrations/teams',
      supportEmail: 'support@blockstop.ai',
      createdBy: 'blockstop-team',
      createdAt: new Date('2023-02-15'),
      updatedAt: new Date(),
      features: {
        notifications: true,
        alerting: true,
        reporting: true,
        automation: false,
      },
      pricingTier: 'free',
      revenueShare: 0,
    },
    {
      id: 'discord-integration',
      name: 'Discord',
      platform: 'discord',
      description: 'Get threat alerts in your Discord server',
      icon: 'discord',
      category: 'communication',
      version: '1.8.2',
      installCount: 2150,
      ratingScore: 4.5,
      downloads: 2800,
      featured: false,
      oauthRequired: true,
      oauthScopes: ['webhook.incoming', 'bot:read'],
      webhookSupport: true,
      configurationUrl: 'https://discord.com/developers',
      documentationUrl: 'https://docs.blockstop.ai/integrations/discord',
      supportEmail: 'support@blockstop.ai',
      createdBy: 'blockstop-team',
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date(),
      features: {
        notifications: true,
        alerting: true,
        reporting: false,
        automation: false,
      },
      pricingTier: 'free',
      revenueShare: 0,
    },
    {
      id: 'jira-integration',
      name: 'Jira',
      platform: 'jira',
      description: 'Auto-create tickets for critical threats',
      icon: 'jira',
      category: 'ticketing',
      version: '1.5.3',
      installCount: 1680,
      ratingScore: 4.6,
      downloads: 2100,
      featured: false,
      oauthRequired: true,
      oauthScopes: ['issue:create', 'issue:read', 'project:read'],
      webhookSupport: true,
      configurationUrl: 'https://jira.atlassian.com',
      documentationUrl: 'https://docs.blockstop.ai/integrations/jira',
      supportEmail: 'support@blockstop.ai',
      createdBy: 'blockstop-team',
      createdAt: new Date('2023-04-10'),
      updatedAt: new Date(),
      features: {
        notifications: true,
        alerting: true,
        reporting: true,
        automation: true,
      },
      pricingTier: 'pro',
      revenueShare: 0,
    },
    {
      id: 'splunk-integration',
      name: 'Splunk',
      platform: 'splunk',
      description: 'Stream all BlockStop events to Splunk',
      icon: 'splunk',
      category: 'siem',
      version: '2.2.0',
      installCount: 945,
      ratingScore: 4.8,
      downloads: 1350,
      featured: false,
      oauthRequired: false,
      oauthScopes: ['hec:write'],
      webhookSupport: true,
      configurationUrl: 'https://www.splunk.com',
      documentationUrl: 'https://docs.blockstop.ai/integrations/splunk',
      supportEmail: 'support@blockstop.ai',
      createdBy: 'blockstop-team',
      createdAt: new Date('2023-05-05'),
      updatedAt: new Date(),
      features: {
        notifications: false,
        alerting: false,
        reporting: true,
        automation: false,
      },
      pricingTier: 'max',
      revenueShare: 0,
    },
  ];

  for (const integration of defaultIntegrations) {
    integrations.set(integration.id, integration);
  }
}

initializeIntegrations();

/**
 * GET /api/marketplace/integrations
 * List all available integrations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const featured = searchParams.get('featured') === 'true';
    const pricingTier = searchParams.get('tier');

    let result = Array.from(integrations.values());

    if (category) {
      result = result.filter(i => i.category === category);
    }

    if (platform) {
      result = result.filter(i => i.platform === platform);
    }

    if (featured) {
      result = result.filter(i => i.featured);
    }

    if (pricingTier) {
      result = result.filter(i => i.pricingTier === pricingTier);
    }

    result.sort((a, b) => b.ratingScore - a.ratingScore);

    return NextResponse.json({
      success: true,
      data: {
        integrations: result,
        total: result.length,
        categories: ['communication', 'ticketing', 'monitoring', 'siem', 'incident_management'],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/integrations/:integrationId/install
 * Install an integration
 */
export async function POST(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/');
    const integrationId = pathParts[4];
    const { userId, workspaceId } = await request.json();

    if (!integrationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const integration = integrations.get(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // If OAuth required, initiate OAuth flow
    if (integration.oauthRequired) {
      const state = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const oauthSetup: OAuthSetup = {
        integrationId,
        userId,
        state,
        step: 'authorize',
        createdAt: new Date(),
      };

      oauthSessions.set(state, oauthSetup);

      const authUrl = new URL(`https://${integration.platform}.com/oauth/authorize`);
      authUrl.searchParams.append('client_id', `blockstop_${integrationId}`);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('scope', integration.oauthScopes.join(' '));
      authUrl.searchParams.append('redirect_uri', 'https://app.blockstop.ai/integrations/callback');

      return NextResponse.json({
        success: true,
        data: {
          authUrl: authUrl.toString(),
          state,
        },
        message: 'OAuth flow initiated',
      });
    }

    // Direct installation for non-OAuth integrations
    const config: IntegrationConfig = {
      integrationId,
      userId,
      workspaceId: workspaceId || 'default',
      configName: `${integration.name} - Default`,
      status: 'active',
      credentials: {
        webhookUrl: `https://hooks.blockstop.ai/${userId}/${integrationId}`,
      },
      settings: {
        enableNotifications: true,
        enableAlerts: true,
        alertThreshold: 60,
        notificationFrequency: 'immediate',
        includeDetails: true,
      },
      installedAt: new Date(),
      lastConfiguredAt: new Date(),
      errorLog: [],
    };

    if (!userConfigs.has(userId)) {
      userConfigs.set(userId, []);
    }

    userConfigs.get(userId)!.push(config);
    integration.installCount++;

    return NextResponse.json(
      {
        success: true,
        data: config,
        message: 'Integration installed successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to install integration' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/marketplace/integrations/:integrationId/config
 * Get configuration for an installed integration
 */
export async function GET_CONFIG(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const configs = userConfigs.get(userId) || [];
    return NextResponse.json({
      success: true,
      data: {
        configurations: configs,
        total: configs.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/marketplace/integrations/:integrationId/config
 * Update integration configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, configId, settings } = await request.json();

    if (!userId || !configId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const configs = userConfigs.get(userId) || [];
    const config = configs.find(c => c.integrationId === configId);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    config.settings = { ...config.settings, ...settings };
    config.lastConfiguredAt = new Date();

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuration updated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update configuration' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/marketplace/integrations/:integrationId
 * Uninstall an integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, integrationId } = await request.json();

    if (!userId || !integrationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const configs = userConfigs.get(userId) || [];
    const index = configs.findIndex(c => c.integrationId === integrationId);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Integration not installed' },
        { status: 404 }
      );
    }

    configs.splice(index, 1);
    const integration = integrations.get(integrationId);
    if (integration) {
      integration.installCount--;
    }

    return NextResponse.json({
      success: true,
      message: 'Integration uninstalled',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to uninstall integration' },
      { status: 400 }
    );
  }
}
