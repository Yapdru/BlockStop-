/**
 * Threat Intelligence Feed Types
 * Defines all data structures for threat feeds and IOCs
 */

export enum FeedType {
  STIX = 'stix',
  CSV = 'csv',
  JSON = 'json',
  YARA = 'yara',
  OPENIOC = 'openioc',
  MISP = 'misp',
  SNORT = 'snort',
  SURICATA = 'suricata',
  CUSTOM = 'custom',
}

export enum IOCType {
  HASH = 'hash',
  IP = 'ip',
  DOMAIN = 'domain',
  URL = 'url',
  EMAIL = 'email',
  FILE = 'file',
  CERTIFICATE = 'certificate',
  REGISTRY = 'registry',
  PROCESS = 'process',
  MUTANT = 'mutant',
}

export enum ThreatLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational',
}

export enum TLPLevel {
  WHITE = 'white',
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

export interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  feedType: FeedType;
  provider: string;
  updateFrequencyMinutes: number;
  lastUpdate: Date;
  iocCount: number;
  qualityScore: number;
  isActive: boolean;
  requiresAuthentication: boolean;
  apiKey?: string;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndicatorOfCompromise {
  id: string;
  feedId: string;
  iocType: IOCType;
  iocValue: string;
  iocFamily?: string;
  threatLevel: ThreatLevel;
  confidenceScore: number;
  tlpLevel: TLPLevel;
  sourceAttribution: string;
  firstSeen: Date;
  lastSeen: Date;
  description?: string;
  tags: string[];
  related?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOCCorrelation {
  id: string;
  iocId1: string;
  iocId2: string;
  correlationType: string;
  confidenceScore: number;
  correlationReason: string;
  createdAt: Date;
}

export interface FeedValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  iocCount: number;
  validationTime: number;
}

export interface FeedNormalizationResult {
  normalizedIOCs: IndicatorOfCompromise[];
  duplicateCount: number;
  processingTime: number;
}

export interface FeedHealth {
  feedId: string;
  lastSuccessfulUpdate: Date;
  lastFailedUpdate?: Date;
  consecutiveFailures: number;
  uptime: number;
  averageLatency: number;
  status: 'healthy' | 'degraded' | 'failed';
}

export interface FeedSchedule {
  feedId: string;
  cronExpression: string;
  nextRun: Date;
  lastRun?: Date;
  isActive: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  type: string;
  url?: string;
  apiEndpoint?: string;
  authentication?: {
    type: 'apiKey' | 'oauth' | 'basicAuth';
    credentials: Record<string, string>;
  };
  reliability: number;
}

export interface FeedDeduplicationResult {
  uniqueIOCs: IndicatorOfCompromise[];
  duplicateCount: number;
  mergedIOCs: Map<string, string[]>;
}

export interface IOCSearchQuery {
  iocValue?: string;
  iocType?: IOCType;
  threatLevel?: ThreatLevel;
  feedId?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface IOCSearchResult {
  totalCount: number;
  results: IndicatorOfCompromise[];
  facets?: Record<string, Record<string, number>>;
}
