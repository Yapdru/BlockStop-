export interface EmailCheckRequest {
  email: string;
}

export interface EmailCheckResponse {
  riskScore: number;
  threats: string[];
  timestamp: string;
  details?: {
    phishingRisk: number;
    maliciousLinks: number;
    spamScore: number;
    senderReputation: string;
  };
}

export interface EmailScanHistory {
  id: string;
  email: string;
  riskScore: number;
  threats: string[];
  scannedAt: Date;
  userId: string;
}
