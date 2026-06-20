// BlockStop Extension Types

export type TierLevel = 'free' | 'neo' | 'pro' | 'office' | 'max';

export interface User {
  id: string;
  email: string;
  tier: TierLevel;
  subscription?: {
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: number;
  };
}

export interface Threat {
  id: string;
  type: 'phishing' | 'malware' | 'spam' | 'suspicious';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  indicators: string[];
  confidence: number; // 0-100
  timestamp: number;
  remediation?: string;
}

export interface EmailAnalysisRequest {
  emailSubject: string;
  emailFrom: string;
  emailBody: string;
  links?: string[];
}

export interface EmailAnalysisResult {
  riskScore: number; // 0-100
  threats: Threat[];
  safeLinks: string[];
  suspiciousLinks: string[];
  timestamp: number;
}

export interface LinkCheckResult {
  url: string;
  isSafe: boolean;
  threats?: Threat[];
  riskScore: number;
  lastChecked: number;
}

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  threatLevel: 'safe' | 'suspicious' | 'dangerous' | 'malware';
  threats: Threat[];
  riskScore: number;
  timestamp: number;
}

export interface ScanHistory {
  id: string;
  type: 'email' | 'link' | 'file';
  target: string; // email, URL, or filename
  result: EmailAnalysisResult | LinkCheckResult | FileAnalysisResult;
  timestamp: number;
}

export interface ExtensionConfig {
  apiUrl: string;
  offlineMode: boolean;
  enabledFeatures: {
    emailScanning: boolean;
    linkChecking: boolean;
    fileScanning: boolean;
  };
  notificationSettings: {
    criticalAlerts: boolean;
    scanComplete: boolean;
    securityTips: boolean;
  };
}

// Offline Database Schema
export interface ThreatSignature {
  id: string;
  hash: string;
  type: 'phishing' | 'malware' | 'spam' | 'suspicious';
  pattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  description: string;
}

export interface SyncMetadata {
  lastSyncTimestamp: number;
  version: string;
  tierLevel: TierLevel;
  signatureCount: number;
  databaseSize: number;
}

export interface OfflineDatabase {
  threatSignatures: ThreatSignature[];
  phishingPatterns: string[];
  malwareSignatures: string[];
  lastUpdated: number;
  version: string;
  tierLevel: TierLevel;
}

export interface TierFeatures {
  emailScanning: boolean;
  linkChecking: boolean;
  fileScanning: boolean;
  offlineMode: boolean;
  threatDatabase: 'full' | 'limited' | 'none';
  maxScansPerDay: number;
  aiPowered: boolean;
}

// Message Protocol Types
export type MessageType =
  | 'SCAN_EMAIL'
  | 'SCAN_LINK'
  | 'SCAN_FILE'
  | 'AUTH_OAUTH'
  | 'GET_AUTH_STATUS'
  | 'GET_SCAN_HISTORY'
  | 'CLEAR_HISTORY'
  | 'GET_CONFIG'
  | 'UPDATE_SETTINGS'
  | 'SYNC_OFFLINE_DB'
  | 'REPORT_THREAT'
  | 'GET_TIER_INFO';

export interface Message {
  type: MessageType;
  payload: Record<string, any>;
  timestamp?: number;
  correlationId?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: number;
}

// Subscription Token (JWT payload)
export interface SubscriptionToken {
  userId: string;
  email: string;
  tier: TierLevel;
  issuedAt: number;
  expiresAt: number;
  features: TierFeatures;
}

// Offline Sync Queue
export interface OfflineScanRequest {
  id: string;
  type: 'email' | 'link' | 'file';
  target: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}
