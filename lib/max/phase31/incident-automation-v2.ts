/**
 * MAX Phase 31.1 - Incident Automation V2
 * Smarter auto-remediation playbooks with approval workflows
 */

import {
  IncidentPlaybook,
  PlaybookStep,
  PlaybookTrigger,
  PlaybookExecution,
  StepExecution,
  ActionRecord,
  ActionType,
  TriggerType,
  AutomationLevel,
  ExecutionStatus,
  ApprovalStatus,
  SeverityLevel,
  ThreatType,
  StepCondition,
} from '@/types/max-phase31';

// ============================================================================
// INCIDENT AUTOMATION ENGINE V2
// ============================================================================

export class IncidentAutomationV2 {
  private playbooks: Map<string, IncidentPlaybook> = new Map();
  private executions: Map<string, PlaybookExecution> = new Map();
  private approvalQueue: Map<string, StepExecution[]> = new Map();

  /**
   * Create incident response playbook
   */
  createPlaybook(
    name: string,
    threatType: ThreatType,
    severity: SeverityLevel,
    steps: PlaybookStep[],
    triggers: PlaybookTrigger[]
  ): IncidentPlaybook {
    const playbook: IncidentPlaybook = {
      id: `playbook-${Date.now()}`,
      name,
      description: `Automated response for ${threatType} threats at ${severity} severity`,
      threatType,
      severity,
      steps: steps.sort((a, b) => a.order - b.order),
      triggers,
      enabled: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      successRate: 0,
    };

    this.playbooks.set(playbook.id, playbook);
    return playbook;
  }

  /**
   * Execute incident playbook
   */
  async executePlaybook(
    playbookId: string,
    incidentId: string
  ): Promise<PlaybookExecution> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    const execution: PlaybookExecution = {
      id: `exec-${incidentId}-${Date.now()}`,
      playbookId,
      incidentId,
      startTime: new Date(),
      status: ExecutionStatus.RUNNING,
      steps: [],
      actionsTaken: [],
      errors: [],
      metadata: {
        playbookVersion: playbook.version,
        severityLevel: playbook.severity,
      },
    };

    this.executions.set(execution.id, execution);

    // Execute steps sequentially
    for (const step of playbook.steps) {
      try {
        const stepExecution = await this.executeStep(
          step,
          execution,
          playbook
        );
        execution.steps.push(stepExecution);

        if (
          stepExecution.status === ExecutionStatus.FAILED ||
          stepExecution.status === ExecutionStatus.REJECTED
        ) {
          // Stop execution on failure
          execution.status = ExecutionStatus.FAILED;
          break;
        }
      } catch (error) {
        execution.errors.push({
          step: step.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          recoveryAttempts: 0,
        });
        execution.status = ExecutionStatus.FAILED;
        break;
      }
    }

    execution.endTime = new Date();
    if (execution.status !== ExecutionStatus.FAILED) {
      execution.status = ExecutionStatus.COMPLETED;
    }

