// Advanced NLP Module - Deep Text Analysis
// Sentiment Analysis, Social Engineering Detection, Spear-Phishing Pattern Recognition

export interface TextAnalysisResult {
  textId: string;
  originalText: string;
  timestamp: Date;

  // Sentiment analysis
  sentiment: {
    score: number; // -1 to 1 (negative to positive)
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number; // 0-100
    emotions: {
      anger: number;
      fear: number;
      joy: number;
      sadness: number;
      surprise: number;
      disgust: number;
      trust: number;
      anticipation: number;
    };
  };

  // Language analysis
  language: {
    detectedLanguage: string;
    confidence: number;
    isEnglish: boolean;
  };

  // Text quality and characteristics
  characteristics: {
    tokenCount: number;
    wordCount: number;
    sentenceCount: number;
    averageWordLength: number;
    readabilityScore: number; // Flesch-Kincaid (0-100)
    entropyScore: number; // Text randomness (0-100)
  };

  // Threat detection
  threatAnalysis: {
    isSocialEngineering: boolean;
    socialEngineeringScore: number; // 0-100
    isPhishing: boolean;
    phishingScore: number; // 0-100
    isMalware: boolean;
    malwareScore: number; // 0-100
    threatFlags: string[];
  };

  // Linguistic patterns
  patterns: {
    urgencyLevel: number; // 0-100 (pressure/urgency indicators)
    authorityLevel: number; // 0-100 (authority impersonation)
    suspicionLevel: number; // 0-100 (suspicious language indicators)
    legitimacyScore: number; // 0-100 (appears legitimate)
  };

  // Named entities
  entities: {
    organizations: string[];
    people: string[];
    domains: string[];
    urls: string[];
    emailAddresses: string[];
    phoneNumbers: string[];
  };

  // Anomaly detection
  anomalyScore: number; // 0-100 (how different from normal text)
  langaugeAnomalies: string[];
}

export interface SocialEngineeringIndicator {
  indicatorId: string;
  type:
    | 'urgency'
    | 'authority'
    | 'scarcity'
    | 'fear_appeal'
    | 'greed_appeal'
    | 'consensus'
    | 'liking'
    | 'reciprocity';
  description: string;
  score: number; // 0-100
  examples: string[];
}

export interface SpearPhishingPattern {
  patternId: string;
  name: string;
  description: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectionRegex: RegExp[];
  keywords: string[];
}

export interface EmailAnalysis extends TextAnalysisResult {
  emailId: string;
  sender: string;
  senderDomain: string;
  recipient: string;
  subject: string;
  body: string;
  headers: Record<string, string>;

  // Email-specific analysis
  emailAnalysis: {
    isSPAMlike: boolean;
    spamScore: number; // 0-100
    isPhishing: boolean;
    phishingScore: number; // 0-100
    suspiciousLinks: string[];
    suspiciousAttachments: string[];
    spfPassed: boolean;
    dkimPassed: boolean;
    dmarcPassed: boolean;
  };

  // Personalization analysis
  personalization: {
    addressesRecipientByName: boolean;
    hasPersonalReferences: boolean;
    personalReferencesCount: number;
    personalReferencesScore: number; // 0-100
  };

  // Sender reputation
  senderReputation: {
    knownPhisher: boolean;
    domain Age: number; // days
    domainReputation: number; // 0-100
    isFreeemail: boolean;
  };
}

/**
 * Social Engineering Indicators Database
 */
