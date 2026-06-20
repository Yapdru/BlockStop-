// BlockStop Extension Types

export interface User {
  id: string;
  email: string;
  tier: 'free' | 'neo' | 'pro' | 'office' | 'health' | 'max';
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

export interface OfflineDatabase {
  threatSignatures: Map<string, Threat>;
  phishingPatterns: string[];
  lastUpdated: number;
  version: string;
}
