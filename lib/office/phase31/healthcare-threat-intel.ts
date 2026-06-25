/**
 * Healthcare Threat Intelligence - Ransomware targeting healthcare, compliance threats
 * Focuses on healthcare-specific threat landscape and attack patterns
 */

import {
  HealthcareThreatIntel,
  HealthcareThreatType,
  ThreatSeverity,
  IOC,
  MitigationStrategy,
  AttackStep,
  TelemetryData,
  ThreatIntelligenceReport,
} from '@/types/office-phase31';

/**
 * Healthcare Threat Intelligence Manager
 * Tracks healthcare-specific threats and provides threat intelligence
 */
export class HealthcareThreatIntelligenceManager {
  private threats: HealthcareThreatIntel[] = [];
  private iocDatabase: Map<string, IOC> = new Map();
  private activeCampaigns: Map<string, HealthcareThreatIntel> = new Map();

  constructor() {
    this.initializeCommonThreats();
  }

  /**
   * Register a healthcare threat
   */
  public registerThreat(
    threatName: string,
    threatType: HealthcareThreatType,
    severity: ThreatSeverity,
    discoveryData: any
  ): HealthcareThreatIntel {
    const threat: HealthcareThreatIntel = {
      id: `threat-${Date.now()}`,
      threatId: `threat-id-${Math.random().toString(36).substring(2, 9)}`,
      threatName,
      threatType,
      severity,
      targetedIndustries: ['healthcare', 'hospital_systems', 'medical_devices'],
      targetedOrganizations: discoveryData.targetedOrganizations || [],
      discoveryDate: new Date(),
      lastUpdated: new Date(),
      indicators: [],
      mitigationStrategies: [],
      relatedThreats: [],
      vulnerabilitiesExploited: discoveryData.vulnerabilities || [],
      attackChain: [],
      telemetry: [],
      intelligence: [],
    };

    this.threats.push(threat);

    if (severity === 'critical' || severity === 'high') {
      this.activeCampaigns.set(threat.id, threat);
    }

    return threat;
  }

  /**
   * Add indicators of compromise (IOCs)
   */
  public addIOC(
    threatId: string,
    iocType: 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file_name',
    value: string,
    context: string,
    sources: string[]
  ): IOC {
    const ioc: IOC = {
      id: `ioc-${Date.now()}`,
      type: iocType,
      value,
      context,
      firstSeen: new Date(),
      lastSeen: new Date(),
      sources,
      confidence: 85,
      status: 'active',
    };

    this.iocDatabase.set(value, ioc);

    const threat = this.threats.find((t) => t.id === threatId);
    if (threat) {
      threat.indicators.push(ioc);
    }

    return ioc;
  }

