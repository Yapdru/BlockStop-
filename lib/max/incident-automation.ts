/**
 * Incident Automation Engine - Auto-Remediation & Playbook Execution
 * Automated response to security incidents with rollback capability
 */

export interface IncidentPlaybook {
  id: string;
  name: string;
  version: string;
  description: string;
  trigger: string;
  triggerConditions: TriggerCondition[];
  actions: PlaybookAction[];
  rollbackActions: PlaybookAction[];
  approvalRequired: boolean;
  requiredApprovals: number;
  estimatedExecutionTime: number; // seconds
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  tags: string[];
  createdAt: Date;
  lastModified: Date;
}

export interface TriggerCondition {
  type: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches_regex';
  value: any;
  field: string;
  severity: number;
}

export interface PlaybookAction {
  id: string;
  type: 'isolate_host' | 'block_ip' | 'revoke_token' | 'kill_process' | 'snapshot' | 'alert' | 'ticket' | 'webhook' | 'custom';
  name: string;
  description: string;
  params: Record<string, any>;
  timeout: number; // seconds
  retryCount: number;
  retryDelay: number; // milliseconds
  onFailure: 'continue' | 'stop' | 'rollback';
  conditions?: string[];
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  incidentId: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  executedActions: ActionExecution[];
  results: ExecutionResult;
  approvals: Approval[];
  logs: ExecutionLog[];
  rollbackInfo?: RollbackInfo;
}

export interface ActionExecution {
  actionId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  output: any;
  error?: string;
  retryAttempt: number;
  affectedAssets: string[];
  changes: ChangeRecord[];
}

export interface ExecutionResult {
  success: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  assetsAffected: number;
  changesApplied: number;
  estimatedTimeToRecover: number; // seconds
  summary: string;
  recommendations: string[];
}

export interface Approval {
  id: string;
  approver: string;
  approvedAt: Date;
  approvalType: 'manual' | 'auto';
  comment?: string;
  reviewedLogs: boolean;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  actionId?: string;
  context: Record<string, any>;
}

export interface ChangeRecord {
  type: string;
  entity: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
  reversible: boolean;
}

export interface RollbackInfo {
  initiatedAt: Date;
  completedAt?: Date;
  reason: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  failedRollbacks: string[];
  successfulRollbacks: string[];
}

/**
 * Incident Automation Engine
 */
export class IncidentAutomationEngine {
  private playbooks: Map<string, IncidentPlaybook>;
  private executions: Map<string, PlaybookExecution>;
  private actionHandlers: Map<string, ActionHandler>;
  private approvalQueue: PlaybookExecution[];
  private executionHistory: PlaybookExecution[];

  constructor() {
    this.playbooks = new Map();
    this.executions = new Map();
    this.actionHandlers = new Map();
    this.approvalQueue = [];
    this.executionHistory = [];
    this.registerDefaultPlaybooks();
    this.registerActionHandlers();
  }

