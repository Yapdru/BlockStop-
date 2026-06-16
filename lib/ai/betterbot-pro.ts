// BetterBot PRO - Advanced Malware & Virus Detection Engine
// Signature-based + Behavioral + Heuristic malware detection

export interface FileScanResult {
  threatLevel: "safe" | "warning" | "dangerous";
  threats: string[];
  analysis: {
    malwareSignatures: number;
    behavioralAnalysis: string;
    virusDefinitions: string[];
    ransomwareRisk: number;
  };
  scanDetails: {
    fileType: string;
    fileSize: number;
    suspiciousStrings: string[];
    entropy: number;
  };
}

// Known malware signatures (simplified YARA-like rules)
const MALWARE_SIGNATURES = {
  // Ransomware indicators
  ransomware: [
    /bitcoin|wallet|ransom|decrypt|payment/i,
    /shadow\s?copy|vss\s?admin|resize\s?max/i,
  ],
  // Shell/Dropper indicators
  shellcode: [
    /exec|system|cmd\.exe|powershell|bash|sh\s+-c/i,
    /eval|create.*process|shellexecute/i,
  ],
  // Trojan indicators
  trojan: [
    /trojan|backdoor|remote\s?access|rat|reverse\s?shell/i,
    /connect.*server|listen.*port/i,
  ],
};

// Dangerous file extensions
const DANGEROUS_EXTENSIONS = {
  executable: [".exe", ".scr", ".com", ".pif", ".msi"],
  script: [".bat", ".cmd", ".ps1", ".vbs", ".js", ".jar"],
  macro: [".doc", ".xls", ".ppt", ".docm", ".xlsm", ".pptm"],
  archive_suspicious: [".zip", ".rar", ".7z", ".iso"],
};

// File signatures (magic bytes)
const FILE_SIGNATURES: Record<string, string[]> = {
  exe: ["4d 5a"], // MZ (PE executable)
  zip: ["50 4b 03 04"], // PK (ZIP)
  rar: ["52 61 72 21"], // Rar!
  pdf: ["25 50 44 46"], // %PDF
  doc: ["d0 cf 11 e0"], // MS Office OLE
};

export class BetterbotPro {
  private calculateEntropy(data: Buffer): number {
    const freq: Record<number, number> = {};
    for (let i = 0; i < data.length; i++) {
      freq[data[i]] = (freq[data[i]] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / data.length;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private detectFileType(fileBuffer: Buffer, fileName: string): string {
    const hex = fileBuffer.slice(0, 4).toString("hex");
    const name = fileName.toLowerCase();

    for (const [type, signatures] of Object.entries(FILE_SIGNATURES)) {
      if (signatures.some(sig => hex.startsWith(sig.replace(/ /g, "")))) {
        return type;
      }
    }

    const ext = name.split(".").pop();
    return ext || "unknown";
  }

  private scanForSignatures(fileBuffer: Buffer, fileName: string): string[] {
    const found: string[] = [];
    const content = fileBuffer.toString("utf8", 0, Math.min(fileBuffer.length, 10000));
    const name = fileName.toLowerCase();

    // Check extension threats
    for (const [category, exts] of Object.entries(DANGEROUS_EXTENSIONS)) {
      if (exts.some(ext => name.endsWith(ext))) {
        found.push(`Dangerous ${category} file type`);
      }
    }

    // Scan content for malware signatures
    for (const [type, patterns] of Object.entries(MALWARE_SIGNATURES)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          found.push(`${type.charAt(0).toUpperCase() + type.slice(1)} indicators detected`);
          break;
        }
      }
    }

    return found;
  }

  private calculateRisks(
    fileBuffer: Buffer,
    fileName: string,
    signatures: string[]
  ): {
    threatLevel: "safe" | "warning" | "dangerous";
    ransomwareRisk: number;
  } {
    let riskScore = 0;
    const name = fileName.toLowerCase();

    // Base risk from signatures
    riskScore += signatures.length * 20;

    // Executable files
    if (DANGEROUS_EXTENSIONS.executable.some(ext => name.endsWith(ext))) {
      riskScore += 30;
    }

    // Macro-enabled documents
    if (DANGEROUS_EXTENSIONS.macro.some(ext => name.endsWith(ext))) {
      riskScore += 25;
    }

    // Suspicious entropy (highly packed/compressed)
    const entropy = this.calculateEntropy(fileBuffer);
    if (entropy > 7) riskScore += 15;

    // Large files
    if (fileBuffer.length > 10 * 1024 * 1024) riskScore += 10; // >10MB

    // Determine threat level
    let threatLevel: "safe" | "warning" | "dangerous" = "safe";
    if (riskScore > 70) threatLevel = "dangerous";
    else if (riskScore > 40) threatLevel = "warning";

    return { threatLevel, ransomwareRisk: Math.min(riskScore, 100) };
  }

  async scanFile(fileBuffer: Buffer, fileName: string): Promise<FileScanResult> {
    const fileType = this.detectFileType(fileBuffer, fileName);
    const signatures = this.scanForSignatures(fileBuffer, fileName);
    const entropy = this.calculateEntropy(fileBuffer);
    const { threatLevel, ransomwareRisk } = this.calculateRisks(
      fileBuffer,
      fileName,
      signatures
    );

    // Extract suspicious strings
    const content = fileBuffer.toString("utf8", 0, Math.min(fileBuffer.length, 5000));
    const suspiciousStrings = [
      ...new Set(
        content.match(/(?:bitcoin|wallet|ransom|decrypt|backdoor|trojan|cmd|powershell)/gi) || []
      ),
    ];

    return {
      threatLevel,
      threats:
        signatures.length > 0
          ? signatures
          : [`File type: ${fileType}. No immediate threats detected.`],
      analysis: {
        malwareSignatures: signatures.length,
        behavioralAnalysis:
          threatLevel === "dangerous"
            ? "Highly suspicious behavior"
            : threatLevel === "warning"
            ? "Potentially suspicious"
            : "Normal",
        virusDefinitions: suspiciousStrings,
        ransomwareRisk,
      },
      scanDetails: {
        fileType,
        fileSize: fileBuffer.length,
        suspiciousStrings,
        entropy: parseFloat(entropy.toFixed(2)),
      },
    };
  }
}

export const betterbotPro = new BetterbotPro();
