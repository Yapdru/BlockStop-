import { Procedure, ProcedureStep } from './types';
import { ERROR_MESSAGES } from './constants';
import { v4 as uuidv4 } from 'uuid';

export class ProcedureLibrary {
  private procedures: Map<string, Procedure> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private fullTextIndex: Map<string, Set<string>> = new Map();

  async createProcedure(procedure: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Procedure> {
    const id = uuidv4();
    const now = new Date();

    const newProcedure: Procedure = {
      ...procedure,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.procedures.set(id, newProcedure);
    this.indexProcedure(id, newProcedure);

    return newProcedure;
  }

  async updateProcedure(id: string, updates: Partial<Procedure>): Promise<Procedure> {
    const procedure = this.procedures.get(id);
    if (!procedure) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updated: Procedure = {
      ...procedure,
      ...updates,
      id: procedure.id,
      createdAt: procedure.createdAt,
      updatedAt: new Date(),
      version: procedure.version + 1,
    };

    this.procedures.set(id, updated);
    this.reindexProcedure(id, updated);

    return updated;
  }

  async getProcedure(id: string): Promise<Procedure | null> {
    return this.procedures.get(id) || null;
  }

  async deleteProcedure(id: string): Promise<boolean> {
    const removed = this.procedures.delete(id);
    if (removed) {
      this.unindexProcedure(id);
    }
    return removed;
  }

  async listByCategory(category: string, subCategory?: string): Promise<Procedure[]> {
    const procedureIds = this.categoryIndex.get(category) || new Set();

    let procedures = Array.from(procedureIds)
      .map(id => this.procedures.get(id))
      .filter((p): p is Procedure => p !== undefined);

    if (subCategory) {
      procedures = procedures.filter(p => p.subCategory === subCategory);
    }

    return procedures.sort((a, b) => a.title.localeCompare(b.title));
  }

  async searchProcedures(query: string, limit: number = 50): Promise<Procedure[]> {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const matches: { id: string; score: number }[] = [];

    this.procedures.forEach((proc, id) => {
      let score = 0;

      queryTerms.forEach(term => {
        if (proc.title.toLowerCase().includes(term)) score += 10;
        if (proc.description.toLowerCase().includes(term)) score += 5;
        if (proc.steps.some(s => s.title.toLowerCase().includes(term))) score += 3;
      });

      if (score > 0) {
        matches.push({ id, score });
      }
    });

    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => this.procedures.get(m.id)!)
      .filter((p): p is Procedure => p !== undefined);
  }

  async addStep(procedureId: string, step: ProcedureStep): Promise<Procedure> {
    const procedure = this.procedures.get(procedureId);
    if (!procedure) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    procedure.steps.push(step);
    procedure.steps.sort((a, b) => a.order - b.order);

    return this.updateProcedure(procedureId, procedure);
  }

  async updateStep(procedureId: string, stepId: string, updates: Partial<ProcedureStep>): Promise<Procedure> {
    const procedure = this.procedures.get(procedureId);
    if (!procedure) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const stepIndex = procedure.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) throw new Error('Step not found');

    procedure.steps[stepIndex] = {
      ...procedure.steps[stepIndex],
      ...updates,
      id: procedure.steps[stepIndex].id,
    };

    return this.updateProcedure(procedureId, procedure);
  }

  async removeStep(procedureId: string, stepId: string): Promise<Procedure> {
    const procedure = this.procedures.get(procedureId);
    if (!procedure) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    procedure.steps = procedure.steps.filter(s => s.id !== stepId);

    return this.updateProcedure(procedureId, procedure);
  }

  async reorderSteps(procedureId: string, stepOrder: { id: string; order: number }[]): Promise<Procedure> {
    const procedure = this.procedures.get(procedureId);
    if (!procedure) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const stepMap = new Map(procedure.steps.map(s => [s.id, s]));

    procedure.steps = stepOrder
      .map(item => {
        const step = stepMap.get(item.id);
        if (step) {
          step.order = item.order;
        }
        return step;
      })
      .filter((s): s is ProcedureStep => s !== undefined);

    procedure.steps.sort((a, b) => a.order - b.order);

    return this.updateProcedure(procedureId, procedure);
  }

  async getCategoriesList(): Promise<string[]> {
    return Array.from(this.categoryIndex.keys()).sort();
  }

  async getSubCategories(category: string): Promise<string[]> {
    const procedures = await this.listByCategory(category);
    const subCategories = new Set(procedures.map(p => p.subCategory).filter(Boolean) as string[]);
    return Array.from(subCategories).sort();
  }

  async duplicateProcedure(sourceId: string, newTitle: string): Promise<Procedure> {
    const source = this.procedures.get(sourceId);
    if (!source) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const newProcedure = await this.createProcedure({
      title: newTitle,
      description: source.description,
      steps: source.steps.map(s => ({ ...s, id: uuidv4() })),
      category: source.category,
      subCategory: source.subCategory,
      estimatedTime: source.estimatedTime,
      owner: source.owner,
    });

    return newProcedure;
  }

  async validateProcedure(procedureId: string): Promise<{ valid: boolean; errors: string[] }> {
    const procedure = this.procedures.get(procedureId);
    if (!procedure) return { valid: false, errors: [ERROR_MESSAGES.DOCUMENT_NOT_FOUND] };

    const errors: string[] = [];

    if (!procedure.title || procedure.title.trim() === '') {
      errors.push('Procedure must have a title');
    }

    if (!procedure.steps || procedure.steps.length === 0) {
      errors.push('Procedure must have at least one step');
    }

    procedure.steps.forEach((step, idx) => {
      if (!step.title || step.title.trim() === '') {
        errors.push(`Step ${idx + 1} must have a title`);
      }
      if (!step.action || step.action.trim() === '') {
        errors.push(`Step ${idx + 1} must have an action`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  private indexProcedure(id: string, procedure: Procedure): void {
    const catSet = this.categoryIndex.get(procedure.category) || new Set();
    catSet.add(id);
    this.categoryIndex.set(procedure.category, catSet);

    const terms = this.extractTerms(procedure.title + ' ' + procedure.description);
    terms.forEach(term => {
      const termSet = this.fullTextIndex.get(term) || new Set();
      termSet.add(id);
      this.fullTextIndex.set(term, termSet);
    });
  }

  private reindexProcedure(id: string, procedure: Procedure): void {
    this.unindexProcedure(id);
    this.indexProcedure(id, procedure);
  }

  private unindexProcedure(id: string): void {
    const procedure = this.procedures.get(id);
    if (!procedure) return;

    const catSet = this.categoryIndex.get(procedure.category);
    if (catSet) {
      catSet.delete(id);
    }

    this.fullTextIndex.forEach(set => set.delete(id));
  }

  private extractTerms(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(term => term.length > 2);
  }

  getStats(): { totalProcedures: number; byCategory: Record<string, number> } {
    const byCategory: Record<string, number> = {};

    this.procedures.forEach(proc => {
      byCategory[proc.category] = (byCategory[proc.category] || 0) + 1;
    });

    return {
      totalProcedures: this.procedures.size,
      byCategory,
    };
  }
}
