/**
 * Onboarding Engine
 * Orchestrates customer onboarding flow
 */

export type OnboardingPhase = 'account-setup' | 'integration' | 'configuration' | 'training' | 'go-live' | 'completed';

export type ChecklistItemStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  phase: OnboardingPhase;
  dueDate?: Date;
  completedDate?: Date;
  status: ChecklistItemStatus;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  dependencies: string[];
}

export interface OnboardingPlan {
  customerId: string;
  planId: string;
  createdAt: Date;
  startDate: Date;
  targetCompletionDate: Date;
  currentPhase: OnboardingPhase;
  completionPercentage: number;
  checklist: Map<string, ChecklistItem>;
  dedicatedCSE?: string;
  lastUpdated: Date;
  status: 'active' | 'paused' | 'completed';
}

export interface OnboardingMetrics {
  customerId: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  overdueItems: number;
  completionRate: number;
  estimatedDaysToCompletion: number;
}

export class OnboardingEngine {
  private onboardingPlans: Map<string, OnboardingPlan> = new Map();

  /**
   * Create new onboarding plan
   */
  createOnboardingPlan(customerId: string, dedicatedCSE?: string): OnboardingPlan {
    const planId = `onb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const targetCompletion = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const plan: OnboardingPlan = {
      customerId,
      planId,
      createdAt: now,
      startDate: now,
      targetCompletionDate: targetCompletion,
      currentPhase: 'account-setup',
      completionPercentage: 0,
      checklist: new Map(),
      dedicatedCSE,
      lastUpdated: now,
      status: 'active',
    };

    // Initialize default checklist
    this.initializeChecklist(plan);

    this.onboardingPlans.set(planId, plan);
    return plan;
  }

  /**
   * Get onboarding plan
   */
  getOnboardingPlan(customerId: string): OnboardingPlan | undefined {
    return Array.from(this.onboardingPlans.values()).find((p) => p.customerId === customerId && p.status !== 'completed');
  }

  /**
   * Complete a checklist item
   */
  completeChecklistItem(planId: string, itemId: string): ChecklistItem {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    const item = plan.checklist.get(itemId);
    if (!item) throw new Error('Checklist item not found');

    item.status = 'completed';
    item.completedDate = new Date();

    this.updatePlanProgress(plan);

    return item;
  }

  /**
   * Update checklist item status
   */
  updateChecklistItemStatus(planId: string, itemId: string, status: ChecklistItemStatus): ChecklistItem {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    const item = plan.checklist.get(itemId);
    if (!item) throw new Error('Checklist item not found');

    item.status = status;
    if (status === 'completed') {
      item.completedDate = new Date();
    }

    this.updatePlanProgress(plan);

    return item;
  }

  /**
   * Move to next phase
   */
  advancePhase(planId: string): OnboardingPlan {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    const phases: OnboardingPhase[] = ['account-setup', 'integration', 'configuration', 'training', 'go-live', 'completed'];
    const currentIndex = phases.indexOf(plan.currentPhase);

    if (currentIndex < phases.length - 1) {
      plan.currentPhase = phases[currentIndex + 1];
      plan.lastUpdated = new Date();

      if (plan.currentPhase === 'completed') {
        plan.status = 'completed';
      }
    }

    return plan;
  }

  /**
   * Get onboarding metrics
   */
  getOnboardingMetrics(planId: string): OnboardingMetrics {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    const items = Array.from(plan.checklist.values());
    const completed = items.filter((i) => i.status === 'completed').length;
    const inProgress = items.filter((i) => i.status === 'in-progress').length;

    const now = new Date();
    const overdue = items.filter(
      (i) => i.dueDate && i.dueDate < now && (i.status === 'not-started' || i.status === 'in-progress')
    ).length;

    const completionRate = items.length > 0 ? (completed / items.length) * 100 : 0;

    // Estimate days to completion based on completion rate and target date
    const daysUntilTarget = Math.ceil((plan.targetCompletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      customerId: plan.customerId,
      totalItems: items.length,
      completedItems: completed,
      inProgressItems: inProgress,
      overdueItems: overdue,
      completionRate,
      estimatedDaysToCompletion: daysUntilTarget,
    };
  }

  /**
   * Get checklist items by phase
   */
  getChecklistItemsByPhase(planId: string, phase: OnboardingPhase): ChecklistItem[] {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) return [];

    return Array.from(plan.checklist.values()).filter((item) => item.phase === phase);
  }

  /**
   * Assign CSE to plan
   */
  assignCSE(planId: string, cseId: string): OnboardingPlan {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    plan.dedicatedCSE = cseId;
    plan.lastUpdated = new Date();

    return plan;
  }

  /**
   * Pause onboarding
   */
  pauseOnboarding(planId: string): OnboardingPlan {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    plan.status = 'paused';
    plan.lastUpdated = new Date();

    return plan;
  }

  /**
   * Resume onboarding
   */
  resumeOnboarding(planId: string): OnboardingPlan {
    const plan = this.onboardingPlans.get(planId);
    if (!plan) throw new Error('Onboarding plan not found');

    if (plan.status === 'paused') {
      plan.status = 'active';
      plan.lastUpdated = new Date();
    }

    return plan;
  }

  /**
   * Initialize default onboarding checklist
   */
  private initializeChecklist(plan: OnboardingPlan): void {
    const baseDate = plan.startDate;

    const items: ChecklistItem[] = [
      // Account Setup (Day 1)
      {
        id: 'account-setup-1',
        title: 'Complete Profile Setup',
        description: 'Fill in company information and team details',
        phase: 'account-setup',
        dueDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1,
        dependencies: [],
      },
      {
        id: 'account-setup-2',
        title: 'Invite Team Members',
        description: 'Add team members and assign roles',
        phase: 'account-setup',
        dueDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 0.5,
        dependencies: ['account-setup-1'],
      },
      {
        id: 'account-setup-3',
        title: 'Configure SSO',
        description: 'Set up single sign-on if applicable',
        phase: 'account-setup',
        dueDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'medium',
        estimatedHours: 1,
        dependencies: [],
      },
      {
        id: 'account-setup-4',
        title: 'Generate API Keys',
        description: 'Create API keys for integrations',
        phase: 'account-setup',
        dueDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 0.25,
        dependencies: ['account-setup-1'],
      },

      // Integration Setup (Days 2-3)
      {
        id: 'integration-1',
        title: 'Email Connector Setup',
        description: 'Connect email provider for notifications',
        phase: 'integration',
        dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1,
        dependencies: ['account-setup-4'],
      },
      {
        id: 'integration-2',
        title: 'File Storage Integration',
        description: 'Connect cloud storage for scan results',
        phase: 'integration',
        dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1.5,
        dependencies: ['account-setup-4'],
      },
      {
        id: 'integration-3',
        title: 'SIEM Connection',
        description: 'Configure SIEM integration if applicable',
        phase: 'integration',
        dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'medium',
        estimatedHours: 2,
        dependencies: ['account-setup-4'],
      },
      {
        id: 'integration-4',
        title: 'Threat Intelligence Feeds',
        description: 'Enable threat intelligence data sources',
        phase: 'integration',
        dueDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'medium',
        estimatedHours: 1,
        dependencies: ['integration-1'],
      },

      // Configuration (Days 4-5)
      {
        id: 'config-1',
        title: 'Configure Scanning Policies',
        description: 'Set up scanning policies and schedules',
        phase: 'configuration',
        dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 2,
        dependencies: ['integration-2'],
      },
      {
        id: 'config-2',
        title: 'Set Detection Rules',
        description: 'Configure detection rules for threats',
        phase: 'configuration',
        dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1.5,
        dependencies: ['config-1'],
      },
      {
        id: 'config-3',
        title: 'Configure Alerts',
        description: 'Set up alert settings and thresholds',
        phase: 'configuration',
        dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1,
        dependencies: ['config-1'],
      },
      {
        id: 'config-4',
        title: 'Setup Escalation Workflows',
        description: 'Configure incident escalation processes',
        phase: 'configuration',
        dueDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'medium',
        estimatedHours: 1.5,
        dependencies: ['config-3'],
      },

      // Training (Day 6)
      {
        id: 'training-1',
        title: 'Admin Training',
        description: 'Training for administrators',
        phase: 'training',
        dueDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 2,
        dependencies: ['config-4'],
      },
      {
        id: 'training-2',
        title: 'Analyst Training',
        description: 'Training for security analysts',
        phase: 'training',
        dueDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 2,
        dependencies: ['config-4'],
      },
      {
        id: 'training-3',
        title: 'Best Practices Review',
        description: 'Review security best practices',
        phase: 'training',
        dueDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'medium',
        estimatedHours: 1,
        dependencies: ['training-1', 'training-2'],
      },

      // Go-Live (Day 7)
      {
        id: 'golive-1',
        title: 'Execute First Scans',
        description: 'Run initial scans of your environment',
        phase: 'go-live',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1,
        dependencies: ['training-3'],
      },
      {
        id: 'golive-2',
        title: 'Review Initial Alerts',
        description: 'Review and validate initial security alerts',
        phase: 'go-live',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 2,
        dependencies: ['golive-1'],
      },
      {
        id: 'golive-3',
        title: 'Team Validation',
        description: 'Get team sign-off on setup',
        phase: 'go-live',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'high',
        estimatedHours: 1,
        dependencies: ['golive-2'],
      },
      {
        id: 'golive-4',
        title: 'Success Celebration',
        description: 'Mark onboarding completion',
        phase: 'go-live',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'not-started',
        priority: 'low',
        estimatedHours: 0,
        dependencies: ['golive-3'],
      },
    ];

    for (const item of items) {
      plan.checklist.set(item.id, item);
    }
  }

  /**
   * Update plan progress
   */
  private updatePlanProgress(plan: OnboardingPlan): void {
    const items = Array.from(plan.checklist.values());
    const completed = items.filter((i) => i.status === 'completed').length;
    plan.completionPercentage = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
    plan.lastUpdated = new Date();
  }
}

export const onboardingEngine = new OnboardingEngine();