  /**
   * Register default playbooks
   */
  private registerDefaultPlaybooks(): void {
    this.createPlaybook({
      id: 'pb_isolate_host',
      name: 'Isolate Compromised Host',
      version: '1.0.0',
      description: 'Immediately isolate a compromised host from network',
      trigger: 'malware_detected OR privilege_escalation_detected',
      triggerConditions: [
        {
          type: 'alert_severity',
          operator: 'greater_than',
          value: 0.7,
          field: 'severity',
          severity: 8,
        },
      ],
      actions: [
        {
          id: 'act_001',
          type: 'isolate_host',
          name: 'Network Isolation',
          description: 'Isolate host from network',
          params: { isolationType: 'network', logActivity: true },
          timeout: 60,
          retryCount: 3,
          retryDelay: 5000,
          onFailure: 'continue',
        },
        {
          id: 'act_002',
          type: 'snapshot',
          name: 'Create System Snapshot',
          description: 'Create memory and disk snapshot for forensics',
          params: { includeMemory: true, includeDisks: true },
          timeout: 300,
          retryCount: 2,
          retryDelay: 10000,
          onFailure: 'continue',
        },
        {
          id: 'act_003',
          type: 'alert',
          name: 'Alert Security Team',
          description: 'Send alert to security team',
          params: { channels: ['slack', 'email', 'sms'], severity: 'critical' },
          timeout: 30,
          retryCount: 1,
          retryDelay: 5000,
          onFailure: 'continue',
        },
      ],
      rollbackActions: [
        {
          id: 'rb_001',
          type: 'custom',
          name: 'Restore Network Access',
          description: 'Restore network access to host',
          params: { restoreFirewallRules: true },
          timeout: 60,
          retryCount: 3,
          retryDelay: 5000,
          onFailure: 'stop',
        },
      ],
      approvalRequired: false,
      requiredApprovals: 0,
      estimatedExecutionTime: 400,
      riskLevel: 'high',
      enabled: true,
      tags: ['malware', 'incident_response', 'auto_remediation'],
      createdAt: new Date(),
      lastModified: new Date(),
    });

    this.createPlaybook({
      id: 'pb_block_ip',
      name: 'Block Malicious IP',
      version: '1.0.0',
      description: 'Block IP address at firewall and WAF',
      trigger: 'malicious_ip_detected OR ddos_detected',
      triggerConditions: [
        {
          type: 'threat_type',
          operator: 'matches_regex',
          value: '(ddos|brute_force|scanning)',
          field: 'threat_type',
          severity: 7,
        },
      ],
      actions: [
        {
          id: 'act_101',
          type: 'block_ip',
          name: 'Firewall Block',
          description: 'Add IP to firewall blocklist',
          params: { firewall: true, duration: 3600, reason: 'automated_threat_detection' },
          timeout: 60,
          retryCount: 2,
          retryDelay: 5000,
          onFailure: 'continue',
        },
        {
          id: 'act_102',
          type: 'custom',
          name: 'WAF Block',
          description: 'Add IP to WAF blocklist',
          params: { waf: true, duration: 3600 },
          timeout: 30,
          retryCount: 2,
          retryDelay: 5000,
          onFailure: 'continue',
        },
      ],
      rollbackActions: [
        {
          id: 'rb_101',
          type: 'custom',
          name: 'Unblock IP',
          description: 'Remove IP from blocklists',
          params: { unblock: true },
          timeout: 30,
          retryCount: 2,
          retryDelay: 5000,
          onFailure: 'stop',
        },
      ],
      approvalRequired: true,
      requiredApprovals: 1,
      estimatedExecutionTime: 90,
      riskLevel: 'medium',
      enabled: true,
      tags: ['network_security', 'ddos', 'ip_blocking'],
      createdAt: new Date(),
      lastModified: new Date(),
    });
  }

  /**
   * Register action handlers
   */
  private registerActionHandlers(): void {
    this.actionHandlers.set('isolate_host', new IsolateHostHandler());
    this.actionHandlers.set('block_ip', new BlockIPHandler());
    this.actionHandlers.set('revoke_token', new RevokeTokenHandler());
    this.actionHandlers.set('snapshot', new SnapshotHandler());
    this.actionHandlers.set('alert', new AlertHandler());
    this.actionHandlers.set('ticket', new TicketHandler());
    this.actionHandlers.set('webhook', new WebhookHandler());
    this.actionHandlers.set('custom', new CustomActionHandler());
  }

