/**
 * Incident Automation - Auto-incident creation, assignment, escalation, and remediation
 * Handles automatic response to threats with configurable playbooks
 */

export interface AutoIncidentRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    threatType?: string[];
    sourceType?: string[];
    matchAll?: boolean;
  };
  autoCreate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoAssignmentRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: {
    threatLevel?: 'critical' | 'high' | 'medium' | 'low';
    threatType?: string[];
    teamId?: string;
    departmentId?: string;
  };
  assigneeId?: string;
  teamId?: string;
  priority: number; // for rule ordering
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoEscalationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: {
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    openDuration?: number; // milliseconds
    assigneeResponseTime?: number; // milliseconds
  };
  escalateTo: string; // user or team ID
  escalationLevel: number;
  notificationChannels: string[]; // email, slack, teams, sms
  createdAt: Date;
  updatedAt: Date;
}

export interface RemediationAction {
  id: string;
  type: 'quarantine' | 'block' | 'isolate' | 'delete' | 'restore' | 'custom';
  target: string; // file, IP, user, process
  targetId: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  output?: Record<string, any>;
  error?: string;
  executedAt?: Date;
  executedBy?: string;
}

export interface RemediationPlaybook {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerOn: 'critical' | 'high' | 'medium' | 'low' | 'custom';
  threatTypes?: string[];
  actions: RemediationAction[];
  requiresApproval: boolean;
  approvers?: string[]; // user IDs
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface IncidentAutomationLog {
  id: string;
  incidentId: string;
  action: string;
  ruleId?: string;
  details: Record<string, any>;
  status: 'success' | 'failed';
  error?: string;
  timestamp: Date;
  executedBy?: string;
}

export class IncidentAutomationEngine {
  private autoIncidentRules: Map<string, AutoIncidentRule> = new Map();
  private assignmentRules: Map<string, AutoAssignmentRule> = new Map();
  private escalationRules: Map<string, AutoEscalationRule> = new Map();
  private remediationPlaybooks: Map<string, RemediationPlaybook> = new Map();
  private automationLogs: Map<string, IncidentAutomationLog> = new Map();

  /**
   * Create auto-incident rule
   */
  createAutoIncidentRule(rule: Omit<AutoIncidentRule, 'id' | 'createdAt' | 'updatedAt'>): AutoIncidentRule {
    const id = this.generateId();
    const now = new Date();

    const newRule: AutoIncidentRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.autoIncidentRules.set(id, newRule);
    return newRule;
  }

  /**
   * Create auto-assignment rule
   */
  createAutoAssignmentRule(rule: Omit<AutoAssignmentRule, 'id' | 'createdAt' | 'updatedAt'>): AutoAssignmentRule {
    const id = this.generateId();
    const now = new Date();

    const newRule: AutoAssignmentRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.assignmentRules.set(id, newRule);
    return newRule;
  }

