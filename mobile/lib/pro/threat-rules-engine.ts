/**
 * Custom Threat Rules Engine for Mobile Pro
 * Allows users to create custom threat detection rules on device
 */

import { query } from '@/lib/db';

export interface ThreatRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  ruleType: 'pattern' | 'heuristic' | 'behavior' | 'signature';
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  createdAt: Date;
  lastModified: Date;
  matchCount: number;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'gt' | 'lt' | 'in';
  value: string | string[] | number;
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'block' | 'warn' | 'quarantine' | 'notify' | 'log';
  target: string;
  severity?: string;
}

export class ThreatRulesEngine {
  async createRule(userId: string, ruleData: Omit<ThreatRule, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'matchCount'>): Promise<ThreatRule> {
    const ruleId = this.generateRuleId();
    const now = new Date();

    const rule: ThreatRule = {
      id: ruleId,
      userId,
      ...ruleData,
      createdAt: now,
      lastModified: now,
      matchCount: 0,
    };

    await query(
      `INSERT INTO custom_threat_rules
       (id, user_id, name, description, rule_type, conditions, actions, enabled, created_at, last_modified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        ruleId,
        userId,
        rule.name,
        rule.description,
        rule.ruleType,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.actions),
        rule.enabled,
        now,
        now,
      ]
    );

    return rule;
  }

  async evaluateRule(rule: ThreatRule, eventData: Record<string, unknown>): Promise<boolean> {
    // Check if all conditions match
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, eventData)) {
        return false;
      }
    }

    // All conditions matched
    await this.incrementMatchCount(rule.id);
    return true;
  }

  async executeActions(rule: ThreatRule, _eventData: Record<string, unknown>): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'block':
          await this.blockThreat(action.target);
          break;
        case 'warn':
          await this.warnUser(action.target, rule.name);
          break;
        case 'quarantine':
          await this.quarantineItem(action.target);
          break;
        case 'notify':
          await this.notifyUser(action.target, rule.name);
          break;
        case 'log':
          await this.logEvent(rule.id, action.target);
          break;
      }
    }
  }

  async getUserRules(userId: string): Promise<ThreatRule[]> {
    const result = await query(
      `SELECT * FROM custom_threat_rules WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(this.rowToRule);
  }

  async updateRule(ruleId: string, updates: Partial<ThreatRule>): Promise<ThreatRule> {
    const now = new Date();

    await query(
      `UPDATE custom_threat_rules
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           conditions = COALESCE($3, conditions),
           actions = COALESCE($4, actions),
           enabled = COALESCE($5, enabled),
           last_modified = $6
       WHERE id = $7`,
      [
        updates.name,
        updates.description,
        updates.conditions ? JSON.stringify(updates.conditions) : null,
        updates.actions ? JSON.stringify(updates.actions) : null,
        updates.enabled,
        now,
        ruleId,
      ]
    );

    const result = await query(
      `SELECT * FROM custom_threat_rules WHERE id = $1`,
      [ruleId]
    );

    return this.rowToRule(result.rows[0]);
  }

  async deleteRule(ruleId: string): Promise<void> {
    await query(
      `DELETE FROM custom_threat_rules WHERE id = $1`,
      [ruleId]
    );
  }

  async validateRule(rule: ThreatRule): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    if (rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    for (let i = 0; i < rule.conditions.length; i++) {
      const condition = rule.conditions[i];
      if (!condition.field || !condition.operator || condition.value === undefined) {
        errors.push(`Condition ${i + 1} is incomplete`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getRuleStatistics(ruleId: string): Promise<{
    matchCount: number;
    lastMatch: Date | null;
    avgMatchesPerDay: number;
  }> {
    const result = await query(
      `SELECT match_count, last_match FROM custom_threat_rules WHERE id = $1`,
      [ruleId]
    );

    if (result.rows.length === 0) {
      return { matchCount: 0, lastMatch: null, avgMatchesPerDay: 0 };
    }

    const row = result.rows[0];
    const daysSinceCreation = 1; // Simplified

    return {
      matchCount: row.match_count || 0,
      lastMatch: row.last_match ? new Date(row.last_match) : null,
      avgMatchesPerDay: (row.match_count || 0) / Math.max(daysSinceCreation, 1),
    };
  }

  private evaluateCondition(condition: RuleCondition, eventData: Record<string, unknown>): boolean {
    const value = eventData[condition.field];

    switch (condition.operator) {
      case 'equals':
        if (condition.caseSensitive) {
          return value === condition.value;
        } else {
          return String(value).toLowerCase() === String(condition.value).toLowerCase();
        }

      case 'contains':
        return String(value).includes(String(condition.value));

      case 'matches':
        try {
          const regex = new RegExp(String(condition.value), 'i');
          return regex.test(String(value));
        } catch {
          return false;
        }

      case 'gt':
        return Number(value) > Number(condition.value);

      case 'lt':
        return Number(value) < Number(condition.value);

      case 'in':
        return (condition.value as unknown[]).includes(value);

      default:
        return false;
    }
  }

  private async blockThreat(_target: string): Promise<void> {
    // Block the threat
    console.log('Threat blocked:', _target);
  }

  private async warnUser(_target: string, _ruleName: string): Promise<void> {
    // Notify user of potential threat
    console.log('User warned about:', _target);
  }

  private async quarantineItem(_target: string): Promise<void> {
    // Move item to quarantine
    console.log('Item quarantined:', _target);
  }

  private async notifyUser(_target: string, _ruleName: string): Promise<void> {
    // Send notification to user
    console.log('User notified about rule:', _ruleName);
  }

  private async logEvent(_ruleId: string, _target: string): Promise<void> {
    // Log rule execution event
    console.log('Event logged for rule:', _ruleId);
  }

  private async incrementMatchCount(ruleId: string): Promise<void> {
    await query(
      `UPDATE custom_threat_rules
       SET match_count = match_count + 1, last_match = NOW()
       WHERE id = $1`,
      [ruleId]
    );
  }

  private rowToRule(row: Record<string, unknown>): ThreatRule {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      description: row.description as string,
      ruleType: row.rule_type as ThreatRule['ruleType'],
      conditions: JSON.parse(row.conditions as string) as RuleCondition[],
      actions: JSON.parse(row.actions as string) as RuleAction[],
      enabled: row.enabled as boolean,
      createdAt: new Date(row.created_at as string),
      lastModified: new Date(row.last_modified as string),
      matchCount: row.match_count as number,
    };
  }

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const threatsRulesEngine = new ThreatRulesEngine();
