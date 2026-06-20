/**
 * Remediation Action Engine - Manages remediation actions, tracking, and prioritization
 */

import {
  RemediationAction,
  AuditFinding,
  ComplianceControl,
  SeverityLevel,
} from '../../compliance/types/compliance-types';

export interface RemediationPlan {
  planId: string;
  findingId: string;
  actions: RemediationAction[];
  startDate: Date;
  targetCompletionDate: Date;
  estimatedTotalCost: number;
  estimatedTotalEffort: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  ownerName: string;
  createdAt: Date;
  approvedBy?: string;
}

export class RemediationActionEngine {
  private actions: Map<string, RemediationAction> = new Map();
  private plans: Map<string, RemediationPlan> = new Map();
  private actionHistory: Map<string, RemediationAction[]> = new Map();
  private organizationActions: Map<string, Set<string>> = new Map();

  /**
   * Generate remediation actions from finding
   */
  generateActionsFromFinding(
    finding: AuditFinding,
    controls: Map<string, ComplianceControl>
  ): RemediationAction[] {
    const actions: RemediationAction[] = [];
    const control = controls.get(finding.controlId);

    if (!control) {
      return actions;
    }

    // Create investigation action
    actions.push({
      id: `action-${finding.id}-investigation`,
      findingId: finding.id,
      description: `Investigate root cause of ${control.title}`,
      action: `Conduct detailed investigation into the gap in ${control.controlNumber}`,
      expectedOutcome: 'Root cause identified and documented',
      assignedTo: '',
      assignedDate: new Date(),
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PLANNED',
      priority: this.getPriorityFromSeverity(finding.severity),
      estimatedEffort: '2-3 days',
      notes: `Finding: ${finding.description}`,
    });

    // Create remediation action
    actions.push({
      id: `action-${finding.id}-remediation`,
      findingId: finding.id,
      description: `Implement controls for ${control.title}`,
      action: control.implementationGuidance || 'Implement control per documentation',
      expectedOutcome: `${control.title} will be implemented and tested`,
      assignedTo: '',
      assignedDate: new Date(),
      targetDate: new Date(
        Date.now() +
          (finding.severity === 'CRITICAL' ? 30 : 60) * 24 * 60 * 60 * 1000
      ),
      status: 'PLANNED',
      priority: this.getPriorityFromSeverity(finding.severity),
      estimatedCost: finding.severity === 'CRITICAL' ? 5000 : 2000,
      estimatedEffort: control.implementationEffort,
      notes: 'Remediation implementation',
    });

    // Create testing action
    actions.push({
      id: `action-${finding.id}-testing`,
      findingId: finding.id,
      description: `Test and validate ${control.title}`,
      action: control.testingApproach || 'Perform testing per control requirements',
      expectedOutcome: `${control.title} testing completed and passed`,
      assignedTo: '',
      assignedDate: new Date(),
      targetDate: new Date(
        Date.now() +
          (finding.severity === 'CRITICAL' ? 45 : 75) * 24 * 60 * 60 * 1000
      ),
      status: 'PLANNED',
      priority: this.getPriorityFromSeverity(finding.severity),
      estimatedEffort: '3-5 days',
      notes: 'Testing phase',
    });

    return actions;
  }

  /**
   * Create remediation plan from actions
   */
  createRemediationPlan(
    findingId: string,
    actions: RemediationAction[],
    owner: string,
    organizationId: string
  ): RemediationPlan {
    const plan: RemediationPlan = {
      planId: `plan-${findingId}-${Date.now()}`,
      findingId,
      actions,
      startDate: new Date(),
      targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      estimatedTotalCost: actions.reduce((sum, a) => sum + (a.estimatedCost || 0), 0),
      estimatedTotalEffort: this.calculateTotalEffort(actions),
      status: 'PLANNED',
      ownerName: owner,
      createdAt: new Date(),
    };

    this.plans.set(plan.planId, plan);

    // Store all actions
    actions.forEach((action) => {
      this.actions.set(action.id, action);
      this.addToOrganizationActions(organizationId, action.id);
    });

    return plan;
  }

  /**
   * Assign action to user
   */
  assignAction(
    actionId: string,
    userId: string,
    targetDate?: Date
  ): RemediationAction | null {
    const action = this.actions.get(actionId);
    if (!action) {
      return null;
    }

    action.assignedTo = userId;
    action.assignedDate = new Date();
    if (targetDate) {
      action.targetDate = targetDate;
    }

    this.actions.set(actionId, action);
    this.recordHistory(actionId, action);

    return action;
  }

