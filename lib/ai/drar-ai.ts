// DRAR AI - Distributed Risk Analysis and Reputation System
// Real heuristic-based email security analysis engine

export interface EmailAnalysisResult {
  riskScore: number;
  threats: string[];
  analysis: {
    phishingRisk: number;
    maliciousLinks: number;
    spamScore: number;
    senderReputation: string;
  };
  detailedReport: {
    urlAnalysis: string[];
    headerAnalysis: string[];
    contentAnalysis: string[];
  };
}

const PHISHING_KEYWORDS = [
  "verify account", "confirm identity", "click here", "update password",
  "unusual activity", "verify payment", "suspended", "limited access",
  "act now", "urgent action", "click link", "validate", "re-authenticate"
];

const URGENCY_KEYWORDS = [
  "urgent", "immediately", "asap", "act now", "confirm", "verify",
  "expire", "expires", "expired", "limited time", "hurry"
];

const MALICIOUS_DOMAINS = [
  "bit.ly", "tinyurl", "goo.gl", "short.link" // Common URL shorteners
];

const SUSPICIOUS_PATTERNS = [
  /\b[a-zA-Z0-9._%+-]+@[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g, // IP-based email
  /https?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/g, // IP-based URLs
];

export class DrarAI {
  private calculatePhishingRisk(emailContent: string): number {
    let risk = 0;
    const lowerContent = emailContent.toLowerCase();

    // Check for phishing keywords
    PHISHING_KEYWORDS.forEach(keyword => {
      if (lowerContent.includes(keyword)) risk += 15;
    });

    // Check for urgency tactics
    URGENCY_KEYWORDS.forEach(keyword => {
      if (lowerContent.includes(keyword)) risk += 10;
    });

    // Check for suspicious patterns
    SUSPICIOUS_PATTERNS.forEach(pattern => {
      if (pattern.test(emailContent)) risk += 20;
    });

    return Math.min(risk, 100);
  }

  private calculateSpamScore(emailContent: string): number {
    let score = 0;
    const lowerContent = emailContent.toLowerCase();
    const wordCount = emailContent.split(/\s+/).length;

    // ALL CAPS ratio
    const capsCount = (emailContent.match(/[A-Z]/g) || []).length;
    if (capsCount / emailContent.length > 0.3) score += 20;

    // Excessive punctuation
    const punctCount = (emailContent.match(/[!]{2,}/g) || []).length;
    if (punctCount > 3) score += 15;

    // Common spam words
    const spamWords = ["free", "cash", "click", "limited offer", "exclusive"];
    spamWords.forEach(word => {
      if (lowerContent.includes(word)) score += 10;
    });

    // Suspicious character encoding
    if (emailContent.includes("&#")) score += 25;

    return Math.min(score, 100);
  }

  private analyzeMaliciousLinks(emailContent: string): number {
    let count = 0;
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const urls = emailContent.match(urlRegex) || [];

    urls.forEach(url => {
      // Check for shortened URLs
      MALICIOUS_DOMAINS.forEach(domain => {
        if (url.includes(domain)) count++;
      });

      // Check for mismatched display vs actual URL
      if (url.includes("%") || url.includes("@")) count++;
    });

    return Math.min(count, 10);
  }

  private analyzeSenderReputation(senderEmail: string): string {
    if (!senderEmail) return "unknown";

    const lowerSender = senderEmail.toLowerCase();

    // Red flags in sender
    if (senderEmail.includes(".tk") || senderEmail.includes(".ml")) {
      return "suspicious"; // Suspicious TLDs
    }
    if (senderEmail.match(/[0-9]{5,}/)) {
      return "suspicious"; // Too many numbers
    }
    if (senderEmail.includes("noreply") || senderEmail.includes("no-reply")) {
      return "automated"; // Automated sender
    }

    return "unknown";
  }

  async analyzeEmail(emailContent: string): Promise<EmailAnalysisResult> {
    const phishingRisk = this.calculatePhishingRisk(emailContent);
    const spamScore = this.calculateSpamScore(emailContent);
    const maliciousLinks = this.analyzeMaliciousLinks(emailContent);

    // Extract sender email (basic parsing)
    const senderMatch = emailContent.match(/From:\s*(.+)/i);
    const senderEmail = senderMatch ? senderMatch[1] : "";
    const senderReputation = this.analyzeSenderReputation(senderEmail);

    // Calculate overall risk
    const riskScore = Math.round((phishingRisk * 0.5 + spamScore * 0.3 + maliciousLinks * 2) / 3);

    const threats: string[] = [];
    const urlAnalysis: string[] = [];
    const headerAnalysis: string[] = [];
    const contentAnalysis: string[] = [];

    // Determine threats
    if (phishingRisk > 50) {
      threats.push("High phishing risk detected");
      contentAnalysis.push("Suspicious phishing-like content patterns");
    }
    if (spamScore > 60) {
      threats.push("Likely spam/scam email");
      contentAnalysis.push("Email exhibits characteristics of spam/scam");
    }
    if (maliciousLinks > 3) {
      threats.push("Multiple suspicious links detected");
      urlAnalysis.push(`Found ${maliciousLinks} potentially malicious links`);
    }
    if (senderReputation === "suspicious") {
      threats.push("Suspicious sender reputation");
      headerAnalysis.push("Sender email exhibits red flags");
    }

    return {
      riskScore: Math.min(riskScore, 100),
      threats: threats.length > 0 ? threats : ["No immediate threats detected"],
      analysis: {
        phishingRisk,
        maliciousLinks,
        spamScore,
        senderReputation,
      },
      detailedReport: {
        urlAnalysis,
        headerAnalysis,
        contentAnalysis,
      },
    };
  }
}

export const drarAI = new DrarAI();
