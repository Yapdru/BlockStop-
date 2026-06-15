export interface FileScanRequest {
  file: File;
}

export interface FileScanResponse {
  fileName: string;
  fileType: string;
  fileSize: string;
  threatLevel: "safe" | "warning" | "dangerous";
  threats: string[];
  scanTimestamp: string;
  details?: {
    malwareSignatures: number;
    behavioralAnalysis: string;
    virusDefinitions: string[];
    ransomwareRisk: number;
  };
}

export interface FileScanHistory {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  threatLevel: "safe" | "warning" | "dangerous";
  scannedAt: Date;
  userId: string;
}