const SOCIAL_ENGINEERING_INDICATORS: Record<string, SocialEngineeringIndicator> = {
  'urgency-1': {
    indicatorId: 'urgency-1',
    type: 'urgency',
    description: 'Time-limited offers or threats',
    score: 80,
    examples: [
      'act now',
      'limited time',
      'urgent',
      'immediately',
      'do not delay',
      'expires today',
      'hurry',
    ],
  },
  'authority-1': {
    indicatorId: 'authority-1',
    type: 'authority',
    description: 'Impersonation of authority figures',
    score: 90,
    examples: ['CEO', 'director', 'manager', 'administrator', 'official', 'compliance team'],
  },
  'scarcity-1': {
    indicatorId: 'scarcity-1',
    type: 'scarcity',
    description: 'Limited availability or exclusive offers',
    score: 70,
    examples: [
      'limited slots',
      'exclusive',
      'last chance',
      'only a few left',
      'exclusive offer',
      'rare opportunity',
    ],
  },
  'fear-1': {
    indicatorId: 'fear-1',
    type: 'fear_appeal',
    description: 'Fear-based appeals',
    score: 85,
    examples: [
      'account suspended',
      'unauthorized access',
      'urgent action required',
      'security alert',
      'verify your identity',
      'confirm your account',
    ],
  },
  'greed-1': {
    indicatorId: 'greed-1',
    type: 'greed_appeal',
    description: 'Greed-based appeals',
    score: 75,
    examples: ['free money', 'claim prize', 'reward', 'bonus', 'earn easy', 'no cost'],
  },
};

/**
 * Spear-Phishing Patterns Database
 */
const SPEAR_PHISHING_PATTERNS: SpearPhishingPattern[] = [
  {
    patternId: 'pattern-cred-harvest',
    name: 'Credential Harvesting',
    description: 'Requests to verify or confirm credentials',
    indicators: ['verify', 'confirm', 'validate', 'authenticate', 'login required'],
    severity: 'critical',
    detectionRegex: [/verify.*account/i, /confirm.*password/i, /validate.*credentials/i],
    keywords: ['verify', 'confirm', 'authenticate', 'password', 'credentials', 'login'],
  },
  {
    patternId: 'pattern-invoice-fraud',
    name: 'Invoice Fraud',
    description: 'Fake invoices requesting payment',
    indicators: ['invoice', 'payment due', 'billing', 'urgent payment'],
    severity: 'high',
    detectionRegex: [/invoice.*due/i, /payment.*required/i, /bill.*outstanding/i],
    keywords: ['invoice', 'payment', 'due', 'billing', 'receipt'],
  },
  {
    patternId: 'pattern-mfa-bypass',
    name: 'MFA Bypass Attempt',
    description: 'Attempts to bypass multi-factor authentication',
    indicators: ['2fa', 'verification code', 'confirm code', 'verification link'],
    severity: 'critical',
    detectionRegex: [/verification.*code/i, /confirm.*code/i, /mfa.*code/i],
    keywords: ['code', '2fa', 'verification', 'authenticator', 'totp'],
  },
  {
    patternId: 'pattern-ceo-fraud',
    name: 'CEO Fraud',
    description: 'Impersonation of company executive',
    indicators: ['urgent request', 'confidential', 'do not forward'],
    severity: 'critical',
    detectionRegex: [/urgent request/i, /confidential/i, /do not.*forward/i],
    keywords: ['ceo', 'urgent', 'confidential', 'executive'],
  },
  {
    patternId: 'pattern-account-compromise',
    name: 'Account Compromise',
    description: 'Claims account is compromised or locked',
    indicators: ['account locked', 'unusual activity', 'confirm identity', 'security alert'],
    severity: 'high',
    detectionRegex: [/account.*locked/i, /unusual.*activity/i, /confirm.*identity/i],
    keywords: ['locked', 'suspended', 'compromised', 'unusual activity', 'security'],
  },
];

/**
 * Advanced NLP Analyzer
 */
export class AdvancedNLPAnalyzer {
  private analysisCache: Map<string, TextAnalysisResult> = new Map();
  private emailAnalysisCache: Map<string, EmailAnalysis> = new Map();
  private detectedThreats: string[] = [];

