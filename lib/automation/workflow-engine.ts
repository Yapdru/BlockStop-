/**
 * Workflow Engine - Visual Workflow Builder & Executor
 * Handles workflow creation, execution, versioning, and management
 */

export type TriggerType = 'on-threat' | 'on-schedule' | 'on-webhook' | 'on-user-action';
export type ActionType =
  | 'email'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'database-update'
  | 'file-creation'
  | 'incident-create'
  | 'quarantine'
  | 'block'
  | 'isolate'
  | 'notification';

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  onSuccess?: string; // next action ID
  onFailure?: string; // next action ID on failure
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
}

export interface ConditionalBranch {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'regex';
    value: any;
    logicalOperator?: 'AND' | 'OR';
    nested?: ConditionalBranch[];
  };
  thenActionId: string;
  elseActionId?: string;
}

export interface WorkflowLoop {
  id: string;
  type: 'for-each' | 'while' | 'until';
  iterationVariable: string;
  collection?: string; // path to array in context
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
  body: string[]; // array of action IDs to loop
  maxIterations?: number;
}

export interface WorkflowVersion {
  version: number;
  createdAt: Date;
  createdBy: string;
  changes: string;
  isActive: boolean;
  workflowId: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  conditionals?: ConditionalBranch[];
  loops?: WorkflowLoop[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  currentVersion: number;
  variables?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'paused';
  context: Record<string, any>;
  currentActionId?: string;
  executionLog: WorkflowExecutionLog[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  duration?: number;
}

export interface WorkflowExecutionLog {
  timestamp: Date;
  actionId: string;
  actionType: ActionType;
  status: 'started' | 'completed' | 'failed';
  duration: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private versions: Map<string, WorkflowVersion[]> = new Map();

  /**
   * Create a new workflow
   */
  createWorkflow(workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>): WorkflowDefinition {
    const id = this.generateId();
    const now = new Date();

    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
      currentVersion: 1,
    };

    this.workflows.set(id, newWorkflow);

    // Initialize version history
    this.versions.set(id, [
      {
        version: 1,
        createdAt: now,
        createdBy: workflow.createdBy,
        changes: 'Initial version',
        isActive: true,
        workflowId: id,
      },
    ]);

    return newWorkflow;
  }

  /**
   * Update a workflow and create new version
   */
  updateWorkflow(
    workflowId: string,
    updates: Partial<Omit<WorkflowDefinition, 'id' | 'createdAt' | 'createdBy' | 'currentVersion'>>,
    updatedBy: string,
    changeDescription: string
  ): WorkflowDefinition | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const newVersion = workflow.currentVersion + 1;
    const now = new Date();

    const updated: WorkflowDefinition = {
      ...workflow,
      ...updates,
      updatedAt: now,
      currentVersion: newVersion,
    };

    this.workflows.set(workflowId, updated);

    // Record version
    const versions = this.versions.get(workflowId) || [];
    versions.forEach((v) => (v.isActive = false));
    versions.push({
      version: newVersion,
      createdAt: now,
      createdBy: updatedBy,
      changes: changeDescription,
      isActive: true,
      workflowId,
    });
    this.versions.set(workflowId, versions);

    return updated;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * List all workflows
   */
  listWorkflows(filters?: { tags?: string[]; enabled?: boolean }): WorkflowDefinition[] {
    let workflows = Array.from(this.workflows.values());

    if (filters?.tags && filters.tags.length > 0) {
      workflows = workflows.filter((w) =>
        filters.tags!.some((tag) => w.tags.includes(tag))
      );
    }

    if (filters?.enabled !== undefined) {
      workflows = workflows.filter((w) => w.enabled === filters.enabled);
    }

    return workflows;
  }

  /**
   * Delete a workflow
   */
  deleteWorkflow(workflowId: string): boolean {
    this.workflows.delete(workflowId);
    this.versions.delete(workflowId);
    return true;
  }

  /**
   * Get version history
   */
  getVersionHistory(workflowId: string): WorkflowVersion[] {
    return this.versions.get(workflowId) || [];
  }

  /**
   * Rollback to a previous version
   */
  rollbackToVersion(workflowId: string, version: number, rolledBackBy: string): WorkflowDefinition | null {
    const workflow = this.workflows.get(workflowId);
    const versions = this.versions.get(workflowId);

    if (!workflow || !versions) return null;

    const targetVersion = versions.find((v) => v.version === version);
    if (!targetVersion) return null;

    // In a real system, you'd restore the workflow definition from the version
    const now = new Date();
    const updated: WorkflowDefinition = {
      ...workflow,
      updatedAt: now,
      currentVersion: workflow.currentVersion + 1,
    };

    this.workflows.set(workflowId, updated);

    // Record rollback
    versions.forEach((v) => (v.isActive = false));
    versions.push({
      version: workflow.currentVersion + 1,
      createdAt: now,
      createdBy: rolledBackBy,
      changes: `Rollback to version ${version}`,
      isActive: true,
      workflowId,
    });

    return updated;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, context: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) {
      throw new Error('Workflow not found or disabled');
    }

    const executionId = this.generateId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowVersion: workflow.currentVersion,
      status: 'running',
      context,
      executionLog: [],
      startedAt: new Date(),
    };