  /**
   * Update action status
   */
  updateActionStatus(
    actionId: string,
    status: RemediationAction['status'],
    evidence?: string
  ): RemediationAction | null {
    const action = this.actions.get(actionId);
    if (!action) {
      return null;
    }

    action.status = status;
    if (status === 'COMPLETED') {
      action.completionDate = new Date();
      action.completionEvidence = evidence;
    }

    this.actions.set(actionId, action);
    this.recordHistory(actionId, action);

    return action;
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): RemediationAction | null {
    return this.actions.get(actionId) || null;
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): RemediationPlan | null {
    return this.plans.get(planId) || null;
  }

  /**
   * Get actions for finding
   */
  getActionsForFinding(findingId: string): RemediationAction[] {
    return Array.from(this.actions.values()).filter(
      (a) => a.findingId === findingId
    );
  }

  /**
   * Get organization actions
   */
  getOrganizationActions(
    organizationId: string,
    status?: RemediationAction['status']
  ): RemediationAction[] {
    const actionIds = this.organizationActions.get(organizationId) || new Set();
    let actions = Array.from(actionIds)
      .map((id) => this.actions.get(id))
      .filter((a) => a !== undefined) as RemediationAction[];

    if (status) {
      actions = actions.filter((a) => a.status === status);
    }

    return actions;
  }

  /**
   * Get overdue actions
   */
  getOverdueActions(organizationId: string): RemediationAction[] {
    const actions = this.getOrganizationActions(organizationId);
    const now = new Date();

    return actions.filter(
      (a) =>
        a.targetDate < now &&
        (a.status === 'PLANNED' || a.status === 'IN_PROGRESS')
    );
  }

  /**
   * Get action progress
   */
  getActionProgress(planId: string): {
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    overdue: number;
    percentageComplete: number;
  } {
    const plan = this.plans.get(planId);
    if (!plan) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        planned: 0,
        overdue: 0,
        percentageComplete: 0,
      };
    }

    const now = new Date();
    let completed = 0;
    let inProgress = 0;
    let planned = 0;
    let overdue = 0;

    plan.actions.forEach((action) => {
      if (action.status === 'COMPLETED') {
        completed++;
      } else if (action.status === 'IN_PROGRESS') {
        inProgress++;
      } else if (action.status === 'PLANNED') {
        planned++;
      }

      if (action.targetDate < now && action.status !== 'COMPLETED') {
        overdue++;
      }
    });

    const percentageComplete = (completed / plan.actions.length) * 100;

    return {
      total: plan.actions.length,
      completed,
      inProgress,
      planned,
      overdue,
      percentageComplete,
    };
  }

  /**
   * Get remediation statistics
   */
  getRemediationStats(organizationId: string): {
    totalActions: number;
    completed: number;
    inProgress: number;
    planned: number;
    overdue: number;
    totalCost: number;
    averageCost: number;
  } {
    const actions = this.getOrganizationActions(organizationId);
    const now = new Date();

    let completed = 0;
    let inProgress = 0;
    let planned = 0;
    let overdue = 0;
    let totalCost = 0;

    actions.forEach((action) => {
      if (action.status === 'COMPLETED') {
        completed++;
      } else if (action.status === 'IN_PROGRESS') {
        inProgress++;
      } else if (action.status === 'PLANNED') {
        planned++;
      }

      if (action.targetDate < now && action.status !== 'COMPLETED') {
        overdue++;
      }

      totalCost += action.estimatedCost || 0;
    });

    return {
      totalActions: actions.length,
      completed,
      inProgress,
      planned,
      overdue,
      totalCost,
      averageCost: actions.length > 0 ? totalCost / actions.length : 0,
    };
  }

  /**
   * Get action history
   */
  getActionHistory(actionId: string): RemediationAction[] {
    return this.actionHistory.get(actionId) || [];
  }

  /**
   * Helper: Record action history
   */
  private recordHistory(actionId: string, action: RemediationAction): void {
    const history = this.actionHistory.get(actionId) || [];
    history.push({ ...action });
    this.actionHistory.set(actionId, history);
  }

  /**
   * Helper: Add to organization actions
   */
  private addToOrganizationActions(organizationId: string, actionId: string): void {
    const orgActions = this.organizationActions.get(organizationId) || new Set();
    orgActions.add(actionId);
    this.organizationActions.set(organizationId, orgActions);
  }

  /**
   * Helper: Get priority from severity
   */
  private getPriorityFromSeverity(
    severity: SeverityLevel
  ): RemediationAction['priority'] {
    switch (severity) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  /**
   * Helper: Calculate total effort
   */
  private calculateTotalEffort(actions: RemediationAction[]): string {
    const totalDays = actions.reduce((sum, a) => {
      const match = a.estimatedEffort?.match(/(\d+)/);
      return sum + (match ? parseInt(match[0]) : 3);
    }, 0);

    return `${totalDays} days`;
  }
}

export default new RemediationActionEngine();
