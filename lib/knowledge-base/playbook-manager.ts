import { Playbook, PlaybookStep, PlaybookExecution, ExecutionStep, ExecutionError } from './types';
import { KB_EXECUTION_STATUS, KB_STEP_STATUS, ERROR_MESSAGES, KB_CONFIG } from './constants';
import { v4 as uuidv4 } from 'uuid';

export class PlaybookManager {
  private playbooks: Map<string, Playbook> = new Map();
  private executions: Map<string, PlaybookExecution> = new Map();
  private executionHistory: PlaybookExecution[] = [];

  async createPlaybook(playbook: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Playbook> {
    const id = uuidv4();
    const now = new Date();

    const newPlaybook: Playbook = {
      ...playbook,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.playbooks.set(id, newPlaybook);
    return newPlaybook;
  }

  async updatePlaybook(id: string, updates: Partial<Playbook>): Promise<Playbook> {
    const playbook = this.playbooks.get(id);
    if (!playbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updated: Playbook = {
      ...playbook,
      ...updates,
      id: playbook.id,
      createdAt: playbook.createdAt,
      updatedAt: new Date(),
      version: playbook.version + 1,
    };

    this.playbooks.set(id, updated);
    return updated;
  }

  async getPlaybook(id: string): Promise<Playbook | null> {
    return this.playbooks.get(id) || null;
  }

  async validatePlaybook(playbookId: string): Promise<{ valid: boolean; errors: string[] }> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) return { valid: false, errors: [ERROR_MESSAGES.DOCUMENT_NOT_FOUND] };

    const errors: string[] = [];

    if (!playbook.steps || playbook.steps.length === 0) {
      errors.push('Playbook must have at least one step');
    }

    if (!playbook.successCriteria || playbook.successCriteria.length === 0) {
      errors.push('Playbook must define success criteria');
    }

    playbook.steps.forEach((step, index) => {
      if (!step.verification) {
        errors.push(`Step ${index + 1} must have verification instructions`);
      }
      if (step.estimatedTime <= 0) {
        errors.push(`Step ${index + 1} must have valid estimated time`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async executePlaybook(
    playbookId: string,
    executedBy: string,
    parameters?: Record<string, any>
  ): Promise<PlaybookExecution> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const validation = await this.validatePlaybook(playbookId);
    if (!validation.valid) {
      throw new Error(`Playbook validation failed: ${validation.errors.join(', ')}`);
    }

    const execution: PlaybookExecution = {
      id: uuidv4(),
      playbookId,
      startedAt: new Date(),
      executedBy,
      status: KB_EXECUTION_STATUS.RUNNING,
      currentStep: 0,
      results: [],
      errors: [],
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  async executeStep(executionId: string, stepIndex: number, output: string): Promise<ExecutionStep> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    const playbook = this.playbooks.get(execution.playbookId);
    if (!playbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const step = playbook.steps[stepIndex];
    if (!step) throw new Error('Step not found');

    const startTime = new Date();
    const executionStep: ExecutionStep = {
      stepId: step.id,
      status: KB_STEP_STATUS.COMPLETED,
      startedAt: startTime,
      completedAt: new Date(),
      output,
      duration: new Date().getTime() - startTime.getTime(),
    };

    execution.results.push(executionStep);
    execution.currentStep = stepIndex + 1;

    return executionStep;
  }

  async completeExecution(executionId: string, success: boolean): Promise<PlaybookExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.completedAt = new Date();
    execution.status = success ? KB_EXECUTION_STATUS.COMPLETED : KB_EXECUTION_STATUS.FAILED;

    this.executionHistory.push(execution);
    this.executions.delete(executionId);

    return execution;
  }

  async pauseExecution(executionId: string): Promise<PlaybookExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.status = KB_EXECUTION_STATUS.PAUSED;
    return execution;
  }

  async resumeExecution(executionId: string): Promise<PlaybookExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.status = KB_EXECUTION_STATUS.RUNNING;
    return execution;
  }

  async addStepError(
    executionId: string,
    stepId: string,
    message: string,
    severity: 'warning' | 'error' | 'critical'
  ): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error('Execution not found');

    const error: ExecutionError = {
      stepId,
      message,
      timestamp: new Date(),
      severity,
    };

    execution.errors.push(error);
  }

  async getExecution(id: string): Promise<PlaybookExecution | null> {
    return this.executions.get(id) || null;
  }

  async getExecutionHistory(playbookId: string, limit: number = 50): Promise<PlaybookExecution[]> {
    return this.executionHistory
      .filter(e => e.playbookId === playbookId)
      .slice(-limit)
      .reverse();
  }

  async getPlaybookStats(playbookId: string): Promise<{
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    lastExecuted?: Date;
  }> {
    const history = await this.getExecutionHistory(playbookId, 100);

    const successful = history.filter(e => e.status === KB_EXECUTION_STATUS.COMPLETED).length;
    const durations = history
      .filter(e => e.completedAt)
      .map(e => e.completedAt!.getTime() - e.startedAt.getTime());

    return {
      totalExecutions: history.length,
      successRate: history.length > 0 ? (successful / history.length) * 100 : 0,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      lastExecuted: history[0]?.startedAt,
    };
  }

  async listPlaybooks(category?: string): Promise<Playbook[]> {
    let playbooks = Array.from(this.playbooks.values());

    if (category) {
      playbooks = playbooks.filter(p => p.category === category);
    }

    return playbooks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async addRelatedPlaybook(playbookId: string, relatedId: string): Promise<void> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    if (!playbook.relatedPlaybooks.includes(relatedId)) {
      playbook.relatedPlaybooks.push(relatedId);
    }
  }

  async getRelatedPlaybooks(playbookId: string): Promise<Playbook[]> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) return [];

    return playbook.relatedPlaybooks
      .map(id => this.playbooks.get(id))
      .filter((p): p is Playbook => p !== undefined);
  }
}
