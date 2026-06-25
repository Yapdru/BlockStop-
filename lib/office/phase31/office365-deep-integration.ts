/**
 * Office 365 Deep Integration - Auto-scan emails, detect threats in Teams
 * Advanced integration with Microsoft 365 services for threat detection
 */

import {
  Office365Integration,
  IntegrationStatus,
  ConnectedService,
  Office365Service,
  ThreatDetectionRule,
  RuleType,
  RuleCondition,
  RuleAction,
  AutoScanConfig,
  ScanResult,
  DetectedThreat,
  RemediationAction,
  RemediationStatus,
} from '@/types/office-phase31';

/**
 * Office 365 Integration Manager
 * Manages deep integration with Microsoft 365 services
 */
export class Office365IntegrationManager {
  private integration: Office365Integration;
  private scanSchedules: Map<string, NodeJS.Timeout> = new Map();
  private detectedThreatsLog: DetectedThreat[] = [];

  constructor(organizationId: string, tenantId: string) {
    this.integration = {
      id: `o365-integration-${organizationId}`,
      organizationId,
      tenantId,
      integrationStatus: 'disconnected',
      connectedServices: [],
      threatDetectionRules: [],
      autoScanConfig: this.createDefaultAutoScanConfig(),
      scanResults: [],
      threats: [],
      remediationActions: [],
    };
  }

  /**
   * Connect to Office 365 service
   */
  public connectService(serviceType: Office365Service, permissions: string[]): ConnectedService {
    const service: ConnectedService = {
      serviceType,
      connectionDate: new Date(),
      lastSyncDate: new Date(),
      permissionsGranted: permissions,
      status: 'active',
      appRegistrationId: `app-${serviceType}-${Date.now()}`,
    };

    this.integration.connectedServices.push(service);

    if (this.integration.connectedServices.length > 0) {
      this.integration.integrationStatus = 'connected';
    }

    return service;
  }

  /**
   * Create threat detection rule
   */
  public createThreatDetectionRule(
    name: string,
    ruleType: RuleType,
    targetService: Office365Service,
    conditions: RuleCondition[],
    actions: RuleAction[]
  ): ThreatDetectionRule {
    const rule: ThreatDetectionRule = {
      id: `rule-${Date.now()}`,
      name,
      enabled: true,
      targetService,
      ruleType,
      conditions,
      actions,
      priority: this.integration.threatDetectionRules.length + 1,
      createdDate: new Date(),
      lastModifiedDate: new Date(),
    };

    this.integration.threatDetectionRules.push(rule);
    return rule;
  }

  /**
   * Setup default phishing detection rules
   */
  public setupDefaultRules(): ThreatDetectionRule[] {
    const rules: ThreatDetectionRule[] = [];

    // Phishing detection for email
    rules.push(
      this.createThreatDetectionRule(
        'Malicious Links in Email',
        'phishing',
        'exchange_online',
        [
          {
            id: 'cond-001',
            field: 'message_body',
            operator: 'contains',
            value: 'http.*confirm.*password|https.*login.*account',
            regex: true,
          },
        ],
        [
          {
            id: 'act-001',
            actionType: 'quarantine',
            severity: 'high',
            parameters: { folder: 'phishing_quarantine' },
          },
          {
            id: 'act-002',
            actionType: 'alert',
            severity: 'high',
            parameters: { recipient: 'security_team' },
          },
        ]
      )
    );

    // Ransomware detection for Teams
    rules.push(
      this.createThreatDetectionRule(
        'Suspicious File Extensions in Teams',
        'malware',
        'teams',
        [
          {
            id: 'cond-002',
            field: 'file_extension',
            operator: 'in',
            value: '.exe,.dll,.scr,.vbs,.bat,.cmd,.ps1',
            regex: false,
          },
        ],
        [
          {
            id: 'act-003',
            actionType: 'block',
            severity: 'critical',
            parameters: { action: 'prevent_download' },
          },
        ]
      )
    );

    // Data exfiltration detection
    rules.push(
      this.createThreatDetectionRule(
        'Large File Downloads',
        'data_exfiltration',
        'sharepoint_online',
        [
          {
            id: 'cond-003',
            field: 'file_size_mb',
            operator: 'greater_than',
            value: '500',
            regex: false,
          },
          {
            id: 'cond-004',
            field: 'user_department',
            operator: 'not_equals',
            value: 'IT,Security,Legal',
            regex: false,
          },
        ],
        [
          {
            id: 'act-004',
            actionType: 'alert',
            severity: 'high',
            parameters: { recipient: 'dlp_officer' },
          },
          {
            id: 'act-005',
            actionType: 'tag',
            severity: 'high',
            parameters: { label: 'suspicious_activity' },
          },
        ]
      )
    );

    // Policy violation detection
    rules.push(
      this.createThreatDetectionRule(
        'External Sharing Violation',
        'policy_violation',
        'sharepoint_online',
        [
          {
            id: 'cond-005',
            field: 'share_scope',
            operator: 'equals',
            value: 'external_user',
            regex: false,
          },
        ],
        [
          {
            id: 'act-006',
            actionType: 'alert',
            severity: 'medium',
            parameters: { recipient: 'compliance_team' },
          },
        ]
      )
    );

    return rules;
  }