    this.executions.set(executionId, execution);

    try {
      await this.executeActions(workflow, execution);
      execution.status = 'success';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    }

    return execution;
  }

  /**
   * Execute workflow actions
   */
  private async executeActions(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    let currentActionId = workflow.actions[0]?.id;

    while (currentActionId) {
      const action = workflow.actions.find((a) => a.id === currentActionId);
      if (!action) break;

      execution.currentActionId = currentActionId;

      try {
        const startTime = Date.now();
        const output = await this.executeAction(action, execution.context);
        const duration = Date.now() - startTime;

        execution.executionLog.push({
          timestamp: new Date(),
          actionId: action.id,
          actionType: action.type,
          status: 'completed',
          duration,
          input: execution.context,
          output,
        });

        // Update context with output
        execution.context = { ...execution.context, ...output };

        // Evaluate conditionals
        if (workflow.conditionals) {
          const nextActionId = this.evaluateConditionals(
            workflow.conditionals,
            execution.context
          );
          if (nextActionId) {
            currentActionId = nextActionId;
            continue;
          }
        }

        // Move to next action
        currentActionId = action.onSuccess;
      } catch (error: any) {
        execution.executionLog.push({
          timestamp: new Date(),
          actionId: action.id,
          actionType: action.type,
          status: 'failed',
          duration: 0,
          input: execution.context,
          error: error.message,
        });

        if (action.onFailure) {
          currentActionId = action.onFailure;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: WorkflowAction, context: Record<string, any>): Promise<Record<string, any>> {
    // Replace template variables in config
    const config = this.replaceVariables(action.config, context);

    switch (action.type) {
      case 'email':
        return this.executeEmailAction(config);
      case 'slack':
        return this.executeSlackAction(config);
      case 'teams':
        return this.executeTeamsAction(config);
      case 'webhook':
        return this.executeWebhookAction(config);
      case 'notification':
        return this.executeNotificationAction(config);
      case 'incident-create':
        return this.executeIncidentCreateAction(config);
      default:
        return { success: true };
    }
  }

  /**
   * Execute email action
   */
  private async executeEmailAction(config: any): Promise<Record<string, any>> {
    // In production, integrate with email service
    console.log('Sending email:', config);
    return { success: true, messageId: this.generateId() };
  }

  /**
   * Execute Slack action
   */
  private async executeSlackAction(config: any): Promise<Record<string, any>> {
    // In production, integrate with Slack API
    console.log('Sending Slack message:', config);
    return { success: true, messageId: this.generateId() };
  }

  /**
   * Execute Teams action
   */
  private async executeTeamsAction(config: any): Promise<Record<string, any>> {
    // In production, integrate with Teams API
    console.log('Sending Teams message:', config);
    return { success: true, messageId: this.generateId() };
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(config: any): Promise<Record<string, any>> {
    // In production, call webhook with retry logic
    console.log('Calling webhook:', config);
    return { success: true, webhookId: config.webhookId };
  }

  /**
   * Execute notification action
   */
  private async executeNotificationAction(config: any): Promise<Record<string, any>> {
    console.log('Creating notification:', config);
    return { success: true, notificationId: this.generateId() };
  }

  /**
   * Execute incident creation action
   */
  private async executeIncidentCreateAction(config: any): Promise<Record<string, any>> {
    console.log('Creating incident:', config);
    return { success: true, incidentId: this.generateId() };
  }

  /**
   * Evaluate conditional branches
   */
  private evaluateConditionals(
    conditionals: ConditionalBranch[],
    context: Record<string, any>
  ): string | null {
    for (const branch of conditionals) {
      if (this.evaluateCondition(branch.condition, context)) {
        return branch.thenActionId;
      }
    }
    return null;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: any, context: Record<string, any>): boolean {
    const value = this.getContextValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'greaterThan':
        return Number(value) > Number(condition.value);
      case 'lessThan':
        return Number(value) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Get value from nested context
   */
  private getContextValue(path: string, context: Record<string, any>): any {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }

  /**
   * Replace variables in config
   */
  private replaceVariables(config: any, context: Record<string, any>): any {
    const json = JSON.stringify(config);
    const replaced = json.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = this.getContextValue(key, context);
      return value !== undefined ? JSON.stringify(value) : match;
    });
    return JSON.parse(replaced);
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * List executions for a workflow
   */
  listExecutions(workflowId: string, limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Pause execution
   */
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;
    execution.status = 'paused';
    return true;
  }

  /**
   * Resume execution
   */
  async resumeExecution(executionId: string): Promise<WorkflowExecution | null> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') return null;

    execution.status = 'running';
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return null;

    try {
      await this.executeActions(workflow, execution);
      execution.status = 'success';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
    }

    return execution;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default WorkflowEngine;
