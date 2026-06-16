/**
 * Detection Rule Builder - Build custom threat detection rules
 */

export interface DetectionRule {
  ruleId: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  author: string;
  createdAt: Date;
  modifiedAt: Date;
  conditions: RuleCondition[];
  actions: RuleAction[];
  filters?: RuleFilter[];
  metadata: {
    references: string[];
    tags: string[];
    mitreTechniques: string[];
  };
}

export interface RuleCondition {
  type: "field" | "pattern" | "aggregation" | "script";
  field?: string;
  operator: "equals" | "contains" | "regex" | "greater_than" | "less_than" | "in";
  value: string | number | string[];
  logic?: "AND" | "OR";
}

export interface RuleAction {
  type: "alert" | "quarantine" | "block" | "log" | "notify" | "escalate";
  severity?: string;
  notifyUsers?: string[];
  escalateToSOC?: boolean;
  quarantineDestination?: string;
}

export interface RuleFilter {
  field: string;
  operator: "equals" | "contains" | "not_equals" | "not_contains" | "in";
  value: string | number | string[];
}

export class RuleBuilder {
  private rules: Map<string, DetectionRule> = new Map();
  private ruleGroups: Map<string, string[]> = new Map();

  /**
   * Create a new detection rule
   */
  async createRule(
    ruleData: Omit<DetectionRule, "ruleId" | "createdAt" | "modifiedAt">
  ): Promise<DetectionRule> {
    const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rule: DetectionRule = {
      ...ruleData,
      ruleId,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    this.rules.set(ruleId, rule);
    console.log(`[RuleBuilder] Created rule: ${rule.name}`);

    return rule;
  }

  /**
   * Update a rule
   */
  async updateRule(ruleId: string, updates: Partial<DetectionRule>): Promise<DetectionRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates);
    rule.modifiedAt = new Date();

    return rule;
  }

  /**
   * Add condition to rule
   */
  async addCondition(ruleId: string, condition: RuleCondition): Promise<DetectionRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.conditions.push(condition);
    rule.modifiedAt = new Date();

    return rule;
  }

  /**
   * Add action to rule
   */
  async addAction(ruleId: string, action: RuleAction): Promise<DetectionRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.actions.push(action);
    rule.modifiedAt = new Date();

    return rule;
  }

  /**
   * Add filter to rule
   */
  async addFilter(ruleId: string, filter: RuleFilter): Promise<DetectionRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    if (!rule.filters) {
      rule.filters = [];
    }

    rule.filters.push(filter);
    rule.modifiedAt = new Date();

    return rule;
  }

  /**
   * Get rule
   */
  async getRule(ruleId: string): Promise<DetectionRule | null> {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules
   */
  async getAllRules(enabled?: boolean): Promise<DetectionRule[]> {
    let rules = Array.from(this.rules.values());

    if (enabled !== undefined) {
      rules = rules.filter((r) => r.enabled === enabled);
    }

    return rules;
  }

  /**
   * Enable/disable rule
   */
  async setRuleEnabled(ruleId: string, enabled: boolean): Promise<DetectionRule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    rule.enabled = enabled;
    rule.modifiedAt = new Date();

    return rule;
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    return this.rules.delete(ruleId);
  }

  /**
   * Create rule group
   */
  async createRuleGroup(groupName: string, ruleIds: string[]): Promise<void> {
    // Validate all rules exist
    for (const ruleId of ruleIds) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Rule ${ruleId} not found`);
      }
    }

    this.ruleGroups.set(groupName, ruleIds);
    console.log(`[RuleBuilder] Created rule group: ${groupName}`);
  }

  /**
   * Get rule group
   */
  async getRuleGroup(groupName: string): Promise<DetectionRule[]> {
    const ruleIds = this.ruleGroups.get(groupName) || [];
    return ruleIds.map((id) => this.rules.get(id)!).filter((r) => r);
  }

  /**
   * Export rule
   */
  async exportRule(ruleId: string, format: "json" | "yaml" = "json"): Promise<string> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    if (format === "json") {
      return JSON.stringify(rule, null, 2);
    }

    // YAML format
    let yaml = `id: ${rule.ruleId}\n`;
    yaml += `name: ${rule.name}\n`;
    yaml += `description: ${rule.description}\n`;
    yaml += `severity: ${rule.severity}\n`;
    yaml += `enabled: ${rule.enabled}\n`;
    yaml += `conditions:\n`;

    for (const condition of rule.conditions) {
      yaml += `  - type: ${condition.type}\n`;
      if (condition.field) yaml += `    field: ${condition.field}\n`;
      yaml += `    operator: ${condition.operator}\n`;
      yaml += `    value: ${JSON.stringify(condition.value)}\n`;
    }

    yaml += `actions:\n`;
    for (const action of rule.actions) {
      yaml += `  - type: ${action.type}\n`;
      if (action.severity) yaml += `    severity: ${action.severity}\n`;
    }

    return yaml;
  }

  /**
   * Import rule from JSON
   */
  async importRule(ruleJSON: string): Promise<DetectionRule> {
    const rule = JSON.parse(ruleJSON);
    return await this.createRule(rule);
  }

  /**
   * Get rules by severity
   */
  async getRulesBySeverity(severity: string): Promise<DetectionRule[]> {
    return Array.from(this.rules.values()).filter((r) => r.severity === severity);
  }

  /**
   * Get rules by tag
   */
  async getRulesByTag(tag: string): Promise<DetectionRule[]> {
    return Array.from(this.rules.values()).filter((r) =>
      r.metadata.tags.includes(tag)
    );
  }

  /**
   * Validate rule
   */
  async validateRule(ruleId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return { valid: false, errors: ["Rule not found"], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate conditions
    if (rule.conditions.length === 0) {
      errors.push("Rule must have at least one condition");
    }

    for (const condition of rule.conditions) {
      if (!condition.field && condition.type !== "aggregation") {
        errors.push("Field-type conditions must specify a field");
      }

      if (!["equals", "contains", "regex", "greater_than", "less_than", "in"].includes(
        condition.operator
      )) {
        errors.push(`Invalid operator: ${condition.operator}`);
      }
    }

    // Validate actions
    if (rule.actions.length === 0) {
      warnings.push("Rule has no actions defined");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clone rule
   */
  async cloneRule(ruleId: string): Promise<DetectionRule> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const cloned = { ...rule };
    cloned.name = `${rule.name} (Copy)`;
    cloned.ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.rules.set(cloned.ruleId, cloned);

    return cloned;
  }

  /**
   * Get rule statistics
   */
  async getStatistics(): Promise<{
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    bySeverity: Record<string, number>;
    ruleGroups: number;
  }> {
    const rules = Array.from(this.rules.values());
    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const rule of rules) {
      bySeverity[rule.severity]++;
    }

    return {
      totalRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled).length,
      disabledRules: rules.filter((r) => !r.enabled).length,
      bySeverity,
      ruleGroups: this.ruleGroups.size,
    };
  }
}

export default RuleBuilder;