  /**
   * Analyze text for threats and anomalies
   */
  analyzeText(text: string): TextAnalysisResult {
    const textId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Sentiment analysis
    const sentiment = this.performSentimentAnalysis(text);

    // Language detection
    const language = this.detectLanguage(text);

    // Text characteristics
    const characteristics = this.analyzeCharacteristics(text);

    // Named entity extraction
    const entities = this.extractEntities(text);

    // Threat analysis
    const threatAnalysis = this.analyzeThreats(text);

    // Linguistic patterns
    const patterns = this.analyzeLinguisticPatterns(text);

    // Anomaly detection
    const { anomalyScore, languageAnomalies } = this.detectLanguageAnomalies(text);

    const result: TextAnalysisResult = {
      textId,
      originalText: text,
      timestamp: new Date(),
      sentiment,
      language,
      characteristics,
      threatAnalysis,
      patterns,
      entities,
      anomalyScore,
      langaugeAnomalies: languageAnomalies,
    };

    this.analysisCache.set(textId, result);
    return result;
  }

  /**
   * Analyze email for phishing and social engineering
   */
  analyzeEmail(emailData: {
    sender: string;
    subject: string;
    body: string;
    headers: Record<string, string>;
    attachments?: string[];
  }): EmailAnalysis {
    const textAnalysis = this.analyzeText(`${emailData.subject} ${emailData.body}`);
    const emailId = `email-${Date.now()}`;

    const senderDomain = emailData.sender.split('@')[1] || '';

    // Email-specific threat analysis
    const emailAnalysis = {
      isSPAMlike: this.detectSPAM(emailData.subject, emailData.body),
      spamScore: this.calculateSPAMScore(emailData.subject, emailData.body),
      isPhishing: textAnalysis.threatAnalysis.isPhishing,
      phishingScore: textAnalysis.threatAnalysis.phishingScore,
      suspiciousLinks: this.extractSuspiciousLinks(emailData.body),
      suspiciousAttachments: emailData.attachments?.filter(att => this.isSuspiciousAttachment(att)) || [],
      spfPassed: this.verifySPF(emailData.headers),
      dkimPassed: this.verifyDKIM(emailData.headers),
      dmarcPassed: this.verifyDMARC(emailData.headers),
    };

    // Personalization analysis
    const personalization = {
      addressesRecipientByName: this.checkPersonalization(emailData.body),
      hasPersonalReferences: this.hasPersonalReferences(emailData.body),
      personalReferencesCount: this.countPersonalReferences(emailData.body),
      personalReferencesScore: this.calculatePersonalizationScore(emailData.body),
    };

    // Sender reputation
    const senderReputation = {
      knownPhisher: this.isKnownPhisher(emailData.sender),
      domain Age: this.estimateDomainAge(senderDomain),
      domainReputation: this.calculateDomainReputation(senderDomain),
      isFreeemail: this.isFreemailDomain(senderDomain),
    };

    const analysis: EmailAnalysis = {
      ...textAnalysis,
      emailId,
      sender: emailData.sender,
      senderDomain,
      recipient: '', // Would be extracted from headers
      subject: emailData.subject,
      body: emailData.body,
      headers: emailData.headers,
      emailAnalysis,
      personalization,
      senderReputation,
    };

    this.emailAnalysisCache.set(emailId, analysis);
    return analysis;
  }

  /**
   * Detect social engineering tactics
   */
  detectSocialEngineering(text: string): SocialEngineeringIndicator[] {
    const detectedIndicators: SocialEngineeringIndicator[] = [];
    const lowerText = text.toLowerCase();

    for (const indicator of Object.values(SOCIAL_ENGINEERING_INDICATORS)) {
      for (const example of indicator.examples) {
        if (lowerText.includes(example.toLowerCase())) {
          detectedIndicators.push(indicator);
          break;
        }
      }
    }

    return detectedIndicators;
  }