  /**
   * Register ransomware campaign
   */
  public registerRansomwareCampaign(
    operatorName: string,
    targetedCountries: string[],
    targetedSystems: string[]
  ): HealthcareThreatIntel {
    const threat = this.registerThreat(
      `${operatorName} Ransomware Campaign`,
      'ransomware',
      'critical',
      {
        targetedOrganizations: targetedCountries,
        vulnerabilities: this.getCommonRansomwareVulnerabilities(),
      }
    );

    // Add typical ransomware IOCs
    this.addIOC(threat.id, 'domain', `c2.${operatorName.toLowerCase()}.com`, 'Command and Control', [
      'malware_analysis_report',
    ]);

    // Build attack chain
    threat.attackChain = [
      {
        order: 1,
        technique: 'Initial Access',
        mitreTacticId: 'TA0001',
        mitreTechnique: 'T1189 - Drive-by Compromise',
        description: 'Compromised medical device software or supply chain delivery',
        detectability: 'low',
        preventionMethod: 'Email security, web filtering, supply chain verification',
      },
      {
        order: 2,
        technique: 'Persistence',
        mitreTacticId: 'TA0003',
        mitreTechnique: 'T1547 - Boot or Logon Autostart Execution',
        description: 'Establishing persistence on compromised systems',
        detectability: 'medium',
        preventionMethod: 'EDR, system hardening, privileged access management',
      },
      {
        order: 3,
        technique: 'Privilege Escalation',
        mitreTacticId: 'TA0004',
        mitreTechnique: 'T1110 - Brute Force',
        description: 'Lateral movement and privilege escalation',
        detectability: 'medium',
        preventionMethod: 'MFA, password policy, monitoring',
      },
      {
        order: 4,
        technique: 'Defense Evasion',
        mitreTacticId: 'TA0005',
        mitreTechnique: 'T1562 - Impair Defenses',
        description: 'Disabling security solutions',
        detectability: 'high',
        preventionMethod: 'Immutable logs, alert monitoring, EDR',
      },
      {
        order: 5,
        technique: 'Impact',
        mitreTacticId: 'TA0040',
        mitreTechnique: 'T1491 - Defacement',
        description: 'Encryption and ransom demands',
        detectability: 'high',
        preventionMethod: 'Immutable backups, air-gapped recovery systems',
      },
    ];

    // Add mitigation strategies
    threat.mitigationStrategies = [
      {
        id: `mit-${threat.id}-001`,
        threatId: threat.id,
        strategyType: 'preventive',
        title: 'Network Segmentation',
        description: 'Implement network segmentation to limit lateral movement',
        implementation: 'Separate clinical networks from administrative networks',
        effectiveness: 90,
        cost: 'Medium',
        complexity: 'medium',
        timeToImplement: '2-3 months',
        owner: 'Network Security',
        status: 'recommended',
      },
      {
        id: `mit-${threat.id}-002`,
        threatId: threat.id,
        strategyType: 'preventive',
        title: 'Immutable Backup System',
        description: 'Deploy immutable backups for critical healthcare data',
        implementation: 'Air-gapped backup infrastructure with WORM storage',
        effectiveness: 95,
        cost: 'High',
        complexity: 'high',
        timeToImplement: '3-4 months',
        owner: 'Infrastructure',
        status: 'planned',
      },
      {
        id: `mit-${threat.id}-003`,
        threatId: threat.id,
        strategyType: 'detective',
        title: 'Advanced Threat Detection',
        description: 'Deploy behavioral analytics to detect ransomware activity',
        implementation: 'EDR with ransomware-specific detection rules',
        effectiveness: 85,
        cost: 'Medium',
        complexity: 'medium',
        timeToImplement: '1-2 months',
        owner: 'Security Operations',
        status: 'implemented',
      },
      {
        id: `mit-${threat.id}-004`,
        threatId: threat.id,
        strategyType: 'responsive',
        title: 'Incident Response Plan',
        description: 'Healthcare-specific incident response procedures',
        implementation: 'IRG training and playbook development',
        effectiveness: 80,
        cost: 'Low',
        complexity: 'low',
        timeToImplement: '1 month',
        owner: 'Incident Response',
        status: 'implemented',
      },
    ];

    return threat;
  }

  /**
   * Register compliance threat
   */
  public registerComplianceThreat(
    threatName: string,
    regulatoryRequirement: string,
    affectedSystems: string[]
  ): HealthcareThreatIntel {
    const threat = this.registerThreat(threatName, 'compliance_threat', 'high', {
      targetedOrganizations: ['all_healthcare'],
      vulnerabilities: [],
    });

    threat.mitigationStrategies = [
      {
        id: `mit-${threat.id}-compliance-001`,
        threatId: threat.id,
        strategyType: 'preventive',
        title: `Implement ${regulatoryRequirement} Controls`,
        description: `Address ${regulatoryRequirement} requirements`,
        implementation: `Full implementation of required controls for ${affectedSystems.join(', ')}`,
        effectiveness: 100,
        cost: 'Variable',
        complexity: 'medium',
        timeToImplement: '6 months',
        owner: 'Compliance',
        status: 'planned',
      },
    ];

    return threat;
  }

  /**
   * Record telemetry data
   */
  public recordTelemetry(
    threatId: string,
    telemetry: Omit<TelemetryData, 'timestamp'>
  ): TelemetryData {
    const data: TelemetryData = {
      ...telemetry,
      timestamp: new Date(),
    };

    const threat = this.threats.find((t) => t.id === threatId);
    if (threat) {
      threat.telemetry.push(data);
    }

    return data;
  }

