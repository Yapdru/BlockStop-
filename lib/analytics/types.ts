export interface UserBehaviorProfile {
  userId: string;
  loginPatterns: LoginEvent[];
  accessedAssets: string[];
  dataAccessPatterns: AccessPattern[];
  riskScore: number;
  lastAnalyzed: Date;
  anomalies: BehaviorAnomaly[];
}

export interface LoginEvent {
  timestamp: Date;
  ipAddress: string;
  location: string;
  deviceId: string;
  success: boolean;
}

export interface AccessPattern {
  assetId: string;
  accessCount: number;
  lastAccessed: Date;
  accessTimes: Date[];
  dataTransferred: number;
}

export interface BehaviorAnomaly {
  id: string;
  type: 'unusual-time' | 'unusual-location' | 'unusual-volume' | 'unusual-asset';
  severity: number;
  confidence: number;
  timestamp: Date;
}

export interface OrganizationRiskAssessment {
  organizationId: string;
  riskScore: number;
  riskFactors: RiskFactor[];
  complianceStatus: string;
  lastAssessment: Date;
  recommendations: string[];
}

export interface RiskFactor {
  category: string;
  value: number;
  impact: number;
  mitigation: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  framework: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
  lastAudited: Date;
  riskScore: number;
}

export interface SecurityPostureScore {
  organizationId: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  trend: number;
  recommendations: string[];
  updatedAt: Date;
}

export interface InsiderThreatIndicator {
  userId: string;
  type: 'data-exfiltration' | 'privilege-abuse' | 'sabotage' | 'espionage';
  severity: number;
  confidence: number;
  indicators: string[];
  timestamp: Date;
}

export interface VulnerabilityMetrics {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  exploitableCount: number;
  riskScore: number;
}

export interface AssetRiskProfile {
  assetId: string;
  assetType: string;
  riskScore: number;
  vulnerabilities: VulnerabilityInfo[];
  exposureLevel: 'critical' | 'high' | 'medium' | 'low';
  lastAssessed: Date;
  owner: string;
}

export interface VulnerabilityInfo {
  cvss: number;
  exploitable: boolean;
  mitigation: string;
  discoveredDate: Date;
}

export interface ThirdPartyRisk {
  vendorId: string;
  vendorName: string;
  riskScore: number;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  lastRiskAssessment: Date;
  complianceStatus: string;
  incidentHistory: number;
}

export interface AnalyticsMetrics {
  timestamp: Date;
  dataPointsAnalyzed: number;
  anomaliesDetected: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}