  /**
   * Enable auto-scanning
   */
  public enableAutoScan(config: Partial<AutoScanConfig>): AutoScanConfig {
    this.integration.autoScanConfig = {
      ...this.integration.autoScanConfig,
      ...config,
      enabled: true,
    };

    // Schedule scanning based on config
    this.scheduleAutoScans();

    return this.integration.autoScanConfig;
  }

  /**
   * Execute manual scan
   */
  public executeScan(
    service: Office365Service,
    options?: {
      scope?: string;
      maxItems?: number;
    }
  ): ScanResult {
    const scanResult: ScanResult = {
      id: `scan-${Date.now()}`,
      scanDate: new Date(),
      service,
      itemsScanned: options?.maxItems || 1000,
      threatsDetected: 0,
      remediationAttempted: 0,
      remediationSuccessful: 0,
      status: 'in_progress',
      duration: 0,
    };

    // Simulate scanning process
    setTimeout(() => {
      this.completeScan(scanResult);
    }, 5000);

    this.integration.scanResults.push(scanResult);
    return scanResult;
  }

  /**
   * Process scan results
   */
  private completeScan(scanResult: ScanResult): void {
    scanResult.status = 'completed';
    scanResult.duration = 120; // seconds

    // Simulate threat detection
    if (Math.random() < 0.3) {
      // 30% chance of threats
      const threatCount = Math.floor(Math.random() * 5) + 1;
      scanResult.threatsDetected = threatCount;

      for (let i = 0; i < threatCount; i++) {
        const threat = this.generateDetectedThreat(scanResult.id);
        this.integration.threats.push(threat);
        this.detectedThreatsLog.push(threat);
      }
    }
  }

  /**
   * Generate detected threat
   */
  private generateDetectedThreat(scanResultId: string): DetectedThreat {
    const threatTypes = ['phishing', 'malware', 'ransomware_indicator', 'suspicious_macro'];
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = [
      'critical',
      'high',
      'medium',
      'low',
    ];

    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    return {
      id: `threat-${Date.now()}`,
      scanResultId,
      detectionTime: new Date(),
      threatType,
      severity,
      itemId: `item-${Math.random().toString(36).substring(7)}`,
      itemType: Math.random() < 0.5 ? 'email' : 'file',
      itemPath: '/Teams/GeneralChat/suspicious_file.exe',
      owner: 'user@organization.com',
      sha256Hash: `a1b2c3d4e5f6${Math.random().toString(36).substring(7)}`,
      indicators: ['malicious_domain_contacted', 'obfuscated_script', 'file_hash_known_malware'],
      matchedRules: ['rule-001', 'rule-002'],
      remediationStatus: 'detected',
    };
  }

  /**
   * Remediate detected threat
   */
  public remediateThreat(threatId: string, action: string): RemediationAction | null {
    const threat = this.integration.threats.find((t) => t.id === threatId);
    if (!threat) return null;

    const remediationAction: RemediationAction = {
      id: `remediation-${Date.now()}`,
      threatId,
      action,
      parameters: {
        delete: action === 'delete',
        quarantine: action === 'quarantine',
        isolate: action === 'isolate',
      },
      initiatedTime: new Date(),
      status: 'pending',
      resultMessage: `Remediation action initiated: ${action}`,
    };

    // Simulate remediation
    setTimeout(() => {
      remediationAction.status = 'remediated';
      remediationAction.completedTime = new Date();
      remediationAction.resultMessage = `Successfully ${action}d threat`;
      threat.remediationStatus = 'remediated';
    }, 2000);

    this.integration.remediationActions.push(remediationAction);
    return remediationAction;
  }