  /**
   * Add threat intelligence report
   */
  public addIntelligenceReport(
    threatId: string,
    report: Omit<ThreatIntelligenceReport, 'id'>
  ): ThreatIntelligenceReport {
    const intelReport: ThreatIntelligenceReport = {
      id: `report-${Date.now()}`,
      ...report,
    };

    const threat = this.threats.find((t) => t.id === threatId);
    if (threat) {
      threat.intelligence.push(intelReport);
    }

    return intelReport;
  }

  /**
   * Check IOCs against known threats
   */
  public checkIOC(value: string): {
    found: boolean;
    threat?: HealthcareThreatIntel;
    ioc?: IOC;
    riskLevel: ThreatSeverity;
  } {
    const ioc = this.iocDatabase.get(value);

    if (!ioc) {
      return { found: false, riskLevel: 'low' };
    }

    const threat = this.threats.find((t) => t.indicators.some((i) => i.id === ioc.id));

    return {
      found: true,
      threat,
      ioc,
      riskLevel: threat?.severity || 'informational',
    };
  }

  /**
   * Get active threats for healthcare
   */
  public getActiveThreats(): HealthcareThreatIntel[] {
    return this.threats.filter((t) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return t.lastUpdated > thirtyDaysAgo && (t.severity === 'critical' || t.severity === 'high');
    });
  }

  /**
   * Get threats targeting specific region
   */
  public getRegionalThreats(region: string): HealthcareThreatIntel[] {
    return this.threats.filter((t) =>
      t.targetedOrganizations.some((org) => org.toLowerCase().includes(region.toLowerCase()))
    );
  }

  /**
   * Get threat analysis for vulnerability
   */
  public analyzeThreatForVulnerability(
    cveId: string,
    affectedSystems: string[]
  ): {
    relatedThreats: HealthcareThreatIntel[];
    riskLevel: ThreatSeverity;
    recommendations: string[];
  } {
    const relatedThreats = this.threats.filter(
      (t) =>
        t.vulnerabilitiesExploited.includes(cveId) &&
        affectedSystems.some((sys) => t.targetedIndustries.includes(sys))
    );

    const maxSeverity = relatedThreats.length > 0 ? relatedThreats[0].severity : 'low';

    return {
      relatedThreats,
      riskLevel: maxSeverity,
      recommendations: [
        `Apply patches for ${cveId} immediately`,
        'Monitor systems for exploitation attempts',
        'Review access logs for suspicious activity',
        'Verify backup integrity',
      ],
    };
  }

  /**
   * Generate threat report
   */
  public generateThreatReport(
    startDate: Date,
    endDate: Date
  ): {
    totalThreats: number;
    criticalThreats: number;
    activeRansomwareCampaigns: number;
    complianceThreats: number;
    topThreatTypes: Record<HealthcareThreatType, number>;
    regionsMostAffected: string[];
    recommendedActions: string[];
  } {
    const periodicThreats = this.threats.filter((t) => t.lastUpdated >= startDate && t.lastUpdated <= endDate);

    const threatTypeCounts: Record<HealthcareThreatType, number> = {
      ransomware: 0,
      phishing: 0,
      supply_chain: 0,
      insider_threat: 0,
      iot_vulnerability: 0,
      compliance_threat: 0,
      data_exfiltration: 0,
      denial_of_service: 0,
    };

    periodicThreats.forEach((t) => {
      threatTypeCounts[t.threatType]++;
    });

    const criticalCount = periodicThreats.filter((t) => t.severity === 'critical').length;
    const ransomwareCount = periodicThreats.filter((t) => t.threatType === 'ransomware').length;
    const complianceCount = periodicThreats.filter((t) => t.threatType === 'compliance_threat').length;

    const affectedRegions = new Set<string>();
    periodicThreats.forEach((t) => {
      t.targetedOrganizations.forEach((org) => affectedRegions.add(org));
    });

    return {
      totalThreats: periodicThreats.length,
      criticalThreats: criticalCount,
      activeRansomwareCampaigns: ransomwareCount,
      complianceThreats: complianceCount,
      topThreatTypes: threatTypeCounts,
      regionsMostAffected: Array.from(affectedRegions),
      recommendedActions: this.generateRecommendations(periodicThreats),
    };
  }

  /**
   * Get healthcare-specific threat landscape
   */
  public getHealthcareThreatsLandscape(): {
    dominantThreats: Array<{ threat: string; prevalence: number }>;
    attentionRequiredCount: number;
    criticalVulnerabilities: string[];
    industryTrends: string[];
  } {
    const threatCounts: Record<string, number> = {};

    this.threats.forEach((t) => {
      threatCounts[t.threatName] = (threatCounts[t.threatName] || 0) + 1;
    });

    const dominantThreats = Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, prevalence: count }))
      .sort((a, b) => b.prevalence - a.prevalence)
      .slice(0, 5);

    return {
      dominantThreats,
      attentionRequiredCount: this.activeCampaigns.size,
      criticalVulnerabilities: this.extractCriticalVulnerabilities(),
      industryTrends: [
        'Increased ransomware targeting surgical suites and imaging systems',
        'Growing supply chain attacks in medical device ecosystem',
        'Emerging insider threats in hybrid work environments',
        'Compliance violations through misconfigured cloud storage',
      ],
    };
  }

  // ========== Private helper methods ==========

  private initializeCommonThreats(): void {
    // Initialize database with known healthcare threats
    this.registerRansomwareCampaign('LockBit', ['US', 'UK', 'EU'], ['healthcare_network', 'ehr_systems']);

    this.registerComplianceThreat(
      'HIPAA Encryption Requirement Violation',
      'HIPAA',
      ['databases', 'file_servers']
    );

    this.registerComplianceThreat(
      'GDPR Data Residency Non-Compliance',
      'GDPR',
      ['cloud_storage', 'backup_systems']
    );

    const supplyChainThreat = this.registerThreat(
      'Medical Device Supply Chain Compromise',
      'supply_chain',
      'high',
      {
        targetedOrganizations: ['hospitals', 'clinics'],
        vulnerabilities: ['firmware_vulnerability', 'software_backdoor'],
      }
    );

    this.addIOC(
      supplyChainThreat.id,
      'hash',
      'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      'Malicious firmware update',
      ['vendor_security_alert']
    );
  }

  private getCommonRansomwareVulnerabilities(): string[] {
    return [
      'CVE-2023-44477',
      'CVE-2024-21683',
      'CVE-2024-20656',
      'Unpatched RDP endpoints',
      'Weak credentials',
    ];
  }

  private generateRecommendations(threats: HealthcareThreatIntel[]): string[] {
    const recommendations: string[] = [];

    const hasRansomware = threats.some((t) => t.threatType === 'ransomware');
    const hasDEX = threats.some((t) => t.threatType === 'data_exfiltration');
    const hasCompliance = threats.some((t) => t.threatType === 'compliance_threat');

    if (hasRansomware) {
      recommendations.push('Implement and test immutable backup solution within 30 days');
      recommendations.push('Enable network segmentation for clinical systems');
      recommendations.push('Enhance EDR capabilities with ransomware-specific detection');
    }

    if (hasDEX) {
      recommendations.push('Implement DLP solution for sensitive healthcare data');
      recommendations.push('Monitor and control data transfer channels');
      recommendations.push('Enhance network monitoring and alerting');
    }

    if (hasCompliance) {
      recommendations.push('Conduct compliance gap assessment');
      recommendations.push('Develop and implement remediation plan');
      recommendations.push('Schedule compliance audit within 90 days');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current security posture');
      recommendations.push('Continue monitoring for new threats');
      recommendations.push('Conduct quarterly threat assessment');
    }

    return recommendations;
  }

  private extractCriticalVulnerabilities(): string[] {
    const vulns = new Set<string>();

    this.threats.forEach((t) => {
      if (t.severity === 'critical' || t.severity === 'high') {
        t.vulnerabilitiesExploited.forEach((v) => vulns.add(v));
      }
    });

    return Array.from(vulns).slice(0, 10);
  }

  public getAllThreats(): HealthcareThreatIntel[] {
    return [...this.threats];
  }

  public getThreatById(threatId: string): HealthcareThreatIntel | undefined {
    return this.threats.find((t) => t.id === threatId);
  }
}

export default HealthcareThreatIntelligenceManager;
