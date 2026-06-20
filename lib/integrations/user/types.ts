export enum ServiceType {
  EMAIL = 'email',
  CLOUD_STORAGE = 'cloud_storage',
  COMMUNICATION = 'communication',
  PASSWORD_MANAGER = 'password_manager',
  VPN = 'vpn'
}

export enum ServiceProvider {
  // Email
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  PROTONMAIL = 'protonmail',
  YAHOO = 'yahoo',
  APPLE_MAIL = 'apple_mail',
  // Cloud Storage
  GOOGLE_DRIVE = 'google_drive',
  ONEDRIVE = 'onedrive',
  DROPBOX = 'dropbox',
  BOX = 'box',
  // Communication
  SLACK = 'slack',
  TEAMS = 'teams',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  // Password Manager
  ONEPASSWORD = '1password',
  LASTPASS = 'lastpass',
  BITWARDEN = 'bitwarden',
  // VPN
  PROTONVPN = 'protonvpn',
  EXPRESSVPN = 'expressvpn',
  NORDVPN = 'nordvpn'
}

export interface UserIntegration {
  id: string;
  userId: string;
  provider: ServiceProvider;
  serviceType: ServiceType;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  isActive: boolean;
  scopes: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  provider: ServiceProvider;
  serviceType: ServiceType;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiEndpoint?: string;
  apiVersion?: string;
}

export interface OAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scope: string;
}

export interface IntegrationStatus {
  provider: ServiceProvider;
  isConnected: boolean;
  lastSyncAt?: Date;
  errorMessage?: string;
  tokenExpiry?: Date;
}

export interface ScanResult {
  provider: ServiceProvider;
  timestamp: Date;
  itemsScanned: number;
  threatsDetected: number;
  details: ScanDetail[];
}

export interface ScanDetail {
  itemId: string;
  itemName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: string[];
  metadata: Record<string, unknown>;
}

export interface IntegrationError extends Error {
  provider: ServiceProvider;
  statusCode?: number;
  code: string;
  retryable: boolean;
}
