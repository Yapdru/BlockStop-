export interface DashboardStats {
  totalScans: number;
  emailScans: number;
  fileScans: number;
  threatsDetected: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  lastScanAt?: Date;
}

export interface ThreatStatistic {
  type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RecentThreat {
  id: number;
  type: 'email' | 'file';
  threatName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  status: 'quarantined' | 'removed' | 'pending';
  itemName?: string;
}

export interface ScanHistoryItem {
  id: number;
  type: 'email' | 'file';
  itemName: string;
  riskScore?: number;
  threatLevel?: string;
  threats: string[];
  createdAt: Date;
  status: 'safe' | 'warning' | 'dangerous';
}

export interface DashboardActivityLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentThreats: RecentThreat[];
  threatStatistics: ThreatStatistic[];
  scanHistory: ScanHistoryItem[];
}
