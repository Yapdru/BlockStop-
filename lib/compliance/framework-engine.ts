/**
 * BlockStop Phase 17 - Compliance Framework Engine
 * Core engine for managing multi-framework compliance across SOC2, ISO27001, HIPAA, PCI-DSS, GDPR, NIST
 */

import {
  ComplianceFramework,
  ComplianceFrameworkType,
  ComplianceControl,
  ComplianceScore,
  CategoryScore,
  ControlStatus,
  FrameworkRegistry,
  FrameworkComparison,
  ControlMapping,
  CoverageMatrix,
  ComplianceConfiguration,
} from './types/compliance-types';

export class ComplianceFrameworkEngine {
  private frameworks: Map<ComplianceFrameworkType, ComplianceFramework> = new Map();
  private controlRegistry: Map<string, ComplianceControl> = new Map();
  private organizationFrameworks: Map<string, ComplianceFrameworkType[]> = new Map();
  private configuration: ComplianceConfiguration;

  constructor(organizationId: string) {
    this.configuration = {
      organizationId,
      configId: `config-${Date.now()}`,
      enabledFrameworks: [],
      complianceOfficer: '',
      auditCommittee: [],
      controlOwners: new Map(),
      auditingPolicy: {
        internalAuditFrequency: 'ANNUAL',
        externalAuditRequired: false,
      },
      escalationRules: [],
      notificationRules: [],
      complianceThreshold: 80,
      criticalFindingResponseTime: 24,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Register a framework in the engine
   */
  public registerFramework(framework: ComplianceFramework): void {
    this.registry.frameworks.set(framework.type, framework);
    this.registry.totalFrameworks = this.registry.frameworks.size;
    this.registry.totalControls += framework.totalControls;
    this.registry.lastUpdated = new Date();

    // Index controls
    for (const control of framework.controls) {
      this.controlIndex.set(control.id, control);
    }

    // Track version
    if (!this.frameworkVersions.has(framework.type)) {
      this.frameworkVersions.set(framework.type, []);
    }
    this.frameworkVersions.get(framework.type)!.push(framework.version);
  }

  /**
   * Load a framework by type
   */
  public loadFramework(frameworkType: ComplianceFrameworkType): ComplianceFramework | null {
    return this.registry.frameworks.get(frameworkType) || null;
  }

  /**
   * Get all registered frameworks
   */
  public getFrameworks(): ComplianceFramework[] {
    return Array.from(this.registry.frameworks.values());
  }

  /**
   * Get enabled frameworks for organization
   */
  public getEnabledFrameworks(): ComplianceFramework[] {
    return this.configuration.enabledFrameworks
      .map(type => this.registry.frameworks.get(type))
      .filter((fw): fw is ComplianceFramework => fw !== undefined);
  }

  /**
   * Enable a framework for the organization
   */
  public enableFramework(frameworkType: ComplianceFrameworkType): boolean {
    if (!this.registry.frameworks.has(frameworkType)) {
      return false;
    }

    if (!this.configuration.enabledFrameworks.includes(frameworkType)) {
      this.configuration.enabledFrameworks.push(frameworkType);
      this.registry.enabledFrameworks.push(frameworkType);
      this.configuration.updatedAt = new Date();
    }

    return true;
  }

  /**
   * Disable a framework for the organization
   */
  public disableFramework(frameworkType: ComplianceFrameworkType): void {
    this.configuration.enabledFrameworks = this.configuration.enabledFrameworks.filter(
      type => type !== frameworkType
    );
    this.registry.enabledFrameworks = this.registry.enabledFrameworks.filter(
      type => type !== frameworkType
    );
    this.configuration.updatedAt = new Date();
  }

  /**
   * Get a specific control from the registry
   */
  public getControl(controlId: string): ComplianceControl | null {
    return this.controlIndex.get(controlId) || null;
  }

  /**
   * Get controls by category
   */
  public getControlsByCategory(
    frameworkType: ComplianceFrameworkType,
    category: string
  ): ComplianceControl[] {
    const framework = this.registry.frameworks.get(frameworkType);
    if (!framework) return [];

    return framework.controls.filter(control => control.category === category);
  }

  /**
   * Get controls by severity level
   */
  public getControlsBySeverity(
    frameworkType: ComplianceFrameworkType,
    severity: string
  ): ComplianceControl[] {
    const framework = this.registry.frameworks.get(frameworkType);
    if (!framework) return [];

    return framework.controls.filter(control => control.severity === severity);
  }

  /**
   * Get version history for a framework
   */
  public getFrameworkVersions(frameworkType: ComplianceFrameworkType): string[] {
    return this.frameworkVersions.get(frameworkType) || [];
  }

  /**
   * Update framework version
   */
  public updateFrameworkVersion(
    frameworkType: ComplianceFrameworkType,
    newVersion: string
  ): boolean {
    const framework = this.registry.frameworks.get(frameworkType);
    if (!framework) return false;

    const oldVersion = framework.version;
    framework.version = newVersion;
    framework.updatedAt = new Date();

    this.registry.lastUpdated = new Date();

    // Append to version history
    const versions = this.frameworkVersions.get(frameworkType);
    if (versions && !versions.includes(newVersion)) {
      versions.push(newVersion);
    }

    return true;
  }

  /**
   * Compare two frameworks for alignment and coverage
   */
  public compareFrameworks(
    type1: ComplianceFrameworkType,
    type2: ComplianceFrameworkType
  ): FrameworkComparison | null {
    const fw1 = this.registry.frameworks.get(type1);
    const fw2 = this.registry.frameworks.get(type2);

    if (!fw1 || !fw2) return null;

    const mappings = this.buildControlMappings(fw1, fw2);
    const coverage = this.buildCoverageMatrix(mappings);

    const uniqueControls = new Set(
      fw1.controls.map(c => c.id).concat(fw2.controls.map(c => c.id))
    ).size;

    const overlapCount = mappings.filter(m => m.alignmentLevel !== 'NOT_ALIGNED').length;
    const overlapPercentage = (overlapCount / uniqueControls) * 100;

    return {
      frameworks: [type1, type2],
      comparisonDate: new Date(),
      controlMappings: mappings,
      totalUniqueControls: uniqueControls,
      overlapPercentage: Math.round(overlapPercentage),
      frameworkSpecificControls: this.getFrameworkSpecificControls(fw1, fw2),
      coverageMatrix: coverage,
      recommendations: this.generateComparisonRecommendations(fw1, fw2, mappings),
    };
  }

  /**
   * Build control mappings between two frameworks
   */
  private buildControlMappings(fw1: ComplianceFramework, fw2: ComplianceFramework): ControlMapping[] {
    const mappings: ControlMapping[] = [];

    for (const control1 of fw1.controls) {
      for (const control2 of fw2.controls) {
        const alignment = this.calculateControlAlignment(control1, control2);

        if (alignment.level !== 'NOT_ALIGNED') {
          mappings.push({
            controlId1: control1.id,
            frameworkId1: fw1.type,
            controlId2: control2.id,
            frameworkId2: fw2.type,
            alignmentLevel: alignment.level,
            alignmentDescription: alignment.description,
            mappingStrength: alignment.strength,
            mappedBy: 'SYSTEM',
            mappingDate: new Date(),
          });
        }
      }
    }

    return mappings;
  }

  /**
   * Calculate alignment between two controls
   */
  private calculateControlAlignment(
    control1: ComplianceControl,
    control2: ComplianceControl
  ): {
    level: string;
    description: string;
    strength: number;
  } {
    let strength = 0;

    // Check category match
    if (control1.category === control2.category) {
      strength += 30;
    }

    // Check severity match
    if (control1.severity === control2.severity) {
      strength += 20;
    }

    // Check objective overlap
    const obj1 = control1.objective.toLowerCase();
    const obj2 = control2.objective.toLowerCase();
    const commonWords = obj1.split(' ').filter(word => obj2.includes(word)).length;
    if (commonWords > 2) {
      strength += 30;
    }

    // Check scope overlap
    const scopeOverlap = control1.scope.filter(s => control2.scope.includes(s)).length;
    if (scopeOverlap > 0) {
      strength += 20;
    }

    let level = 'NOT_ALIGNED';
    if (strength >= 70) {
      level = 'ALIGNED';
    } else if (strength >= 50) {
      level = 'PARTIALLY_ALIGNED';
    } else if (strength >= 30) {
      level = 'LOOSELY_RELATED';
    }

    return {
      level,
      description: `Alignment score: ${strength}/100 based on category, severity, objective, and scope analysis`,
      strength,
    };
  }

  /**
   * Build coverage matrix for two frameworks
   */
  private buildCoverageMatrix(mappings: ControlMapping[]): CoverageMatrix {
    const rows = [...new Set(mappings.map(m => m.controlId1))];
    const columns = [...new Set(mappings.map(m => m.controlId2))];

    const data: number[][] = Array(rows.length)
      .fill(null)
      .map(() => Array(columns.length).fill(0));

    for (const mapping of mappings) {
      const rowIdx = rows.indexOf(mapping.controlId1);
      const colIdx = columns.indexOf(mapping.controlId2);
      if (rowIdx !== -1 && colIdx !== -1) {
        data[rowIdx][colIdx] = mapping.mappingStrength;
      }
    }

    return { rows, columns, data };
  }

  /**
   * Get framework-specific controls
   */
  private getFrameworkSpecificControls(
    fw1: ComplianceFramework,
    fw2: ComplianceFramework
  ): Map<ComplianceFrameworkType, string[]> {
    const fw1Ids = new Set(fw1.controls.map(c => c.controlNumber));
    const fw2Ids = new Set(fw2.controls.map(c => c.controlNumber));

    const fw1Specific = fw1.controls
      .filter(c => !fw2Ids.has(c.controlNumber))
      .map(c => c.id);
    const fw2Specific = fw2.controls
      .filter(c => !fw1Ids.has(c.controlNumber))
      .map(c => c.id);

    return new Map([
      [fw1.type, fw1Specific],
      [fw2.type, fw2Specific],
    ]);
  }

  /**
   * Generate comparison recommendations
   */
  private generateComparisonRecommendations(
    fw1: ComplianceFramework,
    fw2: ComplianceFramework,
    mappings: ControlMapping[]
  ): string[] {
    const recommendations: string[] = [];

    const alignedMappings = mappings.filter(m => m.alignmentLevel === 'ALIGNED');
    if (alignedMappings.length / mappings.length > 0.8) {
      recommendations.push(
        `High alignment (${Math.round((alignedMappings.length / mappings.length) * 100)}%) between ${fw1.type} and ${fw2.type}. Consolidated compliance approach recommended.`
      );
    } else {
      recommendations.push(
        `Consider implementing complementary control strategies for ${fw1.type} and ${fw2.type} due to low overlap.`
      );
    }

    const criticalFw1 = fw1.controls.filter(c => c.severity === 'CRITICAL');
    const criticalFw2 = fw2.controls.filter(c => c.severity === 'CRITICAL');
    recommendations.push(
      `Prioritize ${Math.max(criticalFw1.length, criticalFw2.length)} critical controls across frameworks.`
    );

    return recommendations;
  }

  /**
   * Get configuration
   */
  public getConfiguration(): ComplianceConfiguration {
    return this.configuration;
  }

  /**
   * Update configuration
   */
  public updateConfiguration(updates: Partial<ComplianceConfiguration>): void {
    this.configuration = { ...this.configuration, ...updates };
    this.configuration.updatedAt = new Date();
  }

  /**
   * Set control owner
   */
  public setControlOwner(controlId: string, owner: string): boolean {
    if (!this.controlIndex.has(controlId)) {
      return false;
    }

    this.configuration.controlOwners.set(controlId, owner);
    this.configuration.updatedAt = new Date();
    return true;
  }

  /**
   * Get control owner
   */
  public getControlOwner(controlId: string): string | undefined {
    return this.configuration.controlOwners.get(controlId);
  }

  /**
   * Get registry summary
   */
  public getRegistrySummary(): {
    totalFrameworks: number;
    totalControls: number;
    enabledFrameworks: string[];
    lastUpdated: Date;
  } {
    return {
      totalFrameworks: this.registry.totalFrameworks,
      totalControls: this.registry.totalControls,
      enabledFrameworks: this.configuration.enabledFrameworks,
      lastUpdated: this.registry.lastUpdated,
    };
  }

  /**
   * Export registry state
   */
  public exportRegistry(): string {
    const frameworks = Array.from(this.registry.frameworks.values());
    return JSON.stringify(
      {
        registryId: this.registry.registryId,
        frameworks: frameworks.map(fw => ({
          ...fw,
          controlMapping: Array.from(fw.controlMapping.entries()),
        })),
        configuration: {
          ...this.configuration,
          controlOwners: Array.from(this.configuration.controlOwners.entries()),
        },
      },
      null,
      2
    );
  }
}

export class FrameworkLoader {
  /**
   * Dynamically load a framework module
   */
  static async loadFrameworkModule(frameworkType: ComplianceFrameworkType): Promise<any> {
    const moduleMap: Record<ComplianceFrameworkType, string> = {
      [ComplianceFrameworkType.SOC2]: './frameworks/soc2-framework',
      [ComplianceFrameworkType.ISO27001]: './frameworks/iso27001-framework',
      [ComplianceFrameworkType.HIPAA]: './frameworks/hipaa-framework',
      [ComplianceFrameworkType.PCIДSS]: './frameworks/pci-dss-framework',
      [ComplianceFrameworkType.GDPR]: './frameworks/gdpr-framework',
      [ComplianceFrameworkType.NIST]: './frameworks/nist-framework',
    };

    try {
      const modulePath = moduleMap[frameworkType];
      return await import(modulePath);
    } catch (error) {
      throw new Error(`Failed to load framework module for ${frameworkType}: ${error}`);
    }
  }

  /**
   * Load all frameworks
   */
  static async loadAllFrameworks(): Promise<ComplianceFramework[]> {
    const frameworks: ComplianceFramework[] = [];

    for (const frameworkType of Object.values(ComplianceFrameworkType)) {
      try {
        const frameworkModule = await this.loadFrameworkModule(frameworkType as ComplianceFrameworkType);
        const frameworkFactory = frameworkModule.default || frameworkModule.createFramework;
        if (frameworkFactory) {
          const framework = frameworkFactory();
          frameworks.push(framework);
        }
      } catch (error) {
        console.warn(`Could not load framework ${frameworkType}:`, error);
      }
    }

    return frameworks;
  }
}
