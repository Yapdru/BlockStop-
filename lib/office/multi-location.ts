/**
 * BlockStop OFFICE Tier - Multi-Location Support
 * Multi-office/location management with regional compliance requirements
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MultiLocationConfig,
  OfficeLocationConfig,
  DataResidencyRule,
  DataClassification,
  ComplianceFramework,
} from '@/types/office-tier';

export class MultiLocationManager {
  private configs: Map<string, MultiLocationConfig> = new Map();
  private locations: Map<string, OfficeLocationConfig> = new Map();
  private dataResidencyRules: Map<string, DataResidencyRule[]> = new Map();
  private locationTeamMappings: Map<string, string[]> = new Map();

  /**
   * Create multi-location configuration
   */
  public createMultiLocationConfig(
    organizationId: string,
    primaryLocationId: string
  ): MultiLocationConfig {
    const config: MultiLocationConfig = {
      id: `mloc-${uuidv4()}`,
      organizationId,
      locations: [],
      primaryLocation: primaryLocationId,
      dataResidencyRules: [],
      syncEnabled: false,
    };

    this.configs.set(config.id, config);
    this.dataResidencyRules.set(config.id, []);

    return config;
  }

  /**
   * Get multi-location configuration
   */
  public getConfig(organizationId: string): MultiLocationConfig | null {
    for (const config of this.configs.values()) {
      if (config.organizationId === organizationId) {
        return config;
      }
    }
    return null;
  }

  /**
   * Add location to configuration
   */
  public addLocation(
    configId: string,
    location: Omit<OfficeLocationConfig, 'id'>
  ): OfficeLocationConfig {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    const newLocation: OfficeLocationConfig = {
      ...location,
      id: `loc-${uuidv4()}`,
    };

    this.locations.set(newLocation.id, newLocation);
    config.locations.push(newLocation);

    // Initialize team mapping
    this.locationTeamMappings.set(newLocation.id, []);

    return newLocation;
  }

  /**
   * Get location by ID
   */
  public getLocation(locationId: string): OfficeLocationConfig | null {
    return this.locations.get(locationId) || null;
  }

  /**
   * Update location
   */
  public updateLocation(locationId: string, updates: Partial<OfficeLocationConfig>): void {
    const location = this.locations.get(locationId);
    if (!location) {
      throw new Error(`Location ${locationId} not found`);
    }

    Object.assign(location, updates);
  }

  /**
   * Remove location
   */
  public removeLocation(configId: string, locationId: string): void {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    config.locations = config.locations.filter((l) => l.id !== locationId);
    this.locations.delete(locationId);
    this.locationTeamMappings.delete(locationId);
  }

  /**
   * Add data residency rule
   */
  public addDataResidencyRule(
    configId: string,
    rule: DataResidencyRule
  ): void {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    config.dataResidencyRules.push(rule);
    this.dataResidencyRules.set(configId, config.dataResidencyRules);
  }

  /**
   * Get data residency rules
   */
  public getDataResidencyRules(configId: string): DataResidencyRule[] {
    return this.dataResidencyRules.get(configId) || [];
  }

  /**
   * Validate data residency compliance
   */
  public validateDataResidency(
    configId: string,
    dataType: DataClassification,
    targetRegion: string
  ): { compliant: boolean; reason?: string } {
    const rules = this.getDataResidencyRules(configId);
    const rule = rules.find((r) => r.dataType === dataType);

    if (!rule) {
      return { compliant: true }; // No restriction
    }

    if (!rule.allowedRegions.includes(targetRegion)) {
      return {
        compliant: false,
        reason: `${dataType} data cannot be transferred to ${targetRegion}`,
      };
    }

    if (rule.encryptionRequired) {
      return { compliant: true }; // Encryption check would be done separately
    }

    return { compliant: true };
  }

  /**
   * Assign team to location
   */
  public assignTeamToLocation(locationId: string, teamId: string): void {
    let teams = this.locationTeamMappings.get(locationId);
    if (!teams) {
      teams = [];
      this.locationTeamMappings.set(locationId, teams);
    }

    if (!teams.includes(teamId)) {
      teams.push(teamId);
    }
  }

  /**
   * Remove team from location
   */
  public removeTeamFromLocation(locationId: string, teamId: string): void {
    const teams = this.locationTeamMappings.get(locationId);
    if (teams) {
      const index = teams.indexOf(teamId);
      if (index > -1) {
        teams.splice(index, 1);
      }
    }
  }

  /**
   * Get teams at location
   */
  public getLocationTeams(locationId: string): string[] {
    return this.locationTeamMappings.get(locationId) || [];
  }

  /**
   * Synchronize data across locations
   */
  public async syncAcrossLocations(
    configId: string,
    dataType: 'policies' | 'configurations' | 'alerts'
  ): Promise<{ success: boolean; syncedLocations: number; failedLocations: number }> {
    const config = this.configs.get(configId);
    if (!config) {
      return { success: false, syncedLocations: 0, failedLocations: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const location of config.locations) {
      try {
        // Simulate sync operation
        await this.performSync(location.id, dataType);
        synced++;
      } catch (error) {
        failed++;
      }
    }

    return { success: failed === 0, syncedLocations: synced, failedLocations: failed };
  }

  /**
   * Perform sync for a location
   */
  private async performSync(locationId: string, dataType: string): Promise<void> {
    // Simulate network call
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Get location compliance status
   */
  public getLocationComplianceStatus(
    locationId: string
  ): {
    location: OfficeLocationConfig | null;
    requiredFrameworks: ComplianceFramework[];
    complianceScores: Record<ComplianceFramework, number>;
    risksIdentified: string[];
  } {
    const location = this.getLocation(locationId);
    if (!location) {
      return {
        location: null,
        requiredFrameworks: [],
        complianceScores: {},
        risksIdentified: [],
      };
    }

    const risks: string[] = [];

    // Risk assessment based on location type and risk level
    if (location.riskLevel === 'high') {
      risks.push('High-risk location requires enhanced monitoring');
    }

    if (location.complianceRequirements.includes('HIPAA')) {
      risks.push('Healthcare data requires HIPAA compliance controls');
    }

    if (location.riskLevel === 'high' && location.complianceRequirements.length > 2) {
      risks.push('Complex compliance requirements in high-risk region');
    }

    return {
      location,
      requiredFrameworks: location.complianceRequirements,
      complianceScores: this.calculateComplianceScores(location),
      risksIdentified: risks,
    };
  }

  /**
   * Calculate compliance scores for location
   */
  private calculateComplianceScores(
    location: OfficeLocationConfig
  ): Record<ComplianceFramework, number> {
    const scores: Record<ComplianceFramework, number> = {
      HIPAA: 0,
      SOC2: 0,
      ISO27001: 0,
      GDPR: 0,
    };

    // Base score on risk level
    const riskScoreMap = { low: 85, medium: 70, high: 55 };
    const baseScore = riskScoreMap[location.riskLevel];

    for (const framework of location.complianceRequirements) {
      scores[framework] = baseScore;
    }

    return scores;
  }

  /**
   * Generate location report
   */
  public generateLocationReport(locationId: string): string {
    const location = this.getLocation(locationId);
    if (!location) {
      return 'Location not found';
    }

    const complianceStatus = this.getLocationComplianceStatus(locationId);
    const teams = this.getLocationTeams(locationId);

    const report = `
Location Report: ${location.name}
${'='.repeat(40)}

Basic Information:
- Type: ${location.type}
- Region: ${location.region}
- Timezone: ${location.timezone}
- Primary Contact: ${location.primaryContact}
- Risk Level: ${location.riskLevel}

Teams:
${teams.length > 0 ? teams.map((t) => `- ${t}`).join('\n') : '- No teams assigned'}

Compliance Requirements:
${location.complianceRequirements.map((f) => `- ${f}: ${complianceStatus.complianceScores[f as ComplianceFramework]}%`).join('\n')}

Identified Risks:
${complianceStatus.risksIdentified.map((r) => `- ${r}`).join('\n')}
    `;

    return report;
  }

  /**
   * Get multi-location metrics
   */
  public getMultiLocationMetrics(configId: string): {
    totalLocations: number;
    locationBreakdown: Record<string, number>;
    complianceStatus: Record<string, number>;
    dataResidencyCompliance: number;
    syncHealth: Record<string, string>;
  } {
    const config = this.configs.get(configId);
    if (!config) {
      return {
        totalLocations: 0,
        locationBreakdown: {},
        complianceStatus: {},
        dataResidencyCompliance: 100,
        syncHealth: {},
      };
    }

    const locationBreakdown: Record<string, number> = {};
    const complianceStatus: Record<string, number> = {};
    const syncHealth: Record<string, string> = {};

    for (const location of config.locations) {
      locationBreakdown[location.type] = (locationBreakdown[location.type] || 0) + 1;

      const compliance = this.getLocationComplianceStatus(location.id);
      complianceStatus[location.name] = Object.values(
        compliance.complianceScores
      ).reduce((a, b) => a + b, 0) / Object.keys(compliance.complianceScores).length;

      syncHealth[location.name] = 'healthy'; // Simplified
    }

    return {
      totalLocations: config.locations.length,
      locationBreakdown,
      complianceStatus,
      dataResidencyCompliance: 98, // Simplified
      syncHealth,
    };
  }

  /**
   * Enable cross-location sync
   */
  public enableCrossLocationSync(configId: string): void {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    config.syncEnabled = true;
  }

  /**
   * Disable cross-location sync
   */
  public disableCrossLocationSync(configId: string): void {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Config ${configId} not found`);
    }

    config.syncEnabled = false;
  }

  /**
   * Get replication schedule for location
   */
  public getReplicationSchedule(locationId: string): {
    frequency: 'hourly' | 'daily' | 'weekly';
    nextSync: Date;
    estimatedDuration: number;
    bandwidth: string;
  } {
    const location = this.getLocation(locationId);
    if (!location) {
      return {
        frequency: 'daily',
        nextSync: new Date(),
        estimatedDuration: 60,
        bandwidth: 'Variable',
      };
    }

    const frequencyMap: Record<string, 'hourly' | 'daily' | 'weekly'> = {
      primary: 'hourly',
      secondary: 'daily',
      regional: 'weekly',
    };

    return {
      frequency: frequencyMap[location.type] || 'daily',
      nextSync: new Date(Date.now() + 3600 * 1000),
      estimatedDuration: location.type === 'primary' ? 30 : 60,
      bandwidth: location.type === 'primary' ? '100 Mbps' : '50 Mbps',
    };
  }

  /**
   * Validate location configuration
   */
  public validateLocationConfig(locationId: string): {
    valid: boolean;
    errors: string[];
  } {
    const location = this.getLocation(locationId);
    const errors: string[] = [];

    if (!location) {
      return { valid: false, errors: ['Location not found'] };
    }

    if (!location.name || location.name.trim().length === 0) {
      errors.push('Location name is required');
    }

    if (!location.region || location.region.trim().length === 0) {
      errors.push('Region is required');
    }

    if (!location.primaryContact || location.primaryContact.trim().length === 0) {
      errors.push('Primary contact is required');
    }

    if (location.complianceRequirements.length === 0) {
      errors.push('At least one compliance requirement must be specified');
    }

    return { valid: errors.length === 0, errors };
  }
}
