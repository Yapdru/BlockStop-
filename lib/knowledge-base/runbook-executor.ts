import { Runbook, RunbookScript, RunbookTrigger } from './types';
import { ERROR_MESSAGES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export interface RunbookExecution {
  id: string;
  runbookId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  output: string;
  errors: string[];
  retryCount: number;
}

export class RunbookExecutor {
  private runbooks: Map<string, Runbook> = new Map();
  private executions: Map<string, RunbookExecution> = new Map();
  private scriptResults: Map<string, any> = new Map();

  async registerRunbook(runbook: Omit<Runbook, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Runbook> {
    const id = uuidv4();
    const now = new Date();

    const newRunbook: Runbook = {
      ...runbook,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.runbooks.set(id, newRunbook);
    return newRunbook;
  }

  async executeRunbook(runbookId: string, timeout: number = 60000): Promise<RunbookExecution> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const execution: RunbookExecution = {
      id: uuidv4(),
      runbookId,
      startedAt: new Date(),
      status: 'running',
      output: '',
      errors: [],
      retryCount: 0,
    };

    this.executions.set(execution.id, execution);

    try {
      for (const script of runbook.scripts) {
        await this.executeScript(execution, script);
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.errors.push((error as Error).message);
      execution.status = 'failed';
      execution.completedAt = new Date();

      if (execution.retryCount < runbook.maxRetries) {
        execution.retryCount++;
        return this.executeRunbook(runbookId, timeout);
      }
    }

    return execution;
  }

  private async executeScript(execution: RunbookExecution, script: RunbookScript): Promise<any> {
    try {
      let result;

      switch (script.language) {
        case 'bash':
          result = await this.executeBashScript(script.content);
          break;
        case 'python':
          result = await this.executePythonScript(script.content);
          break;
        case 'javascript':
          result = await this.executeJavaScriptScript(script.content);
          break;
        case 'go':
          result = await this.executeGoScript(script.content);
          break;
        default:
          throw new Error(`Unsupported script language: ${script.language}`);
      }

      execution.output += `\n[${script.name}] ${JSON.stringify(result)}`;
      this.scriptResults.set(script.id, result);

      return result;
    } catch (error) {
      const message = `Script execution failed: ${script.name} - ${(error as Error).message}`;
      execution.errors.push(message);
      throw error;
    }
  }

  async executeScriptDirect(language: string, content: string): Promise<any> {
    switch (language) {
      case 'bash':
        return this.executeBashScript(content);
      case 'python':
        return this.executePythonScript(content);
      case 'javascript':
        return this.executeJavaScriptScript(content);
      case 'go':
        return this.executeGoScript(content);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private async executeBashScript(script: string): Promise<any> {
    // Simulated execution - in production would use child_process.exec
    return { language: 'bash', output: `Executed: ${script.substring(0, 50)}...` };
  }

  private async executePythonScript(script: string): Promise<any> {
    // Simulated execution
    return { language: 'python', output: `Executed: ${script.substring(0, 50)}...` };
  }

  private async executeJavaScriptScript(script: string): Promise<any> {
    // Simulated execution - in production would use vm or similar
    return { language: 'javascript', output: `Executed: ${script.substring(0, 50)}...` };
  }

  private async executeGoScript(script: string): Promise<any> {
    // Simulated execution
    return { language: 'go', output: `Executed: ${script.substring(0, 50)}...` };
  }

  async getExecution(id: string): Promise<RunbookExecution | null> {
    return this.executions.get(id) || null;
  }

  async getRunbook(id: string): Promise<Runbook | null> {
    return this.runbooks.get(id) || null;
  }

  async updateRunbook(id: string, updates: Partial<Runbook>): Promise<Runbook> {
    const runbook = this.runbooks.get(id);
    if (!runbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updated: Runbook = {
      ...runbook,
      ...updates,
      id: runbook.id,
      createdAt: runbook.createdAt,
      updatedAt: new Date(),
      version: runbook.version + 1,
    };

    this.runbooks.set(id, updated);
    return updated;
  }

  async validateRunbook(runbookId: string): Promise<{ valid: boolean; errors: string[] }> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) return { valid: false, errors: [ERROR_MESSAGES.DOCUMENT_NOT_FOUND] };

    const errors: string[] = [];

    if (!runbook.scripts || runbook.scripts.length === 0) {
      errors.push('Runbook must have at least one script');
    }

    if (runbook.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }

    if (runbook.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    runbook.scripts.forEach((script, idx) => {
      if (!script.content || script.content.trim() === '') {
        errors.push(`Script ${idx + 1} has empty content`);
      }
      if (!script.language) {
        errors.push(`Script ${idx + 1} missing language specification`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  async addScript(runbookId: string, script: RunbookScript): Promise<Runbook> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    runbook.scripts.push(script);
    return this.updateRunbook(runbookId, runbook);
  }

  async removeScript(runbookId: string, scriptId: string): Promise<Runbook> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    runbook.scripts = runbook.scripts.filter(s => s.id !== scriptId);
    return this.updateRunbook(runbookId, runbook);
  }

  async setTrigger(runbookId: string, trigger: RunbookTrigger): Promise<Runbook> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const existingIndex = runbook.triggers.findIndex(t => t.id === trigger.id);
    if (existingIndex >= 0) {
      runbook.triggers[existingIndex] = trigger;
    } else {
      runbook.triggers.push(trigger);
    }

    return this.updateRunbook(runbookId, runbook);
  }

  async listRunbooks(automationLevel?: string): Promise<Runbook[]> {
    let runbooks = Array.from(this.runbooks.values());

    if (automationLevel) {
      runbooks = runbooks.filter(r => r.automationLevel === automationLevel);
    }

    return runbooks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
