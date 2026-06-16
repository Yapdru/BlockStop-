// Threat Intelligence Types and Interfaces

export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  value: string;
  source: string;
  confidence: number; // 0-100
  firstSeen: Date;
  lastSeen: Date;
  context?: Record<string, unknown>;
  tags: string[];
}

export interface ThreatFeed {
  id: string;
  name: string;
  type: 'abuse-ch' | 'otx' | 'threatstream' | 'circl' | 'shodan' | 'virustotal' | 'urlhaus' | 'phishtank';
  url: string;
  apiKey?: string;
  enabled: boolean;
  updateInterval: number; // milliseconds
  lastUpdate?: Date;
  nextUpdate?: Date;
  indicators?: IOC[];
  rateLimit?: {
    requests: number;
    period: number; // milliseconds
  };
}

export interface ThreatCorrelation {
  id: string;
  iocs: IOC[];
  correlationType: 'campaign' | 'actor' | 'infrastructure' | 'malware';
  confidence: number;
  relationships: IOCRelationship[];
  detectedAt: Date;
}

export interface IOCRelationship {
  sourceId: string;
  targetId: string;
  type: 'resolves-to' | 'hosted-on' | 'communicates-with' | 'indicates' | 'related-to';
  strength: number; // 0-100
}

export interface MLThreatPrediction {
  id: string;
  ioc: IOC;
  riskScore: number; // 0-100
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  modelVersion: string;
  confidence: number;
  predictions: {
    malware: number;
    phishing: number;
    c2: number;
    ransomware: number;
    apt: number;
  };
  timestamp: Date;
}

export interface AnomalyDetectionResult {
  id: string;
  ioc: IOC;
  isAnomaly: boolean;
  anomalyScore: number;
  reason: string;
  detectedAt: Date;
}

export interface ZeroDayIndicator {
  id: string;
  pattern: string;
  riskScore: number;
  indicators: IOC[];
  firstDetected: Date;
  lastObserved: Date;
  exploitCode?: string;
  affectedSystems: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  attributedActors: string[];
  tactics: string[];
  techniques: string[];
  iocs: IOC[];
  confidence: number;
  relatedCampaigns: string[];
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  origin: string;
  motivations: string[];
  capabilities: string[];
  targetedSectors: string[];
  campaigns: string[];
  infrastructure: IOC[];
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
}

export interface FeedUpdateResult {
  feedId: string;
  feedName: string;
  timestamp: Date;
  success: boolean;
  newIndicators: number;
  updatedIndicators: number;
  error?: string;
  duration: number; // milliseconds
}

export interface MLModelMetadata {
  id: string;
  name: string;
  version: string;
  type: 'threat-predictor' | 'anomaly-detector' | 'classifier';
  inputShape: number[];
  outputShape: number[];
  accuracy?: number;
  lastTrained: Date;
  quantized: boolean;
  size: number; // bytes
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // milliseconds
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  storageKey: string;
}
