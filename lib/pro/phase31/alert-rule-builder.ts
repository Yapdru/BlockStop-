// PRO Phase 31.1 - Visual Alert Rule Builder
// Production-grade rule builder with preview and testing capabilities

import { RuleBuilderConfig, ConditionGroup, AlertCondition, PreviewResult } from '@/types/pro-phase31';

// ============================================================================
// ALERT RULE BUILDER
// ============================================================================

export class AlertRuleBuilder {
  private rules: Map<string, RuleBuilderConfig> = new Map();
  private operators = {
    threat: ['eq', 'gt', 'gte', 'lt', 'lte', 'in'],
    string: ['eq', 'neq', 'contains', 'regex'],
    number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
    boolean: ['eq', 'neq'],
  };

  private threatFields = [
    { name: 'riskScore', type: 'number', description: 'Overall risk score (0-1)' },
    { name: 'confidenceScore', type: 'number', description: 'Prediction confidence' },
    { name: 'features.sourceIp', type: 'string', description: 'Source IP address' },
    { name: 'features.destinationIp', type: 'string', description: 'Destination IP address' },
    { name: 'features.protocol', type: 'string', description: 'Network protocol' },
    { name: 'features.payloadSize', type: 'number', description: 'Payload size in bytes' },
    { name: 'features.packetCount', type: 'number', description: 'Number of packets' },
    { name: 'features.geoLocation.country', type: 'string', description: 'Source country' },
    { name: 'predictions.malware', type: 'number', description: 'Malware probability' },
    { name: 'predictions.botnet', type: 'number', description: 'Botnet probability' },
    { name: 'predictions.ddos', type: 'number', description: 'DDoS probability' },
    { name: 'predictions.exploitation', type: 'number', description: 'Exploitation probability' },
    { name: 'threatIntel.isKnownMalicious', type: 'boolean', description: 'Known malicious source' },
    { name: 'threatIntel.previousIncidents', type: 'number', description: 'Previous incidents count' },
  ];

  /**
   * Create a new rule from builder config
   */
  createRule(config: Omit<RuleBuilderConfig, 'id' | 'createdAt' | 'updatedAt'>): RuleBuilderConfig {
    const rule: RuleBuilderConfig = {
      ...config,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId: string, updates: Partial<RuleBuilderConfig>): RuleBuilderConfig | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated: RuleBuilderConfig = {
      ...rule,
      ...updates,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updated);
    return updated;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Generate preview of rule matches
   */
  generatePreview(config: RuleBuilderConfig, sampleThreats: any[]): PreviewResult {
    const matches = sampleThreats.filter((threat) => this.evaluateConditions(config.conditions, threat));

    const falsePositives = matches.filter(
      (threat) => threat.riskScore < 0.4 || (threat.confidenceScore || 0) < 0.6
    ).length;

    return {
      matchingThreats: matches.length,
      sampleMatches: matches.slice(0, 5).map((threat) => ({
        threatId: threat.threatId,
        severity: threat.riskScore > 0.8 ? 'critical' : threat.riskScore > 0.6 ? 'high' : 'medium',
        matchScore: this.calculateMatchScore(config.conditions, threat),
      })),
      estimatedNotifications: matches.length,
      estimatedFalsePositives: falsePositives,
    };
  }

  /**
   * Evaluate conditions against threat
   */
  private evaluateConditions(conditions: ConditionGroup, threat: any): boolean {
    const logic = conditions.logic === 'AND' ? 'every' : 'some';

    return (conditions.conditions as any)[logic]((condition: any) => {
      if ('conditions' in condition) {
        // Nested condition group
        return this.evaluateConditions(condition, threat);
      } else {
        // Single condition
        const value = this.getThreatValue(threat, condition.field);
        return this.compareValues(value, condition.operator, condition.value);
      }
    });
  }

  /**
   * Extract value from threat
   */
  private getThreatValue(threat: any, field: string): any {
    const parts = field.split('.');
    let value = threat;

    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }

    return value;
  }

  /**
   * Compare values
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return Number(actual) > Number(expected);
      case 'gte':
        return Number(actual) >= Number(expected);
      case 'lt':
        return Number(actual) < Number(expected);
      case 'lte':
        return Number(actual) <= Number(expected);
      case 'contains':
        return String(actual).includes(String(expected));
      case 'regex':
        return new RegExp(String(expected)).test(String(actual));
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      default:
        return false;
    }
  }

  /**
   * Calculate match score for condition
   */
  private calculateMatchScore(conditions: ConditionGroup, threat: any): number {
    let score = 0;
    const conditionArray = conditions.conditions as any[];

    for (const condition of conditionArray) {
      if ('conditions' in condition) {
        score += this.calculateMatchScore(condition, threat) / 2;
      } else {
        const value = this.getThreatValue(threat, condition.field);
        if (this.compareValues(value, condition.operator, condition.value)) {
          score += 1;
        }
      }
    }

    return Math.min(score / conditionArray.length, 1);
  }

  /**
   * Get available fields for rule builder
   */
  getAvailableFields(): Array<{ name: string; type: string; description: string }> {
    return this.threatFields;
  }

  /**
   * Get operators for field type
   */
  getOperatorsForType(fieldType: string): string[] {
    return this.operators[fieldType as keyof typeof this.operators] || [];
  }

