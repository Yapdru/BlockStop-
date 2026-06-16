// Threat Classifier - Multi-class threat classification

import { IOC } from './types';
import { cacheManager } from './cache-manager';

export interface ClassificationResult {
  ioc: IOC;
  primaryClass: string;
  secondaryClasses: Array<{ class: string; confidence: number }>;
  confidence: number;
  reasoning: string;
}

export class ThreatClassifier {
  private classDefinitions: Map<string, ClassifierRule> = new Map();

  constructor() {
    this.initializeClassifiers();
  }

  private initializeClassifiers(): void {
    // Malware classifier
    this.classDefinitions.set('malware', {
      keywords: ['malware', 'trojan', 'virus', 'worm', 'backdoor', 'rootkit'],
      patterns: [/exe|dll|bin|app/i],
      minConfidence: 60,
    });

    // Phishing classifier
    this.classDefinitions.set('phishing', {
      keywords: ['phishing', 'phish', 'credential', 'harvest', 'spoof'],
      patterns: [/^https?:\/\/.*\.(php|aspx|jsp)$/i],
      minConfidence: 70,
    });

    // C2/Command & Control
    this.classDefinitions.set('c2', {
      keywords: ['c2', 'command', 'control', 'callback', 'beacon'],
      patterns: [/:(443|8080|8443|4444|5555)\/?$/],
      minConfidence: 75,
    });

    // Ransomware
    this.classDefinitions.set('ransomware', {
      keywords: ['ransomware', 'encrypt', 'ransom', 'bitcoin'],
      patterns: [/lockbit|darkside|conti|revil/i],
      minConfidence: 80,
    });

    // APT/Advanced Persistent Threat
    this.classDefinitions.set('apt', {
      keywords: ['apt', 'advanced persistent', 'nation-state', 'apo'],
      patterns: [/lazarus|apt28|cozy|energetic|fancy/i],
      minConfidence: 75,
    });

    // Data exfiltration
    this.classDefinitions.set('data-exfiltration', {
      keywords: ['exfiltrate', 'data theft', 'steal', 'extract'],
      patterns: [/(ftp|sftp|ssh|http):\/\//i],
      minConfidence: 65,
    });

    // Exploit/Vulnerability
    this.classDefinitions.set('exploit', {
      keywords: ['cve', 'exploit', 'vulnerability', '0day', 'zero-day'],
      patterns: [/cve-\d{4}-\d{4,}/i],
      minConfidence: 80,
    });

    // Botnet
    this.classDefinitions.set('botnet', {
      keywords: ['botnet', 'bot', 'zombie', 'drone'],
      patterns: [/bot|mirai|dyn|krypt/i],
      minConfidence: 70,
    });
  }

  async classify(ioc: IOC): Promise<ClassificationResult> {
    const cacheKey = `classify:${ioc.id}`;
    const cached = cacheManager.get<ClassificationResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const scores: Array<{ class: string; score: number }> = [];

    // Score against each classifier
    for (const [className, rule] of this.classDefinitions.entries()) {
      const score = this.scoreAgainstRule(ioc, rule);
      if (score > 0) {
        scores.push({ class: className, score });
      }
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    let primaryClass = 'unknown';
    let confidence = 0;
    const secondaryClasses: Array<{ class: string; confidence: number }> = [];

    if (scores.length > 0) {
      primaryClass = scores[0].class;
      confidence = Math.min(scores[0].score, 100);

      for (let i = 1; i < Math.min(3, scores.length); i++) {
        secondaryClasses.push({
          class: scores[i].class,
          confidence: Math.min(scores[i].score, 100),
        });
      }
    }

    const result: ClassificationResult = {
      ioc,
      primaryClass,
      secondaryClasses,
      confidence: Math.round(confidence),
      reasoning: this.generateReasoning(ioc, primaryClass, scores),
    };

    cacheManager.set(cacheKey, result, 1800000); // 30 minutes cache

    return result;
  }

  async batchClassify(iocs: IOC[]): Promise<ClassificationResult[]> {
    return Promise.all(iocs.map((ioc) => this.classify(ioc)));
  }

  private scoreAgainstRule(ioc: IOC, rule: ClassifierRule): number {
    let score = 0;

    // Score tags
    const matchingTags = ioc.tags.filter((tag) =>
      rule.keywords.some((kw) => tag.toLowerCase().includes(kw))
    );
    score += matchingTags.length * 15;

    // Score IOC value against patterns
    for (const pattern of rule.patterns) {
      if (pattern.test(ioc.value)) {
        score += 20;
      }
    }

    // Consider confidence
    if (ioc.confidence >= rule.minConfidence) {
      score += 10;
    }

    return score;
  }

  private generateReasoning(ioc: IOC, primaryClass: string, scores: Array<{ class: string; score: number }>): string {
    const reasons: string[] = [];

    // Add tag-based reasoning
    const matchingTags = ioc.tags.filter((tag) => {
      const rule = this.classDefinitions.get(primaryClass);
      return rule && rule.keywords.some((kw) => tag.toLowerCase().includes(kw));
    });

    if (matchingTags.length > 0) {
      reasons.push(`Tags: ${matchingTags.join(', ')}`);
    }

    // Add source-based reasoning
    reasons.push(`Source: ${ioc.source}`);

    // Add confidence reasoning
    if (ioc.confidence > 80) {
      reasons.push('High confidence indicator');
    }

    // Add alternative classes
    if (scores.length > 1) {
      const alternatives = scores.slice(1, 3).map((s) => `${s.class} (${Math.round(s.score)}%)`);
      reasons.push(`Also matches: ${alternatives.join(', ')}`);
    }

    return reasons.join(' | ');
  }
}

interface ClassifierRule {
  keywords: string[];
  patterns: RegExp[];
  minConfidence: number;
}

export const threatClassifier = new ThreatClassifier();
