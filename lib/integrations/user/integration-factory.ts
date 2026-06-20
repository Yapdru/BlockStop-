import { ServiceProvider, UserIntegration, ServiceType } from './types';
import { BaseUserIntegration } from './base-integration';
import { GmailIntegration } from './email/gmail-integration';
import { OutlookIntegration } from './email/outlook-integration';
import { ProtonmailIntegration } from './email/protonmail-integration';
import { GoogleDriveIntegration } from './cloud/google-drive-integration';
import { OneDriveIntegration } from './cloud/onedrive-integration';

interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface ProviderConfigMap {
  [key in ServiceProvider]?: ProviderConfig;
}

export class IntegrationFactory {
  private configs: ProviderConfigMap = {};

  registerConfig(provider: ServiceProvider, config: ProviderConfig): void {
    this.configs[provider] = config;
  }

  createIntegration(userId: string, integration: UserIntegration): BaseUserIntegration {
    const config = this.configs[integration.provider];
    if (!config) {
      throw new Error(`No configuration found for provider: ${integration.provider}`);
    }

    switch (integration.provider) {
      case ServiceProvider.GMAIL:
        return new GmailIntegration(userId, integration, config.clientId, config.clientSecret, config.redirectUri);
      case ServiceProvider.OUTLOOK:
        return new OutlookIntegration(userId, integration, config.clientId, config.clientSecret, config.redirectUri);
      case ServiceProvider.PROTONMAIL:
        return new ProtonmailIntegration(userId, integration, config.clientId, config.clientSecret, config.redirectUri);
      case ServiceProvider.GOOGLE_DRIVE:
        return new GoogleDriveIntegration(userId, integration, config.clientId, config.clientSecret, config.redirectUri);
      case ServiceProvider.ONEDRIVE:
        return new OneDriveIntegration(userId, integration, config.clientId, config.clientSecret, config.redirectUri);
      case ServiceProvider.DROPBOX:
      case ServiceProvider.BOX:
      case ServiceProvider.YAHOO:
      case ServiceProvider.APPLE_MAIL:
      case ServiceProvider.SLACK:
      case ServiceProvider.TEAMS:
      case ServiceProvider.DISCORD:
      case ServiceProvider.TELEGRAM:
      case ServiceProvider.ONEPASSWORD:
      case ServiceProvider.LASTPASS:
      case ServiceProvider.BITWARDEN:
      case ServiceProvider.PROTONVPN:
      case ServiceProvider.EXPRESSVPN:
      case ServiceProvider.NORDVPN:
        throw new Error(`Integration not yet implemented for provider: ${integration.provider}`);
      default:
        throw new Error(`Unknown provider: ${integration.provider}`);
    }
  }

  getServiceType(provider: ServiceProvider): ServiceType {
    const typeMap: { [key in ServiceProvider]: ServiceType } = {
      [ServiceProvider.GMAIL]: ServiceType.EMAIL,
      [ServiceProvider.OUTLOOK]: ServiceType.EMAIL,
      [ServiceProvider.PROTONMAIL]: ServiceType.EMAIL,
      [ServiceProvider.YAHOO]: ServiceType.EMAIL,
      [ServiceProvider.APPLE_MAIL]: ServiceType.EMAIL,
      [ServiceProvider.GOOGLE_DRIVE]: ServiceType.CLOUD_STORAGE,
      [ServiceProvider.ONEDRIVE]: ServiceType.CLOUD_STORAGE,
      [ServiceProvider.DROPBOX]: ServiceType.CLOUD_STORAGE,
      [ServiceProvider.BOX]: ServiceType.CLOUD_STORAGE,
      [ServiceProvider.SLACK]: ServiceType.COMMUNICATION,
      [ServiceProvider.TEAMS]: ServiceType.COMMUNICATION,
      [ServiceProvider.DISCORD]: ServiceType.COMMUNICATION,
      [ServiceProvider.TELEGRAM]: ServiceType.COMMUNICATION,
      [ServiceProvider.ONEPASSWORD]: ServiceType.PASSWORD_MANAGER,
      [ServiceProvider.LASTPASS]: ServiceType.PASSWORD_MANAGER,
      [ServiceProvider.BITWARDEN]: ServiceType.PASSWORD_MANAGER,
      [ServiceProvider.PROTONVPN]: ServiceType.VPN,
      [ServiceProvider.EXPRESSVPN]: ServiceType.VPN,
      [ServiceProvider.NORDVPN]: ServiceType.VPN
    };
    return typeMap[provider];
  }
}

export const createIntegrationFactory = (): IntegrationFactory => {
  const factory = new IntegrationFactory();

  const getConfig = (provider: string): ProviderConfig => {
    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '';
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] || '';
    const redirectUri = process.env.INTEGRATION_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback';

    return { clientId, clientSecret, redirectUri };
  };

  Object.values(ServiceProvider).forEach(provider => {
    try {
      factory.registerConfig(provider as ServiceProvider, getConfig(provider as string));
    } catch (error) {
      console.debug(`Skipping config registration for ${provider}:`, error);
    }
  });

  return factory;
};
