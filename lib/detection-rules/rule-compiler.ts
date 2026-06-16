/**
 * Rule Compiler - Compiles detection rules for execution
 */

export interface CompiledRule {
  ruleId: string;
  compiledAt: Date;
  valid: boolean;
  errors: string[];
  warnings: string[];
  executable: boolean;
  bytecode?: string;
  dependencies: string[];
}

export class RuleCompiler {
  private compiledRules: Map<string, CompiledRule> = new Map();

  /**
   * Compile detection rule
   */
  async compileRule(
    ruleId: string,
    ruleDef: {
      conditions: Array<{ field?: string; operator: string; value: unknown }>;
      actions: Array<{ type: string }>;
      filters?: Array<{ field: string; operator: string; value: unknown }>;
    }
  ): Promise<CompiledRule> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const dependencies: string[] = [];

    // Validate conditions
    for (const condition of ruleDef.conditions) {
      if (!condition.operator) {
        errors.push("Condition missing operator");
      }

      if (!this.isValidOperator(condition.operator)) {
        errors.push(`Invalid operator: ${condition.operator}`);
      }

      // Extract dependencies
      if (condition.field) {
        dependencies.push(`field:${condition.field}`);
      }
    }

    // Validate actions
    for (const action of ruleDef.actions) {
      if (!this.isValidAction(action.type)) {
        errors.push(`Invalid action type: ${action.type}`);
      }
      dependencies.push(`action:${action.type}`);
    }

    // Validate filters
    if (ruleDef.filters) {
      for (const filter of ruleDef.filters) {
        if (!filter.field) {
          errors.push("Filter missing field");
        }
      }
    }

    // Generate bytecode
    let bytecode = "";
    if (errors.length === 0) {
      bytecode = this.generateBytecode(ruleDef);
    }

    const compiled: CompiledRule = {
      ruleId,
      compiledAt: new Date(),
      valid: errors.length === 0,
      errors,
      warnings,
      executable: errors.length === 0,
      bytecode,
      dependencies: Array.from(new Set(dependencies)),
    };

    this.compiledRules.set(ruleId, compiled);
    return compiled;
  }

  /**
   * Compile multiple rules
   */
  async compileRules(rules: Array<{ ruleId: string; definition: any }>): Promise<CompiledRule[]> {
    const results: CompiledRule[] = [];

    for (const rule of rules) {
      const compiled = await this.compileRule(rule.ruleId, rule.definition);
      results.push(compiled);
    }

    return results;
  }

  /**
   * Generate bytecode for rule
   */
  private generateBytecode(ruleDef: any): string {
    let bytecode = "RULE_START\n";

    // Add condition bytecode
    bytecode += "CONDITIONS\n";
    for (let i = 0; i < ruleDef.conditions.length; i++) {
      const cond = ruleDef.conditions[i];
      bytecode += `  CONDITION_${i}: LOAD ${cond.field || "all"} OP ${cond.operator} VAL ${JSON.stringify(
        cond.value
      )}\n`;
    }

    // Add action bytecode
    bytecode += "ACTIONS\n";
    for (const action of ruleDef.actions) {
      bytecode += `  ACTION: CALL ${action.type}\n`;
    }

    bytecode += "RULE_END\n";

    return bytecode;
  }

  /**
   * Check if operator is valid
   */
  private isValidOperator(operator: string): boolean {
    const validOperators = [
      "equals",
      "contains",
      "regex",
      "greater_than",
      "less_than",
      "in",
      "not_equals",
      "not_contains",
    ];
    return validOperators.includes(operator);
  }

  /**
   * Check if action type is valid
   */
  private isValidAction(actionType: string): boolean {
    const validActions = ["alert", "quarantine", "block", "log", "notify", "escalate"];
    return validActions.includes(actionType);
  }

  /**
   * Optimize compiled rule
   */
  async optimizeRule(ruleId: string): Promise<CompiledRule | null> {
    const compiled = this.compiledRules.get(ruleId);
    if (!compiled) return null;

    // In production, optimization would involve:
    // - Reordering conditions for efficiency
    // - Eliminating redundant conditions
    // - Pre-compiling regex patterns
    // - etc.

    return compiled;
  }

  /**
   * Get compiled rule
   */
  async getCompiledRule(ruleId: string): Promise<CompiledRule | null> {
    return this.compiledRules.get(ruleId) || null;
  }

  /**
   * Validate compilation
   */
  async validateCompilation(ruleId: string): Promise<boolean> {
    const compiled = this.compiledRules.get(ruleId);
    return compiled?.valid || false;
  }

  /**
   * Get compilation errors
   */
  async getErrors(ruleId: string): Promise<string[]> {
    const compiled = this.compiledRules.get(ruleId);
    return compiled?.errors || [];
  }

  /**
   * Clear compiled rules
   */
  async clearCompiled(): Promise<void> {
    this.compiledRules.clear();
  }

  /**
   * Get compilation statistics
   */
  async getStatistics(): Promise<{
    totalCompiled: number;
    validRules: number;
    invalidRules: number;
    successRate: number;
  }> {
    const rules = Array.from(this.compiledRules.values());
    const validRules = rules.filter((r) => r.valid).length;

    return {
      totalCompiled: rules.length,
      validRules,
      invalidRules: rules.length - validRules,
      successRate: rules.length > 0 ? (validRules / rules.length) * 100 : 0,
    };
  }
}

export default RuleCompiler;
