// Analytics & Threat Intelligence Types
export interface ThreatTrend {
  date: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
}

export interface ThreatTrendMetrics {
  timestamp: Date;
  threatType: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface ThreatTypeAnalysis {
  threatType: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastDetected: Date;
}

export interface GeographicThreat {
  country: string;
  countryCode: string;
  threatCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  cities: Array<{
    name: string;
    threatCount: number;
  }>;
}

export interface ConfidenceScoreMetric {
  threatId: string;
  confidenceScore: number;
  factors: Array<{
    name: string;
    weight: number;
    value: number;
  }>;
  timestamp: Date;
}

export interface AnalyticsDashboardData {
  threatTrends: ThreatTrend[];
  topThreats: ThreatTypeAnalysis[];
  geographicThreats: GeographicThreat[];
  confidenceScores: ConfidenceScoreMetric[];
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TimeSeriesData {
  timestamp: Date;
  threatCount: number;
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topThreatType: string;
  averageConfidence: number;
}

export interface FilterCriteria {
  startDate?: Date;
  endDate?: Date;
  threatTypes?: string[];
  severities?: ('low' | 'medium' | 'high' | 'critical')[];
  countries?: string[];
  confidenceThreshold?: number;
}

export interface AnalyticsTrendsResponse {
  data: TimeSeriesData[];
  summary: {
    totalThreats: number;
    averageSeverity: string;
    topThreats: string[];
    timeRange: {
      startDate: Date;
      endDate: Date;
    };
  };
  filters: FilterCriteria;
}

export interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  rules: ThreatRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface ThreatRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'pattern' | 'heuristic' | 'signature' | 'behavioral';
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  priority: number;
  conditions?: Record<string, any>;
}

export interface ThreatFeedTemplate {
  id: string;
  name: string;
  description: string;
  category: 'malware' | 'phishing' | 'ransomware' | 'suspicious' | 'custom';
  rules: ThreatRule[];
  previewData?: TimeSeriesData[];
}

export interface ThreatPrediction {
  threatType: string;
  probability: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
}

export interface RiskForecast {
  period: '7day' | '30day';
  riskScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  predictedThreats: ThreatPrediction[];
  recommendations: string[];
  confidence: number;
}

export interface AttackVectorRecommendation {
  vector: string;
  likelihood: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  priority: number;
}

export interface PredictionResponse {
  nextThreatType: ThreatPrediction;
  riskForecasts: {
    sevenDay: RiskForecast;
    thirtyDay: RiskForecast;
  };
  attackVectorRecommendations: AttackVectorRecommendation[];
  timestamp: Date;
}