    this.executions.set(execution.id, execution);
    return execution;
  }

  /**
   * Execute individual playbook step
   */
  private async executeStep(
    step: PlaybookStep,
    execution: PlaybookExecution,
    playbook: IncidentPlaybook
  ): Promise<StepExecution> {
    const stepExecution: StepExecution = {
      stepId: step.id,
      status: ExecutionStatus.PENDING,
      startTime: new Date(),
      output: {},
      approvalStatus: undefined,
    };

    // Check step conditions
    if (step.conditions && step.conditions.length > 0) {
      const conditionsMet = this.evaluateConditions(
        step.conditions,
        execution
      );
      if (!conditionsMet) {
        stepExecution.status = ExecutionStatus.COMPLETED;
        stepExecution.endTime = new Date();
        stepExecution.output = { skipped: true, reason: 'Conditions not met' };
        return stepExecution;
      }
    }

    // Check if approval is required
    if (step.requiresApproval) {
      stepExecution.status = ExecutionStatus.PENDING;
      stepExecution.approvalStatus = ApprovalStatus.PENDING;

      // Add to approval queue
      if (!this.approvalQueue.has(execution.incidentId)) {
        this.approvalQueue.set(execution.incidentId, []);
      }
      this.approvalQueue.get(execution.incidentId)!.push(stepExecution);

      // Wait for approval (in production, this would be async)
      const approved = await this.waitForApproval(step.id, 300000); // 5 minute timeout

      if (!approved) {
        stepExecution.status = ExecutionStatus.REJECTED;
        stepExecution.approvalStatus = ApprovalStatus.REJECTED;
        stepExecution.endTime = new Date();
        return stepExecution;
      }

      stepExecution.approvalStatus = ApprovalStatus.APPROVED;
    }

    // Execute the action
    stepExecution.status = ExecutionStatus.RUNNING;

    try {
      const actionResult = await this.executeAction(
        step.actionType,
        step.actionConfig
      );

      stepExecution.status = ExecutionStatus.COMPLETED;
      stepExecution.output = actionResult;

      // Record action
      const actionRecord: ActionRecord = {
        id: `action-${Date.now()}`,
        actionType: step.actionType,
        timestamp: new Date(),
        status: ExecutionStatus.COMPLETED,
        affectedResources: actionResult.affectedResources || [],
        result: actionResult,
        approvedBy: stepExecution.approvalStatus === ApprovalStatus.APPROVED
          ? 'auto-approved'
          : undefined,
      };

      execution.actionsTaken.push(actionRecord);
    } catch (error) {
      stepExecution.status = ExecutionStatus.FAILED;
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';

      // Attempt rollback if configured
      if (step.rollbackConfig) {
        try {
          await this.executeAction(
            this.getRollbackAction(step.actionType),
            step.rollbackConfig
          );
        } catch (rollbackError) {
          // Log rollback failure
          console.error('Rollback failed:', rollbackError);
        }
      }
    }

    stepExecution.endTime = new Date();
    return stepExecution;
  }

  /**
   * Execute remediation action
   */
  private async executeAction(
    actionType: ActionType,
    config: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Simulate different action types
    const handlers: Record<ActionType, () => Promise<Record<string, unknown>>> = {
      [ActionType.ISOLATE_HOST]: async () => ({
        hostId: config.hostId,
        isolated: true,
        networkInterfaces: 2,
        timestamp: new Date(),
      }),
      [ActionType.DISABLE_ACCOUNT]: async () => ({
        accountId: config.accountId,
        disabled: true,
        sessionsTerminated: 3,
        timestamp: new Date(),
      }),
      [ActionType.KILL_PROCESS]: async () => ({
        processId: config.processId,
        processName: config.processName,
        killed: true,
        childProcessesKilled: 5,
        timestamp: new Date(),
      }),
      [ActionType.BLOCK_IP]: async () => ({
        ipAddress: config.ipAddress,
        blocked: true,
        fireRuleId: `rule-${Date.now()}`,
        affectedResources: ['fw-1', 'fw-2'],
        timestamp: new Date(),
      }),
      [ActionType.BLOCK_DOMAIN]: async () => ({
        domain: config.domain,
        blocked: true,
        dnsRuleId: `rule-${Date.now()}`,
        affectedResources: ['dns-1', 'dns-2'],
        timestamp: new Date(),
      }),
      [ActionType.REVOKE_TOKEN]: async () => ({
        tokenId: config.tokenId,
        revoked: true,
        sessionsInvalidated: 1,
        timestamp: new Date(),
      }),
      [ActionType.RESET_CREDENTIALS]: async () => ({
        userId: config.userId,
        credentialsReset: true,
        newPasswordSet: true,
        mfaReset: true,
        timestamp: new Date(),
      }),
      [ActionType.NOTIFY_TEAM]: async () => ({
        recipients: config.recipients,
        notified: true,
        sentAt: new Date(),
        channels: ['email', 'slack'],
      }),
      [ActionType.CREATE_TICKET]: async () => ({
        ticketId: `TICKET-${Date.now()}`,
        created: true,
        severity: config.severity,
        assignedTo: 'security_team',
        timestamp: new Date(),
      }),
      [ActionType.COLLECT_FORENSICS]: async () => ({
        forensicsJobId: `forensics-${Date.now()}`,
        started: true,
        memoryCapture: true,
        diskCapture: true,
        networkCapture: true,
        estimatedDuration: 3600,
        timestamp: new Date(),
      }),
      [ActionType.SNAPSHOT_VM]: async () => ({
        vmId: config.vmId,
        snapshotId: `snapshot-${Date.now()}`,
        created: true,
        snapshotSize: 50,
        timestamp: new Date(),
      }),
      [ActionType.ENABLE_MONITORING]: async () => ({
        assetId: config.assetId,
        monitoring: true,
        monitoringLevel: 'detailed',
        agents: 3,
        timestamp: new Date(),
      }),
      [ActionType.TRIGGER_RESPONSE]: async () => ({
        responsePlanId: config.responsePlanId,
        triggered: true,
        teamNotified: true,
        incidentCommander: 'assigned',
        timestamp: new Date(),
      }),
      [ActionType.QUARANTINE_EMAIL]: async () => ({
        emailId: config.emailId,
        quarantined: true,
        attachmentCount: 2,
        recipientCount: 50,
        timestamp: new Date(),
      }),
      [ActionType.BLOCK_EXTERNAL_COMMS]: async () => ({
        assetId: config.assetId,
        externalCommsBlocked: true,
        internalCommsAllowed: true,
        affectedResources: ['host-1', 'host-2'],
        timestamp: new Date(),
      }),
    };

    const handler = handlers[actionType];
    if (!handler) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    return await handler();
  }

  /**
   * Get rollback action for remediation
   */
  private getRollbackAction(actionType: ActionType): ActionType {
    const rollbackMap: Record<ActionType, ActionType> = {
      [ActionType.ISOLATE_HOST]: ActionType.ISOLATE_HOST, // TODO: Implement de-isolation
      [ActionType.DISABLE_ACCOUNT]: ActionType.DISABLE_ACCOUNT, // TODO: Implement re-enable
      [ActionType.KILL_PROCESS]: ActionType.KILL_PROCESS, // Processes can't be rolled back
      [ActionType.BLOCK_IP]: ActionType.BLOCK_IP, // TODO: Implement unblock
      [ActionType.BLOCK_DOMAIN]: ActionType.BLOCK_DOMAIN, // TODO: Implement unblock
      [ActionType.REVOKE_TOKEN]: ActionType.REVOKE_TOKEN, // Tokens can't be rolled back
      [ActionType.RESET_CREDENTIALS]: ActionType.RESET_CREDENTIALS, // Credentials can't be rolled back
      [ActionType.NOTIFY_TEAM]: ActionType.NOTIFY_TEAM, // Notifications can't be rolled back
      [ActionType.CREATE_TICKET]: ActionType.CREATE_TICKET, // Tickets can't be rolled back
      [ActionType.COLLECT_FORENSICS]: ActionType.COLLECT_FORENSICS, // Forensics can't be rolled back
      [ActionType.SNAPSHOT_VM]: ActionType.SNAPSHOT_VM, // Snapshots can't be rolled back
      [ActionType.ENABLE_MONITORING]: ActionType.ENABLE_MONITORING, // TODO: Implement disable
      [ActionType.TRIGGER_RESPONSE]: ActionType.TRIGGER_RESPONSE, // Plans can't be unrolled back
      [ActionType.QUARANTINE_EMAIL]: ActionType.QUARANTINE_EMAIL, // TODO: Implement release
      [ActionType.BLOCK_EXTERNAL_COMMS]: ActionType.BLOCK_EXTERNAL_COMMS, // TODO: Implement allow
    };

    return rollbackMap[actionType] || actionType;
  }

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(
    conditions: StepCondition[],
    execution: PlaybookExecution
  ): boolean {
    for (const condition of conditions) {
      const contextValue = this.getContextValue(condition.field, execution);

      if (!this.evaluateCondition(contextValue, condition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get value from execution context
   */
  private getContextValue(
    field: string,
    execution: PlaybookExecution
  ): unknown {
    if (field.startsWith('metadata.')) {
      const key = field.substring(9);
      return execution.metadata[key];
    }

    if (field === 'severity') {
      return execution.metadata.severityLevel;
    }

    return null;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    value: unknown,
    condition: StepCondition
  ): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'in':
        return (condition.value as unknown[]).includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value as string);
      default:
        return true;
    }
  }

  /**
   * Wait for approval
   */
  private async waitForApproval(
    stepId: string,
    timeoutMs: number
  ): Promise<boolean> {
    // Simulate approval waiting
    // In production, this would wait for user approval
    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false); // Timeout = rejection
      }, timeoutMs);

      // Check approval queue periodically
      const checkInterval = setInterval(() => {
        // Simulate auto-approval for demo
        if (Math.random() > 0.5) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 1000);
    });
  }

  /**
   * Approve pending step
   */
  approvePendingStep(
    incidentId: string,
    stepId: string,
    approver: string
  ): boolean {
    const queue = this.approvalQueue.get(incidentId) || [];
    const index = queue.findIndex((s) => s.stepId === stepId);

    if (index >= 0) {
      queue[index].approvalStatus = ApprovalStatus.APPROVED;
      return true;
    }

    return false;
  }

  /**
   * Reject pending step
   */
  rejectPendingStep(
    incidentId: string,
    stepId: string,
    approver: string,
    reason: string
  ): boolean {
    const queue = this.approvalQueue.get(incidentId) || [];
    const index = queue.findIndex((s) => s.stepId === stepId);

    if (index >= 0) {
      queue[index].approvalStatus = ApprovalStatus.REJECTED;
      return true;
    }

    return false;
  }

  /**
   * Get pending approvals for incident
   */
  getPendingApprovals(incidentId: string): StepExecution[] {
    return this.approvalQueue
      .get(incidentId)
      ?.filter((s) => s.approvalStatus === ApprovalStatus.PENDING) || [];
  }

  /**
   * Get playbook by threat type
   */
  getPlaybookForThreat(
    threatType: ThreatType,
    severity: SeverityLevel
  ): IncidentPlaybook | undefined {
    for (const [, playbook] of this.playbooks) {
      if (playbook.threatType === threatType && playbook.severity === severity) {
        return playbook;
      }
    }
    return undefined;
  }

  /**
   * Get execution details
   */
  getExecution(executionId: string): PlaybookExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for incident
   */
  getIncidentExecutions(incidentId: string): PlaybookExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.incidentId === incidentId
    );
  }

  /**
   * Get playbook
   */
  getPlaybook(playbookId: string): IncidentPlaybook | undefined {
    return this.playbooks.get(playbookId);
  }

  /**
   * List all playbooks
   */
  listPlaybooks(): IncidentPlaybook[] {
    return Array.from(this.playbooks.values());
  }
}

export default IncidentAutomationV2;
