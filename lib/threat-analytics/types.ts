export interface ThreatPattern {
  id: string;
  name: string;
  category: 'malware' | 'exploit' | 'c2' | 'persistence' | 'exfiltration' | 'defense-evasion';
  signatures: string[];
  severity: number;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  metadata: Record<string, unknown>;
}

export interface AttackChain {
  id: string;
  phases: AttackPhase[];
  timeline: AttackEvent[];
  targetedAssets: string[];
  successProbability: number;
  estimatedImpact: number;
  detectionGaps: string[];
}

export interface AttackPhase {
  id: string;
  mitreTactics: string[];
  techniques: string[];
  observables: string[];
  timestamp: Date;
  confidence: number;
}

export interface AttackEvent {
  id: string;
  timestamp: Date;
  type: 'reconnaissance' | 'exploitation' | 'lateral-movement' | 'exfiltration' | 'impact';
  source: string;
  target: string;
  indicators: string[];
  severity: number;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  motivations: string[];
  capabilities: string[];
  targetedSectors: string[];
  knownCampaigns: string[];
  operationalSecurityScore: number;
  lastActive: Date;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface ThreatLifecycle {
  id: string;
  threatId: string;
  stage: 'emerging' | 'growing' | 'peak' | 'declining' | 'dormant';
  trendIndicators: TrendIndicator[];
  projectedEvolution: EvolutionPrediction[];
  timeToMitigation: number;
  confidenceScore: number;
}

export interface TrendIndicator {
  metric: string;
  value: number;
  timestamp: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
}

export interface EvolutionPrediction {
  stage: string;
  probability: number;
  estimatedTimeframe: number;
  implications: string[];
}

export interface ThreatCorrelation {
  threatId1: string;
  threatId2: string;
  correlationScore: number;
  commonIndicators: string[];
  commonActors: string[];
  commonTargets: string[];
  temporalRelationship: string;
}

export interface IOCAnalysis {
  ioc: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'cert';
  severity: number;
  confidence: number;
  sources: string[];
  relatedThreats: string[];
  detectionMethods: string[];
  lastSeen: Date;
  geolocation?: string;
  infrastructure?: string;
}

export interface AttributionConfidence {
  actor: string;
  confidence: number;
  evidence: string[];
  motive: string;
  capability: string;
}

export interface AnalyticsResult {
  timestamp: Date;
  dataPoints: number;
  patterns: ThreatPattern[];
  anomalies: AnomalyRecord[];
  riskScore: number;
  recommendations: string[];
}

export interface AnomalyRecord {
  id: string;
  type: string;
  severity: number;
  confidence: number;
  baseline: number;
  observed: number;
  timestamp: Date;
}
