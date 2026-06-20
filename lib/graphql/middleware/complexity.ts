import { GraphQLError, FieldNode, SelectionNode } from 'graphql';
import { IResolverContext } from 'apollo-server-core';

export interface ComplexityOptions {
  maxComplexity?: number;
  defaultComplexity?: number;
  variables?: Record<string, any>;
}

/**
 * Query Complexity Analysis Middleware
 * Prevents DoS attacks by analyzing query complexity before execution
 * Based on number of fields, depth, and multiplicity
 */
export class ComplexityAnalyzer {
  private static readonly MAX_COMPLEXITY = 1000;
  private static readonly DEFAULT_COMPLEXITY = 1;
  private static readonly DEFAULT_LIST_SIZE = 10; // Default for lists without args

  /**
   * Analyze query complexity
   */
  static analyzeQuery(
    selections: ReadonlyArray<SelectionNode>,
    variables: Record<string, any> = {},
    depth: number = 0,
    maxDepth: number = 10
  ): number {
    if (depth > maxDepth) {
      throw new GraphQLError('Query too deeply nested', {
        extensions: { code: 'QUERY_TOO_DEEP', maxDepth },
      });
    }

    let complexity = 0;

    for (const selection of selections) {
      if (selection.kind === 'Field') {
        const field = selection as FieldNode;
        complexity += this.getFieldComplexity(
          field,
          variables,
          depth + 1,
          maxDepth
        );
      } else if (selection.kind === 'InlineFragment') {
        complexity += this.analyzeQuery(
          selection.selectionSet?.selections || [],
          variables,
          depth,
          maxDepth
        );
      } else if (selection.kind === 'FragmentSpread') {
        // Fragments would be resolved at execution time
        complexity += this.DEFAULT_COMPLEXITY;
      }
    }

    return complexity;
  }

  /**
   * Calculate individual field complexity
   */
  private static getFieldComplexity(
    field: FieldNode,
    variables: Record<string, any>,
    depth: number,
    maxDepth: number
  ): number {
    let complexity = 0;

    // Base complexity for the field
    const baseComplexity = this.getBaseComplexity(field.name.value);

    // Multiplier based on field arguments (e.g., pagination limits)
    const multiplier = this.getMultiplier(field, variables);

    complexity = baseComplexity * multiplier;

    // Add complexity for nested fields
    if (field.selectionSet) {
      const nestedComplexity = this.analyzeQuery(
        field.selectionSet.selections,
        variables,
        depth + 1,
        maxDepth
      );
      // Nested complexity is multiplied by the current field's multiplier
      complexity += nestedComplexity * multiplier;
    }

    return complexity;
  }

  /**
   * Get base complexity for a field
   */
  private static getBaseComplexity(fieldName: string): number {
    const complexityMap: Record<string, number> = {
      // Query fields
      threat: 1,
      threats: 5, // List query is more expensive
      scans: 5,
      organizations: 5,
      teams: 3,
      integrations: 3,
      webhooks: 3,
      alerts: 5,
      apiKeys: 2,

      // Nested fields
      indicators: 2,
      actions: 2,
      members: 2,
      metadata: 1,
      analysis: 1,

      // Heavy operations
      threatStats: 10,
      threatTrends: 10,
      usageMetrics: 5,
      alertMetrics: 5,

      // Default
      default: 1,
    };

    return complexityMap[fieldName] || complexityMap.default;
  }

  /**
   * Calculate multiplier based on arguments
   */
  private static getMultiplier(
    field: FieldNode,
    variables: Record<string, any>
  ): number {
    let multiplier = 1;

    if (!field.arguments) {
      return multiplier;
    }

    for (const arg of field.arguments) {
      if (arg.name.value === 'first' || arg.name.value === 'limit') {
        const value = this.getArgumentValue(arg.value, variables);
        if (typeof value === 'number') {
          multiplier = Math.min(value, 100); // Cap at 100
          return multiplier;
        }
      }

      if (arg.name.value === 'pagination') {
        const pagination = this.getArgumentValue(arg.value, variables);
        if (pagination && typeof pagination === 'object') {
          const limit = pagination.first || pagination.last || this.DEFAULT_LIST_SIZE;
          multiplier = Math.min(limit, 100);
          return multiplier;
        }
      }
    }

    return this.DEFAULT_LIST_SIZE;
  }

