/**
 * Control Registry - Central registry for all compliance controls across frameworks
 * Manages control definitions, mappings, and version control
 */

import {
  ComplianceControl,
  ComplianceFrameworkType,
  FrameworkReference,
} from '../types/compliance-types';

export class ControlRegistry {
  private controls: Map<string, ComplianceControl> = new Map();
  private frameworkIndex: Map<
    ComplianceFrameworkType,
    Set<string>
  > = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private relatedControlsIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Initialize all framework indexes
   */
  private initializeIndexes(): void {
    Object.values(ComplianceFrameworkType).forEach((framework) => {
      this.frameworkIndex.set(framework, new Set());
    });
  }

  /**
   * Register a control in the registry
   */
  registerControl(control: ComplianceControl): void {
    this.controls.set(control.id, control);

    // Index by framework
    control.frameworkReferences.forEach((ref) => {
      const set = this.frameworkIndex.get(ref.framework) || new Set();
      set.add(control.id);
      this.frameworkIndex.set(ref.framework, set);
    });

    // Index by category
    const catSet = this.categoryIndex.get(control.category) || new Set();
    catSet.add(control.id);
    this.categoryIndex.set(control.category, catSet);

    // Index related controls
    if (!this.relatedControlsIndex.has(control.id)) {
      this.relatedControlsIndex.set(control.id, new Set());
    }
    control.relatedControls.forEach((relatedId) => {
      const relSet = this.relatedControlsIndex.get(control.id) || new Set();
      relSet.add(relatedId);
      this.relatedControlsIndex.set(control.id, relSet);
    });
  }

  /**
   * Get control by ID
   */
  getControl(controlId: string): ComplianceControl | null {
    return this.controls.get(controlId) || null;
  }

  /**
   * Get all controls for a framework
   */
  getControlsByFramework(
    frameworkType: ComplianceFrameworkType
  ): ComplianceControl[] {
    const controlIds = this.frameworkIndex.get(frameworkType) || new Set();
    return Array.from(controlIds)
      .map((id) => this.controls.get(id))
      .filter((c) => c !== undefined) as ComplianceControl[];
  }

  /**
   * Get controls by category
   */
  getControlsByCategory(category: string): ComplianceControl[] {
    const controlIds = this.categoryIndex.get(category) || new Set();
    return Array.from(controlIds)
      .map((id) => this.controls.get(id))
      .filter((c) => c !== undefined) as ComplianceControl[];
  }

  /**
   * Get related controls
   */
  getRelatedControls(controlId: string): ComplianceControl[] {
    const relatedIds = this.relatedControlsIndex.get(controlId) || new Set();
    return Array.from(relatedIds)
      .map((id) => this.controls.get(id))
      .filter((c) => c !== undefined) as ComplianceControl[];
  }

  /**
   * Find controls by keyword
   */
  searchControls(keyword: string): ComplianceControl[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.controls.values()).filter(
      (control) =>
        control.title.toLowerCase().includes(lowerKeyword) ||
        control.description.toLowerCase().includes(lowerKeyword) ||
        control.controlNumber.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get all controls
   */
  getAllControls(): ComplianceControl[] {
    return Array.from(this.controls.values());
  }

  /**
   * Get framework statistics
   */
  getFrameworkStats(frameworkType: ComplianceFrameworkType): {
    totalControls: number;
    byCategory: Map<string, number>;
    byStatus: Map<string, number>;
  } {
    const controls = this.getControlsByFramework(frameworkType);
    const byCategory = new Map<string, number>();
    const byStatus = new Map<string, number>();

    controls.forEach((control) => {
      const catCount = byCategory.get(control.category) || 0;
      byCategory.set(control.category, catCount + 1);
    });

    return {
      totalControls: controls.length,
      byCategory,
      byStatus,
    };
  }

  /**
   * Check if control exists
   */
  hasControl(controlId: string): boolean {
    return this.controls.has(controlId);
  }

  /**
   * Get total control count
   */
  getTotalControlCount(): number {
    return this.controls.size;
  }

  /**
   * Update control
   */
  updateControl(control: ComplianceControl): void {
    control.updatedAt = new Date();
    this.controls.set(control.id, control);
  }

  /**
   * Validate control dependencies
   */
  validateDependencies(controlId: string): {
    valid: boolean;
    missingDependencies: string[];
  } {
    const control = this.getControl(controlId);
    if (!control) {
      return { valid: false, missingDependencies: [controlId] };
    }

    const missingDependencies: string[] = [];
    control.dependencies.forEach((depId) => {
      if (!this.hasControl(depId)) {
        missingDependencies.push(depId);
      }
    });

    return {
      valid: missingDependencies.length === 0,
      missingDependencies,
    };
  }
}

export default new ControlRegistry();