  /**
   * Validate rule configuration
   */
  validateRule(config: RuleBuilderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    if (config.conditions.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (config.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // Validate conditions
    const conditionErrors = this.validateConditions(config.conditions);
    errors.push(...conditionErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate condition group
   */
  private validateConditions(group: ConditionGroup): string[] {
    const errors: string[] = [];

    for (const condition of group.conditions) {
      if ('conditions' in condition) {
        errors.push(...this.validateConditions(condition));
      } else {
        const cond = condition as AlertCondition;
        if (!cond.field) {
          errors.push('Condition field is required');
        }
        if (!cond.operator) {
          errors.push('Condition operator is required');
        }
        if (cond.value === null || cond.value === undefined) {
          errors.push('Condition value is required');
        }
      }
    }

    return errors;
  }

  /**
   * Clone existing rule
   */
  cloneRule(ruleId: string, newName: string): RuleBuilderConfig | null {
    const original = this.rules.get(ruleId);
    if (!original) return null;

    return this.createRule({
      name: newName,
      description: `Clone of ${original.name}`,
      ruleType: original.ruleType,
      conditions: JSON.parse(JSON.stringify(original.conditions)), // Deep clone
      actions: JSON.parse(JSON.stringify(original.actions)),
      webhooks: JSON.parse(JSON.stringify(original.webhooks)),
      severity: original.severity,
      enabled: false, // Start disabled
      createdBy: original.createdBy,
    });
  }

  /**
   * Export rule as JSON
   */
  exportRule(ruleId: string): string | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    return JSON.stringify(rule, null, 2);
  }

  /**
   * Import rule from JSON
   */
  importRule(jsonString: string, createdBy: string): RuleBuilderConfig | null {
    try {
      const data = JSON.parse(jsonString);
      return this.createRule({
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        conditions: data.conditions,
        actions: data.actions,
        webhooks: data.webhooks,
        severity: data.severity,
        enabled: false,
        createdBy,
      });
    } catch (error) {
      console.error('Failed to import rule:', error);
      return null;
    }
  }

  /**
   * Get all rules
   */
  getAllRules(): RuleBuilderConfig[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): RuleBuilderConfig | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get rule templates
   */
  getRuleTemplates(): RuleBuilderConfig[] {
    return [
      {
        id: 'template_critical_malware',
        name: 'Critical Malware Detection',
        description: 'Alert on high-confidence malware detections',
        ruleType: 'threat-detection',
        conditions: {
          logic: 'AND',
          conditions: [
            {
              field: 'predictions.malware',
              operator: 'gte',
              value: 0.8,
            } as AlertCondition,
            {
              field: 'confidenceScore',
              operator: 'gte',
              value: 0.9,
            } as AlertCondition,
          ],
        },
        actions: [{ type: 'email', config: {}, enabled: true }],
        webhooks: [],
        severity: 'critical',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'template_ddos_attack',
        name: 'DDoS Attack Detection',
        description: 'Alert on suspected DDoS attacks',
        ruleType: 'threat-detection',
        conditions: {
          logic: 'AND',
          conditions: [
            {
              field: 'predictions.ddos',
              operator: 'gte',
              value: 0.75,
            } as AlertCondition,
            {
              field: 'features.packetCount',
              operator: 'gt',
              value: 10000,
            } as AlertCondition,
          ],
        },
        actions: [
          { type: 'email', config: {}, enabled: true },
          { type: 'slack', config: {}, enabled: true },
        ],
        webhooks: [],
        severity: 'high',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'template_known_malicious',
        name: 'Known Malicious Source',
        description: 'Alert when threat from known malicious source detected',
        ruleType: 'threat-detection',
        conditions: {
          logic: 'AND',
          conditions: [
            {
              field: 'threatIntel.isKnownMalicious',
              operator: 'eq',
              value: true,
            } as AlertCondition,
          ],
        },
        actions: [{ type: 'email', config: {}, enabled: true }],
        webhooks: [],
        severity: 'high',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ];
  }
}

/**
 * Singleton instance for alert rule builder
 */
export const alertRuleBuilder = new AlertRuleBuilder();

/**
 * Generate human-readable rule description
 */
export function describeRule(config: RuleBuilderConfig): string {
  const parts: string[] = [];

  parts.push(`Rule: ${config.name}`);
  parts.push(`Type: ${config.ruleType}`);
  parts.push(`Severity: ${config.severity.toUpperCase()}`);
  parts.push(`Status: ${config.enabled ? 'ENABLED' : 'DISABLED'}`);
  parts.push('');
  parts.push('Conditions:');

  const describeConditions = (group: ConditionGroup, indent: number = 1): string[] => {
    const lines: string[] = [];
    const prefix = '  '.repeat(indent);

    lines.push(`${prefix}${group.logic}`);

    for (const condition of group.conditions) {
      if ('conditions' in condition) {
        lines.push(...describeConditions(condition, indent + 1));
      } else {
        const cond = condition as AlertCondition;
        const fieldName = cond.field.split('.').pop();
        lines.push(`${prefix}  ${fieldName} ${cond.operator} ${cond.value}`);
      }
    }

    return lines;
  };

  parts.push(...describeConditions(config.conditions));

  if (config.actions.length > 0) {
    parts.push('');
    parts.push('Actions:');
    config.actions.forEach((action) => {
      parts.push(`  • Send ${action.type} notification`);
    });
  }

  return parts.join('\n');
}