  /**
   * Extract value from argument (handles variables)
   */
  private static getArgumentValue(value: any, variables: Record<string, any>): any {
    if (value.kind === 'IntValue') {
      return parseInt(value.value, 10);
    }

    if (value.kind === 'Variable') {
      return variables[value.name.value];
    }

    if (value.kind === 'ObjectValue') {
      const obj: Record<string, any> = {};
      for (const field of value.fields) {
        obj[field.name.value] = this.getArgumentValue(field.value, variables);
      }
      return obj;
    }

    if (value.kind === 'ListValue') {
      return value.values.map((v: any) => this.getArgumentValue(v, variables));
    }

    return null;
  }

  /**
   * Validate query complexity before execution
   */
  static validateComplexity(
    complexity: number,
    options: ComplexityOptions = {}
  ): void {
    const maxComplexity = options.maxComplexity || this.MAX_COMPLEXITY;

    if (complexity > maxComplexity) {
      throw new GraphQLError(
        `Query complexity exceeds maximum allowed (${complexity} / ${maxComplexity})`,
        {
          extensions: {
            code: 'COMPLEXITY_LIMIT_EXCEEDED',
            complexity,
            maxComplexity,
          },
        }
      );
    }
  }

  /**
   * Get complexity report (for debugging)
   */
  static getComplexityReport(
    selections: ReadonlyArray<SelectionNode>,
    variables: Record<string, any> = {}
  ): {
    complexity: number;
    estimate: string;
    warning?: string;
  } {
    const complexity = this.analyzeQuery(selections, variables);
    const maxComplexity = this.MAX_COMPLEXITY;
    const percentage = (complexity / maxComplexity) * 100;

    let estimate = 'Low';
    let warning: string | undefined;

    if (percentage > 80) {
      estimate = 'Very High';
      warning = 'Query is approaching complexity limit';
    } else if (percentage > 60) {
      estimate = 'High';
    } else if (percentage > 30) {
      estimate = 'Medium';
    }

    return { complexity, estimate, warning };
  }
}

/**
 * Directive for marking field complexity
 */
export const complexityDirective = (
  complexity: number = 1,
  multipliers?: Record<string, number>
) => {
  return {
    complexity,
    multipliers,
  };
};

/**
 * Middleware function to check complexity
 */
export const complexityCheckMiddleware = (options: ComplexityOptions = {}) => {
  return {
    didResolveOperation: ({ request, document }: any) => {
      const complexity = ComplexityAnalyzer.analyzeQuery(
        document.definitions[0].selectionSet.selections,
        request.variables
      );

      ComplexityAnalyzer.validateComplexity(complexity, options);

      // Log for monitoring
      if (complexity > 500) {
        console.warn(`[GraphQL] High complexity query: ${complexity}`, {
          query: document.definitions[0].name?.value,
          variables: request.variables,
        });
      }
    },
  };
};

/**
 * Query complexity budgeting per API key or user
 */
export class ComplexityBudget {
  private budgets: Map<string, { remaining: number; resetAt: number }> = new Map();
  private readonly budgetPerMinute = 10000;
  private readonly resetInterval = 60000; // 1 minute

  /**
   * Check if request is within complexity budget
   */
  checkBudget(identifier: string, complexity: number): boolean {
    const now = Date.now();
    let budget = this.budgets.get(identifier);

    // Reset budget if time has passed
    if (!budget || budget.resetAt < now) {
      budget = { remaining: this.budgetPerMinute, resetAt: now + this.resetInterval };
      this.budgets.set(identifier, budget);
    }

    if (complexity > budget.remaining) {
      return false;
    }

    budget.remaining -= complexity;
    return true;
  }

  /**
   * Get remaining budget
   */
  getRemaining(identifier: string): number {
    const budget = this.budgets.get(identifier);
    if (!budget) return this.budgetPerMinute;

    if (budget.resetAt < Date.now()) {
      return this.budgetPerMinute;
    }

    return budget.remaining;
  }

  /**
   * Refund complexity (on error)
   */
  refund(identifier: string, complexity: number): void {
    const budget = this.budgets.get(identifier);
    if (budget) {
      budget.remaining = Math.min(
        budget.remaining + complexity,
        this.budgetPerMinute
      );
    }
  }
}
