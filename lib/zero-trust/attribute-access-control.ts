import { query } from '@/lib/db';

export interface Attribute {
  name: string;
  value: any;
  type: string;
}

export interface AccessPolicy {
  policyId: string;
  name: string;
  rules: AccessRule[];
  createdAt: Date;
  active: boolean;
}

export interface AccessRule {
  condition: string;
  effect: 'allow' | 'deny';
  resources: string[];
  actions: string[];
  attributes?: {
    user?: Attribute[];
    resource?: Attribute[];
    environment?: Attribute[];
  };
}

export class AttributeAccessControl {
  /**
   * Evaluate an access policy against a request
   */
  async evaluatePolicy(
    userId: string,
    resource: string,
    action: string,
    attributes?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const policies = await this.listPolicies();

      // Filter active policies
      const activePolicies = policies.filter(p => p.active);

      // Evaluate rules
      for (const policy of activePolicies) {
        const result = await this.evaluateRuleSet(
          policy.rules,
          userId,
          resource,
          action,
          attributes
        );

        if (result.decided) {
          return {
            allowed: result.allowed,
            reason: result.reason,
          };
        }
      }

      // Default deny
      return {
        allowed: false,
        reason: 'No applicable policy found',
      };
    } catch (error) {
      console.error('Error evaluating policy:', error);
      return {
        allowed: false,
        reason: 'Policy evaluation error',
      };
    }
  }

  /**
   * Create a new access policy
   */
  async createPolicy(policy: Partial<AccessPolicy>): Promise<AccessPolicy> {
    try {
      if (!policy.name) {
        throw new Error('Policy name is required');
      }

      const result = await query(
        `INSERT INTO access_policies (name, active, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id as "policyId", name, active, created_at as "createdAt"`,
        [policy.name, policy.active !== false]
      );

      const policyId = result.rows[0].policyId;

      // Insert rules
      const rules: AccessRule[] = [];
      if (policy.rules && policy.rules.length > 0) {
        for (const rule of policy.rules) {
          const ruleResult = await query(
            `INSERT INTO access_rules (policy_id, condition, effect, resources, actions, attributes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id, condition, effect, resources, actions, attributes`,
            [
              policyId,
              rule.condition,
              rule.effect,
              JSON.stringify(rule.resources),
              JSON.stringify(rule.actions),
              JSON.stringify(rule.attributes || {}),
            ]
          );

          rules.push({
            condition: ruleResult.rows[0].condition,
            effect: ruleResult.rows[0].effect,
            resources: JSON.parse(ruleResult.rows[0].resources),
            actions: JSON.parse(ruleResult.rows[0].actions),
            attributes: JSON.parse(ruleResult.rows[0].attributes),
          });
        }
      }

      return {
        policyId,
        name: result.rows[0].name,
        rules,
        createdAt: new Date(result.rows[0].createdAt),
        active: result.rows[0].active,
      };
    } catch (error) {
      console.error('Error creating policy:', error);
      throw new Error('Failed to create access policy');
    }
  }

  /**
   * Update an access policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<AccessPolicy>
  ): Promise<AccessPolicy> {
    try {
      if (updates.name || updates.active !== undefined) {
        await query(
          `UPDATE access_policies
           SET name = COALESCE($1, name),
               active = COALESCE($2, active)
           WHERE id = $3`,
          [updates.name || null, updates.active !== undefined ? updates.active : null, policyId]
        );
      }

      // Update rules if provided
      if (updates.rules && updates.rules.length > 0) {
        // Delete existing rules
        await query('DELETE FROM access_rules WHERE policy_id = $1', [policyId]);

        // Insert new rules
        for (const rule of updates.rules) {
          await query(
            `INSERT INTO access_rules (policy_id, condition, effect, resources, actions, attributes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              policyId,
              rule.condition,
              rule.effect,
              JSON.stringify(rule.resources),
              JSON.stringify(rule.actions),
              JSON.stringify(rule.attributes || {}),
            ]
          );
        }
      }

      // Fetch and return updated policy
      const result = await query(
        `SELECT id as "policyId", name, active, created_at as "createdAt"
         FROM access_policies WHERE id = $1`,
        [policyId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Policy ${policyId} not found`);
      }

      const policy = result.rows[0];
      const rules = await this.getPolicyRules(policyId);

      return {
        policyId: policy.policyId,
        name: policy.name,
        rules,
        createdAt: new Date(policy.createdAt),
        active: policy.active,
      };
    } catch (error) {
      console.error('Error updating policy:', error);
      throw new Error('Failed to update access policy');
    }
  }

  /**
   * Delete an access policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      // Delete rules first (foreign key constraint)
      await query(
        'DELETE FROM access_rules WHERE policy_id = $1',
        [policyId]
      );

      // Delete policy
      await query(
        'DELETE FROM access_policies WHERE id = $1',
        [policyId]
      );
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw new Error('Failed to delete access policy');
    }
  }

  /**
   * List all access policies
   */
  async listPolicies(): Promise<AccessPolicy[]> {
    try {
      const result = await query(
        `SELECT id as "policyId", name, active, created_at as "createdAt"
         FROM access_policies
         ORDER BY created_at DESC`
      );

      const policies: AccessPolicy[] = [];

      for (const row of result.rows) {
        const rules = await this.getPolicyRules(row.policyId);
        policies.push({
          policyId: row.policyId,
          name: row.name,
          active: row.active,
          rules,
          createdAt: new Date(row.createdAt),
        });
      }

      return policies;
    } catch (error) {
      console.error('Error listing policies:', error);
      return [];
    }
  }

  /**
   * Evaluate access rules
   */
  async evaluateRules(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const policies = await this.listPolicies();
      const activePolicies = policies.filter(p => p.active);

      for (const policy of activePolicies) {
        const result = await this.evaluateRuleSet(
          policy.rules,
          userId,
          resource,
          action
        );

        if (result.decided) {
          return result.allowed;
        }
      }

      return false; // Default deny
    } catch (error) {
      console.error('Error evaluating rules:', error);
      return false;
    }
  }

  /**
   * Private helper to get rules for a policy
   */
  private async getPolicyRules(policyId: string): Promise<AccessRule[]> {
    try {
      const result = await query(
        `SELECT condition, effect, resources, actions, attributes
         FROM access_rules
         WHERE policy_id = $1
         ORDER BY created_at ASC`,
        [policyId]
      );

      return result.rows.map(row => ({
        condition: row.condition,
        effect: row.effect,
        resources: JSON.parse(row.resources),
        actions: JSON.parse(row.actions),
        attributes: JSON.parse(row.attributes || '{}'),
      }));
    } catch (error) {
      console.error('Error fetching policy rules:', error);
      return [];
    }
  }

  /**
   * Private helper to evaluate a set of rules
   */
  private async evaluateRuleSet(
    rules: AccessRule[],
    userId: string,
    resource: string,
    action: string,
    attributes?: any
  ): Promise<{ decided: boolean; allowed: boolean; reason?: string }> {
    // Deny rules take precedence
    for (const rule of rules) {
      if (rule.effect === 'deny') {
        const matches = this.ruleMatches(rule, resource, action);
        if (matches) {
          return {
            decided: true,
            allowed: false,
            reason: `Denied by rule: ${rule.condition}`,
          };
        }
      }
    }

    // Check allow rules
    for (const rule of rules) {
      if (rule.effect === 'allow') {
        const matches = this.ruleMatches(rule, resource, action);
        if (matches) {
          return {
            decided: true,
            allowed: true,
            reason: `Allowed by rule: ${rule.condition}`,
          };
        }
      }
    }

    return { decided: false, allowed: false };
  }

  /**
   * Private helper to check if a rule matches a request
   */
  private ruleMatches(rule: AccessRule, resource: string, action: string): boolean {
    // Check resource match
    const resourceMatch = rule.resources.some(r => {
      if (r === '*') return true;
      if (r.includes('*')) {
        const pattern = new RegExp(`^${r.replace(/\*/g, '.*')}$`);
        return pattern.test(resource);
      }
      return r === resource;
    });

    if (!resourceMatch) return false;

    // Check action match
    const actionMatch = rule.actions.some(a => {
      if (a === '*') return true;
      if (a.includes('*')) {
        const pattern = new RegExp(`^${a.replace(/\*/g, '.*')}$`);
        return pattern.test(action);
      }
      return a === action;
    });

    return actionMatch;
  }
}

// Export singleton instance
export const attributeAccessControl = new AttributeAccessControl();