  /**
   * Get email threat analysis
   */
  public analyzeEmailThreats(
    startDate: Date,
    endDate: Date
  ): {
    totalEmailsScanned: number;
    threatsDetected: number;
    phishingEmails: number;
    maliciousAttachments: number;
    suspiciousSenders: number;
    topThreats: Array<{ threat: string; count: number }>;
  } {
    const threatFilter = this.detectedThreatsLog.filter(
      (t) =>
        t.detectionTime >= startDate &&
        t.detectionTime <= endDate &&
        t.itemType === 'email'
    );

    const threatCounts: Record<string, number> = {};
    threatFilter.forEach((t) => {
      threatCounts[t.threatType] = (threatCounts[t.threatType] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .map(([threat, count]) => ({ threat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEmailsScanned: 50000,
      threatsDetected: threatFilter.length,
      phishingEmails: threatFilter.filter((t) => t.threatType === 'phishing').length,
      maliciousAttachments: threatFilter.filter((t) =>
        t.indicators.some((i) => i.includes('attachment'))
      ).length,
      suspiciousSenders: new Set(threatFilter.map((t) => t.owner)).size,
      topThreats,
    };
  }

  /**
   * Get Teams threat analysis
   */
  public analyzeTeamsThreats(
    startDate: Date,
    endDate: Date
  ): {
    totalMessagesScanned: number;
    threatsDetected: number;
    maliciousFiles: number;
    suspiciousLinks: number;
    affectedChannels: string[];
  } {
    const threatFilter = this.detectedThreatsLog.filter(
      (t) =>
        t.detectionTime >= startDate &&
        t.detectionTime <= endDate &&
        t.itemType === 'message'
    );

    const affectedChannels = new Set<string>();
    threatFilter.forEach((t) => {
      const channelMatch = t.itemPath.match(/\/Teams\/([^/]+)\//);
      if (channelMatch) affectedChannels.add(channelMatch[1]);
    });

    return {
      totalMessagesScanned: 100000,
      threatsDetected: threatFilter.length,
      maliciousFiles: threatFilter.filter((t) =>
        t.indicators.some((i) => i.includes('file'))
      ).length,
      suspiciousLinks: threatFilter.filter((t) =>
        t.indicators.some((i) => i.includes('link'))
      ).length,
      affectedChannels: Array.from(affectedChannels),
    };
  }

  /**
   * Get SharePoint threat analysis
   */
  public analyzeSharePointThreats(
    startDate: Date,
    endDate: Date
  ): {
    totalFilesScanned: number;
    threatsDetected: number;
    policyViolations: number;
    externalSharingViolations: number;
    sensitiveLeak: number;
  } {
    const threatFilter = this.detectedThreatsLog.filter(
      (t) =>
        t.detectionTime >= startDate &&
        t.detectionTime <= endDate &&
        t.itemType === 'file'
    );

    return {
      totalFilesScanned: 25000,
      threatsDetected: threatFilter.length,
      policyViolations: threatFilter.filter((t) =>
        t.indicators.includes('policy_violation')
      ).length,
      externalSharingViolations: threatFilter.filter((t) =>
        t.indicators.includes('external_sharing')
      ).length,
      sensitiveLeak: threatFilter.filter((t) =>
        t.indicators.includes('sensitive_data')
      ).length,
    };
  }

  /**
   * Get security dashboard
   */
  public getSecurityDashboard(): {
    integrationStatus: IntegrationStatus;
    connectedServices: number;
    activeRules: number;
    threatsDetectedToday: number;
    threatsRemediatedToday: number;
    criticalThreats: number;
    lastScanTime?: Date;
    autoScanEnabled: boolean;
    complianceStatus: string;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threatsToday = this.detectedThreatsLog.filter(
      (t) => t.detectionTime >= today
    );

    const remediatedToday = this.integration.remediationActions.filter(
      (r) =>
        r.completedTime &&
        r.completedTime >= today &&
        r.status === 'remediated'
    ).length;

    const criticalThreats = this.integration.threats.filter(
      (t) => t.severity === 'critical'
    ).length;

    const lastScan = this.integration.scanResults[this.integration.scanResults.length - 1];

    return {
      integrationStatus: this.integration.integrationStatus,
      connectedServices: this.integration.connectedServices.length,
      activeRules: this.integration.threatDetectionRules.filter((r) => r.enabled).length,
      threatsDetectedToday: threatsToday.length,
      threatsRemediatedToday: remediatedToday,
      criticalThreats,
      lastScanTime: lastScan?.scanDate,
      autoScanEnabled: this.integration.autoScanConfig.enabled,
      complianceStatus: 'Compliant',
    };
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): {
    reportPeriod: { start: Date; end: Date };
    totalThreatsDetected: number;
    threatsBySeverity: Record<string, number>;
    threatsByService: Record<Office365Service, number>;
    remediationRate: number;
    topDetectionRules: Array<{ rule: string; detections: number }>;
    recommendations: string[];
  } {
    const threatsInPeriod = this.detectedThreatsLog.filter(
      (t) => t.detectionTime >= startDate && t.detectionTime <= endDate
    );

    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byService: Record<string, number> = {
      exchange_online: 0,
      teams: 0,
      sharepoint_online: 0,
      onedrive: 0,
    };

    threatsInPeriod.forEach((t) => {
      bySeverity[t.severity]++;
    });

    const remediatedInPeriod = this.integration.remediationActions.filter(
      (r) =>
        r.completedTime &&
        r.completedTime >= startDate &&
        r.completedTime <= endDate &&
        r.status === 'remediated'
    ).length;

    const remediationRate =
      threatsInPeriod.length > 0
        ? (remediatedInPeriod / threatsInPeriod.length) * 100
        : 0;

    const ruleDetections: Record<string, number> = {};
    threatsInPeriod.forEach((t) => {
      t.matchedRules.forEach((rule) => {
        ruleDetections[rule] = (ruleDetections[rule] || 0) + 1;
      });
    });

    const topDetectionRules = Object.entries(ruleDetections)
      .map(([rule, detections]) => ({ rule, detections }))
      .sort((a, b) => b.detections - a.detections)
      .slice(0, 5);

    return {
      reportPeriod: { start: startDate, end: endDate },
      totalThreatsDetected: threatsInPeriod.length,
      threatsBySeverity: bySeverity,
      threatsByService: byService,
      remediationRate,
      topDetectionRules,
      recommendations: [
        'Enable advanced threat protection on all services',
        'Implement user-centric security training',
        'Conduct regular phishing simulations',
        'Review and strengthen email authentication',
        'Monitor suspicious file activities in Teams',
      ],
    };
  }

  // ========== Private helper methods ==========

  private createDefaultAutoScanConfig(): AutoScanConfig {
    return {
      enabled: false,
      scanSchedule: '0 2 * * *', // Daily at 2 AM
      targetServices: ['exchange_online', 'teams', 'sharepoint_online'],
      emailScanDepth: 'full',
      teamsScanEnabled: true,
      sharePointScanEnabled: true,
      oneDriveScanEnabled: true,
      scanTimeout: 3600,
      maxItemsPerScan: 5000,
      notificationTemplate: 'daily_scan_summary',
    };
  }

  private scheduleAutoScans(): void {
    // In production, this would use a task scheduler like cron
    // For demo purposes, we just log the intent
    console.log('Auto-scans scheduled');
  }

  public getIntegrationStatus(): Office365Integration {
    return this.integration;
  }

  public disconnectService(serviceType: Office365Service): boolean {
    const serviceIndex = this.integration.connectedServices.findIndex(
      (s) => s.serviceType === serviceType
    );

    if (serviceIndex !== -1) {
      this.integration.connectedServices[serviceIndex].status = 'revoked';

      if (this.integration.connectedServices.every((s) => s.status === 'revoked')) {
        this.integration.integrationStatus = 'disconnected';
      }

      return true;
    }

    return false;
  }
}

export default Office365IntegrationManager;
