/**
 * Threat Intelligence Correlation Types
 */

export interface CorrelationResult {
  iocId1: string;
  iocId2: string;
  correlationType: string;
  confidenceScore: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface ThreatCluster {
  id: string;
  iocIds: string[];
  campaignName?: string;
  threatActors: string[];
  confidenceScore: number;
  malwareFamilies: string[];
  killChainPhases: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignCluster {
  id: string;
  name: string;
  description: string;
  iocIds: string[];
  threatActors: string[];
  targets: string[];
  startDate: Date;
  endDate?: Date;
  confidence: number;
  ttps: string[];
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  countryOfOrigin?: string;
  sophisticationLevel: 'novice' | 'intermediate' | 'expert' | 'nation-state';
  motivations: string[];
  targetedIndustries: string[];
  targetedCountries: string[];
  knownIOCIds: string[];
  campaigns: string[];
  firstObserved: Date;
  lastObserved: Date;
}

export interface AttackPattern {
  id: string;
  name: string;
  mitreTechnique?: string;
  description: string;
  iocIds: string[];
  campaigns: string[];
  frequency: number;
  lastObserved: Date;
}

export interface MalwareFamily {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  malwareType: string;
  iocIds: string[];
  hash: string[];
  domainsCnc: string[];
  ipsCnc: string[];
  firstObserved: Date;
  lastObserved: Date;
  variants: string[];
  capabilities: string[];
}

export interface EnrichmentData {
  iocValue: string;
  iocType: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  whois?: {
    registrar: string;
    registrationDate: Date;
    expirationDate: Date;
    registrant: string;
    nameServers: string[];
  };
  dnsHistory?: {
    query: string;
    resolvedIPs: string[];
    timestamp: Date;
  }[];
  sslCertificate?: {
    issuer: string;
    subject: string;
    validFrom: Date;
    validTo: Date;
    fingerprint: string;
  };
  malwareBehavior?: {
    sandboxUrl: string;
    behavior: string[];
    detections: number;
  };
  relatedVulnerabilities?: string[];
}

export interface CorrelationQuery {
  iocIds?: string[];
  iocValue?: string;
  iocType?: string;
  threatLevel?: string;
  tags?: string[];
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  minConfidence?: number;
  correlationTypes?: string[];
  limit?: number;
}

export interface CorrelationMetrics {
  totalCorrelations: number;
  correlationsByType: Record<string, number>;
  averageConfidenceScore: number;
  clustersDetected: number;
  campaignsTracked: number;
  threatActorsIdentified: number;
}