  /**
   * Create auto-escalation rule
   */
  createAutoEscalationRule(rule: Omit<AutoEscalationRule, 'id' | 'createdAt' | 'updatedAt'>): AutoEscalationRule {
    const id = this.generateId();
    const now = new Date();

    const newRule: AutoEscalationRule = {
      ...rule,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.escalationRules.set(id, newRule);
    return newRule;
  }

  /**
   * Create remediation playbook
   */
  createRemediationPlaybook(playbook: Omit<RemediationPlaybook, 'id' | 'createdAt' | 'updatedAt'>): RemediationPlaybook {
    const id = this.generateId();
    const now = new Date();

    const newPlaybook: RemediationPlaybook = {
      ...playbook,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.remediationPlaybooks.set(id, newPlaybook);
    return newPlaybook;
  }

  /**
   * Check if incident should be auto-created
   */
  shouldAutoCreateIncident(threat: Record<string, any>): boolean {
    for (const rule of this.autoIncidentRules.values()) {
      if (!rule.enabled) continue;

      if (this.matchesThreatCriteria(threat, rule.trigger)) {
        return rule.autoCreate;
      }
    }
    return false;
  }

  /**
   * Get auto-assignment for a threat
   */
  getAutoAssignment(threat: Record<string, any>): { assigneeId?: string; teamId?: string } | null {
    const matchingRules = Array.from(this.assignmentRules.values())
      .filter((r) => r.enabled && this.matchesAssignmentConditions(threat, r.conditions))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length > 0) {
      const rule = matchingRules[0];
      return {
        assigneeId: rule.assigneeId,
        teamId: rule.teamId,
      };
    }

    return null;
  }

  /**
   * Check if escalation is needed
   */
  checkEscalation(incident: Record<string, any>): AutoEscalationRule | null {
    const openDuration = Date.now() - new Date(incident.createdAt).getTime();

    for (const rule of this.escalationRules.values()) {
      if (!rule.enabled) continue;

      const threatLevelMatch = !rule.conditions.threatLevel || incident.threatLevel === rule.conditions.threatLevel;
      const durationMatch = !rule.conditions.openDuration || openDuration >= rule.conditions.openDuration;

      if (threatLevelMatch && durationMatch) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Apply remediation playbook
   */
  async applyRemediationPlaybook(
    incident: Record<string, any>,
    approvedBy?: string
  ): Promise<RemediationAction[]> {
    const playbook = this.findMatchingPlaybook(incident);
    if (!playbook || !playbook.enabled) {
      return [];
    }

    if (playbook.requiresApproval && !approvedBy) {
      throw new Error('Remediation requires approval');
    }

    const executedActions: RemediationAction[] = [];

    for (const action of playbook.actions) {
      try {
        const result = await this.executeRemediationAction(action);
        result.executedAt = new Date();
        result.executedBy = approvedBy;
        result.status = 'completed';
        executedActions.push(result);

        // Log successful action
        this.logAutomationAction(incident.id, 'remediation_applied', {
          playbookId: playbook.id,
          actionId: action.id,
          actionType: action.type,
          result,
        });
      } catch (error: any) {
        console.error('Failed to execute remediation action:', error);

        action.status = 'failed';
        action.error = error.message;
        executedActions.push(action);

        // Log failed action
        this.logAutomationAction(
          incident.id,
          'remediation_failed',
          {
            playbookId: playbook.id,
            actionId: action.id,
            error: error.message,
          },
          'failed'
        );
      }
    }

    return executedActions;
  }

  /**
   * Execute remediation action
   */
  private async executeRemediationAction(action: RemediationAction): Promise<RemediationAction> {
    const result: RemediationAction = {
      ...action,
      status: 'executing',
    };

    switch (action.type) {
      case 'quarantine':
        result.output = await this.quarantineTarget(action.targetId, action.parameters);
        break;
      case 'block':
        result.output = await this.blockTarget(action.targetId, action.parameters);
        break;
      case 'isolate':
        result.output = await this.isolateTarget(action.targetId, action.parameters);
        break;
      case 'delete':
        result.output = await this.deleteTarget(action.targetId, action.parameters);
        break;
      case 'restore':
        result.output = await this.restoreTarget(action.targetId, action.parameters);
        break;
      case 'custom':
        result.output = await this.executeCustomAction(action.targetId, action.parameters);
        break;
    }

    return result;
  }

  /**
   * Quarantine target
   */
  private async quarantineTarget(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Quarantining target:', targetId, params);
    return { quarantined: true, targetId };
  }

  /**
   * Block target
   */
  private async blockTarget(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Blocking target:', targetId, params);
    return { blocked: true, targetId };
  }

  /**
   * Isolate target
   */
  private async isolateTarget(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Isolating target:', targetId, params);
    return { isolated: true, targetId };
  }

  /**
   * Delete target
   */
  private async deleteTarget(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Deleting target:', targetId, params);
    return { deleted: true, targetId };
  }

  /**
   * Restore target
   */
  private async restoreTarget(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Restoring target:', targetId, params);
    return { restored: true, targetId };
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(targetId: string, params?: Record<string, any>): Promise<Record<string, any>> {
    console.log('Executing custom action:', targetId, params);
    return { executed: true, targetId };
  }

  /**
   * Find matching playbook for incident
   */
  private findMatchingPlaybook(incident: Record<string, any>): RemediationPlaybook | null {
    for (const playbook of this.remediationPlaybooks.values()) {
      if (!playbook.enabled) continue;

      const levelMatch = playbook.triggerOn === 'custom' || incident.threatLevel === playbook.triggerOn;
      const typeMatch =
        !playbook.threatTypes ||
        playbook.threatTypes.length === 0 ||
        playbook.threatTypes.includes(incident.threatType);

      if (levelMatch && typeMatch) {
        return playbook;
      }
    }

    return null;
  }

  /**
   * Match threat criteria
   */
  private matchesThreatCriteria(threat: Record<string, any>, criteria: any): boolean {
    const levelMatch = threat.threatLevel === criteria.threatLevel;
    const typeMatch =
      !criteria.threatType ||
      criteria.threatType.length === 0 ||
      criteria.threatType.includes(threat.threatType);
    const sourceMatch =
      !criteria.sourceType ||
      criteria.sourceType.length === 0 ||
      criteria.sourceType.includes(threat.sourceType);

    if (criteria.matchAll) {
      return levelMatch && typeMatch && sourceMatch;
    }

    return levelMatch || typeMatch || sourceMatch;
  }

  /**
   * Match assignment conditions
   */
  private matchesAssignmentConditions(threat: Record<string, any>, conditions: any): boolean {
    if (conditions.threatLevel && threat.threatLevel !== conditions.threatLevel) {
      return false;
    }

    if (
      conditions.threatType &&
      conditions.threatType.length > 0 &&
      !conditions.threatType.includes(threat.threatType)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Log automation action
   */
  private logAutomationAction(
    incidentId: string,
    action: string,
    details: Record<string, any>,
    status: 'success' | 'failed' = 'success'
  ): void {
    const logId = this.generateId();

    const log: IncidentAutomationLog = {
      id: logId,
      incidentId,
      action,
      details,
      status,
      timestamp: new Date(),
    };

    this.automationLogs.set(logId, log);
  }

  /**
   * Get automation logs for incident
   */
  getAutomationLogs(incidentId: string): IncidentAutomationLog[] {
    return Array.from(this.automationLogs.values()).filter((l) => l.incidentId === incidentId);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AutoIncidentRule | AutoAssignmentRule | AutoEscalationRule | null {
    return (
      this.autoIncidentRules.get(ruleId) ||
      this.assignmentRules.get(ruleId) ||
      this.escalationRules.get(ruleId) ||
      null
    );
  }

  /**
   * List all rules
   */
  listRules(): (AutoIncidentRule | AutoAssignmentRule | AutoEscalationRule)[] {
    return [
      ...Array.from(this.autoIncidentRules.values()),
      ...Array.from(this.assignmentRules.values()),
      ...Array.from(this.escalationRules.values()),
    ];
  }

  /**
   * List all playbooks
   */
  listPlaybooks(): RemediationPlaybook[] {
    return Array.from(this.remediationPlaybooks.values());
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return (
      this.autoIncidentRules.delete(ruleId) ||
      this.assignmentRules.delete(ruleId) ||
      this.escalationRules.delete(ruleId)
    );
  }

  /**
   * Delete playbook
   */
  deletePlaybook(playbookId: string): boolean {
    return this.remediationPlaybooks.delete(playbookId);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default IncidentAutomationEngine;