  /**
   * Create a new playbook
   */
  createPlaybook(playbook: IncidentPlaybook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(playbookId: string): IncidentPlaybook | null {
    return this.playbooks.get(playbookId) || null;
  }

  /**
   * Find matching playbooks for incident
   */
  findMatchingPlaybooks(incidentData: any): string[] {
    const matches: string[] = [];

    this.playbooks.forEach((playbook) => {
      if (!playbook.enabled) return;

      const conditionsMet = playbook.triggerConditions.every((condition) =>
        this.evaluateCondition(condition, incidentData)
      );

      if (conditionsMet) {
        matches.push(playbook.id);
      }
    });

    return matches;
  }

  /**
   * Evaluate trigger condition
   */
  private evaluateCondition(condition: TriggerCondition, data: any): boolean {
    const value = data[condition.field];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'matches_regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Execute playbook
   */
  async executePlaybook(
    playbookId: string,
    incidentId: string,
    incidentData: any
  ): Promise<PlaybookExecution> {
    const playbook = this.getPlaybook(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const execution: PlaybookExecution = {
      id: `exec_${Date.now()}`,
      playbookId,
      incidentId,
      status: playbook.approvalRequired ? 'pending' : 'approved',
      startTime: new Date(),
      executedActions: [],
      results: {
        success: false,
        actionsExecuted: 0,
        actionsFailed: 0,
        assetsAffected: 0,
        changesApplied: 0,
        estimatedTimeToRecover: 0,
        summary: '',
        recommendations: [],
      },
      approvals: [],
      logs: [],
    };

    this.executions.set(execution.id, execution);

    if (playbook.approvalRequired) {
      this.approvalQueue.push(execution);
      return execution;
    }

    return await this.runPlaybookActions(execution, playbook, incidentData);
  }

  /**
   * Run playbook actions
   */
  private async runPlaybookActions(
    execution: PlaybookExecution,
    playbook: IncidentPlaybook,
    incidentData: any
  ): Promise<PlaybookExecution> {
    execution.status = 'executing';
    const startTime = Date.now();

    try {
      for (const action of playbook.actions) {
        const actionExecution = await this.executeAction(
          action,
          incidentData
        );
        execution.executedActions.push(actionExecution);

        if (actionExecution.status === 'failed') {
          if (action.onFailure === 'stop') {
            break;
          }
          if (action.onFailure === 'rollback') {
            await this.rollback(execution, playbook);
            break;
          }
        }
      }

      execution.results.success = execution.executedActions.every(
        (a) => a.status !== 'failed'
      );
      execution.results.actionsExecuted = execution.executedActions.filter(
        (a) => a.status === 'completed'
      ).length;
      execution.results.actionsFailed = execution.executedActions.filter(
        (a) => a.status === 'failed'
      ).length;
      execution.results.changesApplied = execution.executedActions.reduce(
        (sum, a) => sum + a.changes.length,
        0
      );

      execution.status = 'completed';
    } catch (error) {
      execution.status = 'failed';
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Playbook execution failed: ${error}`,
        context: { error },
      });
    }

    execution.endTime = new Date();
    execution.results.estimatedTimeToRecover = Math.round(
      (Date.now() - startTime) / 1000
    );

    this.executionHistory.push(execution);
    return execution;
  }

  /**
   * Execute individual action
   */
  private async executeAction(
    action: PlaybookAction,
    incidentData: any
  ): Promise<ActionExecution> {
    const handler = this.actionHandlers.get(action.type);
    if (!handler) {
      throw new Error(`No handler for action type: ${action.type}`);
    }

    const execution: ActionExecution = {
      actionId: action.id,
      status: 'executing',
      startTime: new Date(),
      output: null,
      retryAttempt: 0,
      affectedAssets: [],
      changes: [],
    };

    try {
      let result: any;
      let lastError: any;

      for (let attempt = 0; attempt <= action.retryCount; attempt++) {
        try {
          execution.retryAttempt = attempt;
          result = await this.executeWithTimeout(
            () => handler.execute(action.params, incidentData),
            action.timeout * 1000
          );

          execution.output = result;
          execution.status = 'completed';
          execution.affectedAssets = result.affectedAssets || [];
          execution.changes = result.changes || [];
          break;
        } catch (error) {
          lastError = error;
          if (attempt < action.retryCount) {
            await this.sleep(action.retryDelay);
          }
        }
      }

      if (execution.status !== 'completed') {
        execution.status = 'failed';
        execution.error = String(lastError);
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = String(error);
    }

    execution.endTime = new Date();
    return execution;
  }

  /**
   * Execute function with timeout
   */
  private executeWithTimeout(
    fn: () => Promise<any>,
    timeout: number
  ): Promise<any> {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Action timeout')), timeout)
      ),
    ]);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Approve playbook execution
   */
  approveExecution(executionId: string, approverId: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.approvals.push({
      id: `apr_${Date.now()}`,
      approver: approverId,
      approvedAt: new Date(),
      approvalType: 'manual',
      reviewedLogs: true,
    });

    const playbook = this.getPlaybook(execution.playbookId);
    if (
      playbook &&
      execution.approvals.length >= playbook.requiredApprovals
    ) {
      execution.status = 'approved';
      this.approvalQueue = this.approvalQueue.filter((e) => e.id !== executionId);
    }
  }

  /**
   * Rollback execution
   */
  private async rollback(
    execution: PlaybookExecution,
    playbook: IncidentPlaybook
  ): Promise<void> {
    execution.rollbackInfo = {
      initiatedAt: new Date(),
      reason: 'Action failure triggered rollback',
      status: 'in_progress',
      failedRollbacks: [],
      successfulRollbacks: [],
    };

    // Execute rollback actions in reverse order
    for (let i = playbook.rollbackActions.length - 1; i >= 0; i--) {
      const action = playbook.rollbackActions[i];
      try {
        const handler = this.actionHandlers.get(action.type);
        if (handler) {
          await handler.execute(action.params, {});
          execution.rollbackInfo.successfulRollbacks.push(action.id);
        }
      } catch (error) {
        execution.rollbackInfo.failedRollbacks.push(action.id);
      }
    }

    execution.rollbackInfo.status = 'completed';
    execution.rollbackInfo.completedAt = new Date();
    execution.status = 'rolled_back';
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): PlaybookExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): PlaybookExecution[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): PlaybookExecution[] {
    return this.approvalQueue.filter((e) => e.status === 'pending');
  }
}

/**
 * Action Handler Interfaces & Implementations
 */
interface ActionHandler {
  execute(params: Record<string, any>, incidentData: any): Promise<any>;
}

class IsolateHostHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [incidentData.hostname || 'unknown_host'],
      changes: [
        {
          type: 'network_isolation',
          entity: incidentData.hostname,
          previousValue: 'connected',
          newValue: 'isolated',
          timestamp: new Date(),
          reversible: true,
        },
      ],
    };
  }
}

class BlockIPHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [incidentData.sourceIP || 'unknown'],
      changes: [
        {
          type: 'firewall_rule',
          entity: incidentData.sourceIP,
          previousValue: 'allowed',
          newValue: 'blocked',
          timestamp: new Date(),
          reversible: true,
        },
      ],
    };
  }
}

class RevokeTokenHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [incidentData.userId || 'unknown'],
      changes: [
        {
          type: 'token_revocation',
          entity: incidentData.userId,
          previousValue: 'valid',
          newValue: 'revoked',
          timestamp: new Date(),
          reversible: false,
        },
      ],
    };
  }
}

class SnapshotHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [incidentData.hostname || 'unknown'],
      changes: [
        {
          type: 'forensic_snapshot',
          entity: incidentData.hostname,
          previousValue: 'no_snapshot',
          newValue: `snapshot_${Date.now()}`,
          timestamp: new Date(),
          reversible: true,
        },
      ],
    };
  }
}

class AlertHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [],
      changes: [],
    };
  }
}

class TicketHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [],
      changes: [],
    };
  }
}

class WebhookHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [],
      changes: [],
    };
  }
}

class CustomActionHandler implements ActionHandler {
  async execute(params: Record<string, any>, incidentData: any): Promise<any> {
    return {
      affectedAssets: [],
      changes: [],
    };
  }
}

export const incidentAutomationEngine = new IncidentAutomationEngine();
