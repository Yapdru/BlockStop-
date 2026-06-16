export interface ScanResult {
  id: string;
  riskScore: number;
  threatLevel: "safe" | "warning" | "dangerous";
  threats: string[];
  timestamp: string;
  userId?: string;
}

export interface EmailScanResult extends ScanResult {
  email: string;
  phishingRisk: number;
  spamScore: number;
  maliciousLinks: number;
}

export interface FileScanResult extends ScanResult {
  fileName: string;
  fileSize: number;
  fileHash: string;
  malwareSignatures: number;
  ransomwareRisk: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanHistory {
  id: string;
  userId: string;
  scanType: "email" | "file";
  result: ScanResult;
  createdAt: Date;
}
