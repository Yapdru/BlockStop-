import { getDb } from '@/lib/db';

export interface HuntingRule {
  id: string;
  name: string;
  description: string;
  query: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface HuntingResult {
  ruleId: string;
  ruleName: string;
  matchCount: number;
  detailedMatches: any[];
  severity: string;
  timestamp: Date;
}

export class AutonomousThreatHunter {
  private rules: Map<string, HuntingRule> = new Map();

  constructor() {
    this.initializeHuntingRules();
  }

  private initializeHuntingRules(): void {
    // Credential harvesting rule
    this.rules.set('cred_harvest', {
      id: 'cred_harvest',
      name: 'Credential Harvesting',
      description: 'Detect email phishing attempts harvesting credentials',
      query: `email_content ILIKE '%password%' OR email_content ILIKE '%verify account%'`,
      enabled: true,
      severity: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Lateral movement rule
    this.rules.set('lateral_move', {
      id: 'lateral_move',
      name: 'Lateral Movement',
      description: 'Detect signs of lateral movement in network',
      query: `failed_logins > 10 AND timeframe = '1hour'`,
      enabled: true,
      severity: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Data exfiltration rule
    this.rules.set('data_exfil', {
      id: 'data_exfil',
      name: 'Data Exfiltration',
      description: 'Detect unusual data transfer patterns',
      query: `outbound_traffic > threshold AND destination_reputation = 'unknown'`,
      enabled: true,
      severity: 'critical',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Persistence mechanism rule
    this.rules.set('persistence', {
      id: 'persistence',
      name: 'Persistence Mechanisms',
      description: 'Detect attempts to establish persistence',
      query: `registry_modification OR scheduled_task_creation OR startup_folder_access`,
      enabled: true,
      severity: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Privilege escalation rule
    this.rules.set('priv_esc', {
      id: 'priv_esc',
      name: 'Privilege Escalation',
      description: 'Detect privilege escalation attempts',
      query: `sudo_usage OR admin_token_request OR privilege_change`,
      enabled: true,
      severity: 'high',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Anomalous file access rule
    this.rules.set('file_access', {
      id: 'file_access',
      name: 'Anomalous File Access',
      description: 'Detect unusual file access patterns',
      query: `file_access_rate > 100/min AND file_types LIKE '%sensitive%'`,
      enabled: true,
      severity: 'medium',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Process injection rule
    this.rules.set('proc_inject', {
      id: 'proc_inject',
      name: 'Process Injection',
      description: 'Detect process injection attacks',
      query: `remote_process_creation OR dll_injection OR code_cave_detection`,
      enabled: true,
      severity: 'critical',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // C2 communication rule
    this.rules.set('c2_comm', {
      id: 'c2_comm',
      name: 'C2 Communication',
      description: 'Detect command and control communication',
      query: `dns_queries TO suspicious_domains OR beaconing_pattern`,
      enabled: true,
      severity: 'critical',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async huntThreats(
    userId: string,
    scope: 'user' | 'team' | 'organization' = 'user'
  ): Promise<HuntingResult[]> {
    const db = getDb();
    const results: HuntingResult[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        // In production, execute actual SQL queries or search across data sources
        // For MVP, simulate results based on rule type

        const huntingResult = await this.executeHuntingRule(userId, rule, db);
        if (huntingResult.matchCount > 0) {
          results.push(huntingResult);
        }
      } catch (error) {
        console.error(`Error executing hunting rule ${rule.id}:`, error);
      }
    }

    return results.sort((a, b) => {
      const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityMap[b.severity as any] - severityMap[a.severity as any];
    });
  }

  private async executeHuntingRule(
    userId: string,
    rule: HuntingRule,
    db: any
  ): Promise<HuntingResult> {
    // Simulate threat hunting based on rule type
    let matchCount = 0;
    const detailedMatches: any[] = [];

    if (rule.id === 'cred_harvest') {
      // Check for phishing emails in user's recent scans
      matchCount = Math.floor(Math.random() * 5);
    } else if (rule.id === 'lateral_move') {
      // Check for failed login patterns
      matchCount = Math.floor(Math.random() * 3);
    } else if (rule.id === 'data_exfil') {
      // Check for unusual data transfers
      matchCount = Math.floor(Math.random() * 2);
    } else if (rule.id === 'persistence') {
      // Check for persistence mechanisms
      matchCount = Math.floor(Math.random() * 1);
    }

    for (let i = 0; i < matchCount; i++) {
      detailedMatches.push({
        id: `match_${i}`,
        evidence: `Evidence of ${rule.name}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        confidence: 0.7 + Math.random() * 0.3
      });
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matchCount,
      detailedMatches,
      severity: rule.severity,
      timestamp: new Date()
    };
  }

  async createCustomRule(
    name: string,
    description: string,
    query: string,
    severity: string
  ): Promise<HuntingRule> {
    const ruleId = `rule_${Date.now()}`;
    const rule: HuntingRule = {
      id: ruleId,
      name,
      description,
      query,
      enabled: true,
      severity: severity as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(ruleId, rule);
    return rule;
  }

  async updateRule(ruleId: string, updates: Partial<HuntingRule>): Promise<HuntingRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new Error('Rule not found');

    const updated = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(ruleId, updated);
    return updated;
  }

  async deleteRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
  }

  getRules(): HuntingRule[] {
    return Array.from(this.rules.values());
  }

  getRuleById(ruleId: string): HuntingRule | undefined {
    return this.rules.get(ruleId);
  }

  async scheduleHuntingCycle(
    userId: string,
    intervalMinutes: number = 60
  ): Promise<{ scheduledAt: Date; nextRun: Date }> {
    const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);
    return {
      scheduledAt: new Date(),
      nextRun
    };
  }
}

export const createThreatHunter = (): AutonomousThreatHunter => {
  return new AutonomousThreatHunter();
};