  /**
   * Detect spear-phishing patterns
   */
  detectSpearPhishingPatterns(text: string): SpearPhishingPattern[] {
    const detectedPatterns: SpearPhishingPattern[] = [];

    for (const pattern of SPEAR_PHISHING_PATTERNS) {
      for (const regex of pattern.detectionRegex) {
        if (regex.test(text)) {
          detectedPatterns.push(pattern);
          break;
        }
      }

      // Keyword matching
      for (const keyword of pattern.keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          if (!detectedPatterns.includes(pattern)) {
            detectedPatterns.push(pattern);
          }
          break;
        }
      }
    }

    return detectedPatterns;
  }

  /**
   * Private helper methods
   */

  private performSentimentAnalysis(text: string) {
    const words = text.toLowerCase().split(/\s+/);

    // Positive keywords
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'fantastic',
      'best',
      'awesome',
    ];
    // Negative keywords
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'worst',
      'disaster',
      'fail',
      'error',
      'problem',
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    const score = (positiveCount - negativeCount) / Math.max(words.length, 1);

    // Emotion analysis
    const emotions = this.analyzeEmotions(text);

    return {
      score: Math.max(-1, Math.min(1, score)),
      label: this.getSentimentLabel(score),
      confidence: Math.min(100, (Math.abs(positiveCount + negativeCount) / words.length) * 100),
      emotions,
    };
  }

  private analyzeEmotions(text: string): Record<string, number> {
    const lowerText = text.toLowerCase();

    const emotionKeywords = {
      anger: ['angry', 'furious', 'rage', 'attack'],
      fear: ['afraid', 'scared', 'danger', 'threat', 'attack'],
      joy: ['happy', 'joy', 'glad', 'wonderful'],
      sadness: ['sad', 'unhappy', 'depressed'],
      surprise: ['surprised', 'amazed', 'shocked'],
      disgust: ['disgusted', 'gross', 'awful'],
      trust: ['trust', 'believe', 'confident'],
      anticipation: ['expect', 'anticipate', 'look forward'],
    };

    const emotions: Record<string, number> = {};

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        count += (lowerText.match(regex) || []).length;
      }
      emotions[emotion] = Math.min(100, count * 20);
    }

    return emotions;
  }

  private getSentimentLabel(score: number): 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive' {
    if (score < -0.5) return 'very_negative';
    if (score < -0.1) return 'negative';
    if (score < 0.1) return 'neutral';
    if (score < 0.5) return 'positive';
    return 'very_positive';
  }

  private detectLanguage(text: string): { detectedLanguage: string; confidence: number; isEnglish: boolean } {
    // Simple heuristic for language detection
    const englishWords = /\b(the|a|an|is|are|was|were|be|been|being|have|has|do|does|did|will|would|should|could|may|might|must|can)\b/gi;
    const matches = (text.match(englishWords) || []).length;
    const confidence = Math.min(100, (matches / text.split(/\s+/).length) * 100);

    return {
      detectedLanguage: 'en',
      confidence,
      isEnglish: confidence > 30,
    };
  }

  private analyzeCharacteristics(text: string) {
    const tokens = text.split(/\s+/);
    const words = tokens.filter(t => /[a-z]/i.test(t));
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const totalWordLength = words.reduce((sum, w) => sum + w.length, 0);
    const avgWordLength = words.length > 0 ? totalWordLength / words.length : 0;

    // Flesch-Kincaid readability score (0-100, higher = easier)
    const syllableCount = this.countSyllables(text);
    const readabilityScore = Math.max(
      0,
      100 - (206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllableCount / words.length)) / 10
    );

    // Entropy score (0-100, higher = more random/compressed)
    const entropyScore = this.calculateEntropy(text);

    return {
      tokenCount: tokens.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordLength: avgWordLength,
      readabilityScore: Math.min(100, Math.max(0, readabilityScore)),
      entropyScore,
    };
  }

  private extractEntities(text: string) {
    const entities = {
      organizations: this.extractOrganizations(text),
      people: this.extractPeople(text),
      domains: this.extractDomains(text),
      urls: this.extractUrls(text),
      emailAddresses: this.extractEmails(text),
      phoneNumbers: this.extractPhoneNumbers(text),
    };

    return entities;
  }

  private extractOrganizations(text: string): string[] {
    const orgPattern = /\b([A-Z][a-z]+ )+(?:Corp|Inc|LLC|Ltd|Co|Corporation|Company)\b/g;
    return (text.match(orgPattern) || []).map(org => org.trim());
  }

  private extractPeople(text: string): string[] {
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    return (text.match(namePattern) || []).map(name => name.trim());
  }

  private extractDomains(text: string): string[] {
    const domainPattern = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/gi;
    return (text.match(domainPattern) || []).map(d => d.trim());
  }

  private extractUrls(text: string): string[] {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    return (text.match(urlPattern) || []).map(url => url.trim());
  }

  private extractEmails(text: string): string[] {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return (text.match(emailPattern) || []).map(email => email.trim());
  }

  private extractPhoneNumbers(text: string): string[] {
    const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    return (text.match(phonePattern) || []).map(phone => phone.trim());
  }

  private analyzeThreats(text: string) {
    const lowerText = text.toLowerCase();

    // Social engineering detection
    const seIndicators = this.detectSocialEngineering(text);
    const isSocialEngineering = seIndicators.length > 0;
    const socialEngineeringScore = seIndicators.reduce((sum, ind) => sum + ind.score, 0) / Math.max(seIndicators.length, 1);

    // Phishing detection
    const phishingPatterns = this.detectSpearPhishingPatterns(text);
    const isPhishing = phishingPatterns.length > 0;
    const phishingScore = phishingPatterns.reduce(
      (sum, pattern) => {
        switch (pattern.severity) {
          case 'critical':
            return sum + 95;
          case 'high':
            return sum + 75;
          case 'medium':
            return sum + 50;
          case 'low':
            return sum + 25;
        }
      },
      0
    ) / Math.max(phishingPatterns.length, 1);

    // Malware-related language detection
    const malwareIndicators = [
      'ransomware',
      'malware',
      'trojan',
      'virus',
      'worm',
      'botnet',
      'exploit',
      'zero day',
    ];
    const malwareCount = malwareIndicators.filter(indicator => lowerText.includes(indicator)).length;
    const isMalware = malwareCount > 0;
    const malwareScore = (malwareCount / malwareIndicators.length) * 100;

    const threatFlags: string[] = [];
    if (seIndicators.length > 0) threatFlags.push('social_engineering_detected');
    if (phishingPatterns.length > 0) threatFlags.push('phishing_patterns_detected');
    if (isMalware) threatFlags.push('malware_language_detected');
    if (this.extractUrls(text).length > 0) threatFlags.push('contains_urls');
    if (this.extractEmails(text).length > 0) threatFlags.push('contains_emails');

    return {
      isSocialEngineering,
      socialEngineeringScore: Math.round(socialEngineeringScore),
      isPhishing,
      phishingScore: Math.round(phishingScore),
      isMalware,
      malwareScore: Math.round(malwareScore),
      threatFlags,
    };
  }

  private analyzeLinguisticPatterns(text: string) {
    const lowerText = text.toLowerCase();

    // Urgency indicators
    const urgencyKeywords = [
      'urgent',
      'immediately',
      'asap',
      'hurry',
      'act now',
      'limited time',
      'do not delay',
      'expires',
      'deadline',
    ];
    const urgencyCount = urgencyKeywords.filter(kw => lowerText.includes(kw)).length;
    const urgencyLevel = Math.min(100, (urgencyCount / urgencyKeywords.length) * 100);

    // Authority indicators
    const authorityKeywords = [
      'must',
      'require',
      'authority',
      'administrator',
      'manager',
      'compliance',
      'law',
      'regulation',
      'official',
    ];
    const authorityCount = authorityKeywords.filter(kw => lowerText.includes(kw)).length;
    const authorityLevel = Math.min(100, (authorityCount / authorityKeywords.length) * 100);

    // Suspicion indicators
    const suspicionKeywords = [
      'verify',
      'confirm',
      'validate',
      'authenticate',
      'password',
      'credit card',
      'social security',
      'bank account',
    ];
    const suspicionCount = suspicionKeywords.filter(kw => lowerText.includes(kw)).length;
    const suspicionLevel = Math.min(100, (suspicionCount / suspicionKeywords.length) * 100);

    // Legitimacy score (inverse of threat indicators)
    const legitimacyScore = 100 - (urgencyLevel + authorityLevel + suspicionLevel) / 3;

    return {
      urgencyLevel: Math.round(urgencyLevel),
      authorityLevel: Math.round(authorityLevel),
      suspicionLevel: Math.round(suspicionLevel),
      legitimacyScore: Math.max(0, Math.round(legitimacyScore)),
    };
  }

  private detectLanguageAnomalies(text: string): { anomalyScore: number; languageAnomalies: string[] } {
    const anomalies: string[] = [];
    const words = text.split(/\s+/);

    // Check for excessive capitalization
    const capsWords = words.filter(w => /^[A-Z]+$/.test(w)).length;
    if (capsWords > words.length * 0.1) {
      anomalies.push('excessive_capitalization');
    }

    // Check for unusual character combinations
    const unusualChars = (text.match(/[^\w\s\.,!?'"()-]/g) || []).length;
    if (unusualChars > words.length * 0.05) {
      anomalies.push('unusual_characters');
    }

    // Check for excessive punctuation
    const punctuation = (text.match(/[.!?]/g) || []).length;
    if (punctuation > words.length * 0.15) {
      anomalies.push('excessive_punctuation');
    }

    // Check for non-ASCII characters
    const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
    if (nonAscii > text.length * 0.05) {
      anomalies.push('non_ascii_characters');
    }

    const anomalyScore = Math.min(100, anomalies.length * 25);

    return { anomalyScore, languageAnomalies: anomalies };
  }

  private countSyllables(text: string): number {
    const words = text.split(/\s+/);
    let syllableCount = 0;

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleanWord.length === 0) continue;

      // Simple syllable counting
      let count = 0;
      const vowels = cleanWord.match(/[aeiouy]/g) || [];
      count = vowels.length;

      // Adjust for common patterns
      if (cleanWord.endsWith('e')) count--;
      if (cleanWord.endsWith('le')) count++;

      syllableCount += Math.max(1, count);
    }

    return syllableCount;
  }

  private calculateEntropy(text: string): number {
    const frequencies: Record<string, number> = {};
    for (const char of text) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    const length = text.length;

    for (const freq of Object.values(frequencies)) {
      const p = freq / length;
      entropy -= p * Math.log2(p);
    }

    // Normalize to 0-100
    return Math.min(100, (entropy / 8) * 100);
  }

  private detectSPAM(subject: string, body: string): boolean {
    const spamKeywords = [
      'viagra',
      'cialis',
      'lottery',
      'win',
      'click here',
      'nigerian',
      'inheritance',
      'free money',
      'make money fast',
    ];
    const fullText = `${subject} ${body}`.toLowerCase();

    return spamKeywords.some(keyword => fullText.includes(keyword));
  }

  private calculateSPAMScore(subject: string, body: string): number {
    let score = 0;

    // All caps subject
    if (subject === subject.toUpperCase()) score += 20;

    // Multiple exclamation marks
    if ((subject.match(/!/g) || []).length > 2) score += 15;

    // Suspicious keywords
    const suspiciousKeywords = ['urgent', 'act now', 'limited offer', 'free', 'click here'];
    for (const keyword of suspiciousKeywords) {
      if (body.toLowerCase().includes(keyword)) score += 10;
    }

    return Math.min(100, score);
  }

  private extractSuspiciousLinks(body: string): string[] {
    const urls = this.extractUrls(body);
    const suspicious: string[] = [];

    for (const url of urls) {
      // Check for typosquatting
      if (url.includes('amaz0n') || url.includes('paypa1') || url.includes('goog1e')) {
        suspicious.push(url);
      }

      // Check for suspicious TLDs
      if (url.match(/\.(tk|ml|ga|cf)$/i)) {
        suspicious.push(url);
      }

      // Check for IP-based URLs
      if (url.match(/http:\/\/\d+\.\d+\.\d+\.\d+/)) {
        suspicious.push(url);
      }
    }

    return suspicious;
  }

  private isSuspiciousAttachment(attachment: string): boolean {
    const suspiciousExtensions = ['.exe', '.scr', '.pif', '.vbs', '.js', '.bat', '.cmd', '.com'];
    return suspiciousExtensions.some(ext => attachment.toLowerCase().endsWith(ext));
  }

  private verifySPF(headers: Record<string, string>): boolean {
    const spfHeader = headers['spf'] || headers['SPF'] || '';
    return spfHeader.includes('pass');
  }

  private verifyDKIM(headers: Record<string, string>): boolean {
    const dkimHeader = headers['dkim-signature'] || headers['DKIM-Signature'] || '';
    return dkimHeader.length > 0;
  }

  private verifyDMARC(headers: Record<string, string>): boolean {
    const dmarcHeader = headers['dmarc'] || headers['DMARC'] || '';
    return dmarcHeader.includes('pass');
  }

  private checkPersonalization(body: string): boolean {
    // Check if email uses generic greetings
    const genericGreetings = ['dear customer', 'dear user', 'dear valued customer'];
    return !genericGreetings.some(greeting => body.toLowerCase().includes(greeting));
  }

  private hasPersonalReferences(body: string): boolean {
    // Check for personal information references
    return /\b(your name|your account|your email|your address)\b/i.test(body);
  }

  private countPersonalReferences(body: string): number {
    const references = body.match(/\b(your|my|we|you|I)\b/gi) || [];
    return references.length;
  }

  private calculatePersonalizationScore(body: string): number {
    let score = 0;

    if (this.checkPersonalization(body)) score += 30;
    if (this.hasPersonalReferences(body)) score += 40;
    const refCount = this.countPersonalReferences(body);
    score += Math.min(30, refCount * 2);

    return Math.min(100, score);
  }

  private isKnownPhisher(sender: string): boolean {
    // In production, this would check against known phisher databases
    return false;
  }

  private estimateDomainAge(domain: string): number {
    // In production, this would check WHOIS data
    // For now, return a default value
    return Math.random() > 0.5 ? 365 * 5 : 30; // Either 5+ years or <1 month
  }

  private calculateDomainReputation(domain: string): number {
    // In production, this would use reputation APIs
    return Math.random() * 100;
  }

  private isFreemailDomain(domain: string): boolean {
    const freeMailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    return freeMailDomains.includes(domain.toLowerCase());
  }

  /**
   * Get analysis result
   */
  getAnalysis(textId: string): TextAnalysisResult | undefined {
    return this.analysisCache.get(textId);
  }

  /**
   * Get email analysis result
   */
  getEmailAnalysis(emailId: string): EmailAnalysis | undefined {
    return this.emailAnalysisCache.get(emailId);
  }

  /**
   * Get all analyses
   */
  getAllAnalyses(): TextAnalysisResult[] {
    return Array.from(this.analysisCache.values());
  }

  /**
   * Get all email analyses
   */
  getAllEmailAnalyses(): EmailAnalysis[] {
    return Array.from(this.emailAnalysisCache.values());
  }
}

export const advancedNLPAnalyzer = new AdvancedNLPAnalyzer();
