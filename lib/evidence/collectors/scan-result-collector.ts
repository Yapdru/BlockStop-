/**
 * Scan Result Collector - Collects vulnerability and threat scan results as compliance evidence
 */

import { EvidenceItem, EvidenceType } from '../../compliance/types/compliance-types';

export interface ScanResult {
  scanId: string;
  scanType: 'VULNERABILITY' | 'MALWARE' | 'CONFIG' | 'COMPLIANCE';
  scanDate: Date;
  systemScanned: string;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  remediatedCount: number;
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  details: Record<string, unknown>;
}

export class ScanResultCollector {
  private scanResults: Map<string, ScanResult[]> = new Map();

  /**
   * Record scan result
   */
  recordScanResult(organizationId: string, result: ScanResult): void {
    const orgResults = this.scanResults.get(organizationId) || [];
    orgResults.push(result);
    this.scanResults.set(organizationId, orgResults);
  }

  /**
   * Get scan results for time period
   */
  getResultsForPeriod(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): ScanResult[] {
    const orgResults = this.scanResults.get(organizationId) || [];
    return orgResults.filter(
      (r) => r.scanDate >= startDate && r.scanDate <= endDate
    );
  }

  /**
   * Get latest scan for system
   */
  getLatestScanForSystem(
    organizationId: string,
    system: string
  ): ScanResult | null {
    const orgResults = this.scanResults.get(organizationId) || [];
    const systemScans = orgResults
      .filter((r) => r.systemScanned === system)
      .sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime());
    return systemScans[0] || null;
  }

  /**
   * Analyze scan trends
   */
  analyzeScanTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): {
    totalScans: number;
    averageFindingsPerScan: number;
    criticalTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
    mostProblematicSystems: Array<{ system: string; findingsCount: number }>;
  } {
    const results = this.getResultsForPeriod(organizationId, startDate, endDate);

    if (results.length === 0) {
      return {
        totalScans: 0,
        averageFindingsPerScan: 0,
        criticalTrend: 'STABLE',
        mostProblematicSystems: [],
      };
    }

    const totalFindings = results.reduce((sum, r) => sum + r.findingsCount, 0);
    const averageFindingsPerScan = totalFindings / results.length;

    // Calculate critical trend
    const firstHalf = results.slice(0, Math.floor(results.length / 2));
    const secondHalf = results.slice(Math.floor(results.length / 2));

    const firstHalfCritical = firstHalf.reduce((sum, r) => sum + r.criticalCount, 0);
    const secondHalfCritical = secondHalf.reduce((sum, r) => sum + r.criticalCount, 0);

    let criticalTrend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE';
    if (secondHalfCritical < firstHalfCritical) {
      criticalTrend = 'IMPROVING';
    } else if (secondHalfCritical > firstHalfCritical) {
      criticalTrend = 'WORSENING';
    }

    // Get most problematic systems
    const systemStats = new Map<string, number>();
    results.forEach((r) => {
      const count = systemStats.get(r.systemScanned) || 0;
      systemStats.set(r.systemScanned, count + r.findingsCount);
    });

    const mostProblematicSystems = Array.from(systemStats.entries())
      .map(([system, findingsCount]) => ({ system, findingsCount }))
      .sort((a, b) => b.findingsCount - a.findingsCount)
      .slice(0, 5);

    return {
      totalScans: results.length,
      averageFindingsPerScan,
      criticalTrend,
      mostProblematicSystems,
    };
  }

  /**
   * Generate evidence from scan results
   */
  generateScanEvidence(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    controlIds: string[]
  ): EvidenceItem {
    const results = this.getResultsForPeriod(organizationId, startDate, endDate);
    const totalFindings = results.reduce((sum, r) => sum + r.findingsCount, 0);
    const totalCritical = results.reduce((sum, r) => sum + r.criticalCount, 0);

    return {
      id: `evidence-scan-${Date.now()}`,
      controlId: controlIds[0] || '',
      type: EvidenceType.TEST_REPORT,
      title: 'Vulnerability Scan Results',
      description: `${results.length} scans completed with ${totalFindings} findings (${totalCritical} critical)`,
      location: 'Vulnerability Scanner',
      uploadedBy: 'system',
      uploadedAt: new Date(),
      isValid: true,
      linkedControls: controlIds,
      relatedEvidence: [],
    };
  }

  /**
   * Identify remediation gaps
   */
  identifyRemediationGaps(
    organizationId: string,
    daysOld: number = 30
  ): Array<{
    scanId: string;
    system: string;
    unremediatedFindings: number;
    ageInDays: number;
  }> {
    const orgResults = this.scanResults.get(organizationId) || [];
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    return orgResults
      .filter((r) => r.scanDate < cutoffDate && r.remediatedCount < r.findingsCount)
      .map((r) => ({
        scanId: r.scanId,
        system: r.systemScanned,
        unremediatedFindings: r.findingsCount - r.remediatedCount,
        ageInDays: Math.floor(
          (Date.now() - r.scanDate.getTime()) / (24 * 60 * 60 * 1000)
        ),
      }))
      .sort((a, b) => b.ageInDays - a.ageInDays);
  }

  /**
   * Get risk posture
   */
  getRiskPosture(organizationId: string): {
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    riskFactors: string[];
    recommendedActions: string[];
  } {
    const orgResults = this.scanResults.get(organizationId) || [];

    if (orgResults.length === 0) {
      return {
        overallRisk: 'LOW',
        riskFactors: [],
        recommendedActions: [],
      };
    }

    const latestScans = new Map<string, ScanResult>();
    orgResults.forEach((r) => {
      const existing = latestScans.get(r.systemScanned);
      if (!existing || r.scanDate > existing.scanDate) {
        latestScans.set(r.systemScanned, r);
      }
    });

    const allCritical = Array.from(latestScans.values()).reduce(
      (sum, r) => sum + r.criticalCount,
      0
    );
    const allHigh = Array.from(latestScans.values()).reduce(
      (sum, r) => sum + r.highCount,
      0
    );

    let overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];

    if (allCritical > 0) {
      overallRisk = 'CRITICAL';
      riskFactors.push(`${allCritical} critical vulnerabilities found`);
      recommendedActions.push('Immediately remediate all critical vulnerabilities');
    } else if (allHigh > 0) {
      overallRisk = 'HIGH';
      riskFactors.push(`${allHigh} high-severity vulnerabilities found`);
      recommendedActions.push('Prioritize remediation of high-severity vulnerabilities');
    }

    const gaps = this.identifyRemediationGaps(organizationId);
    if (gaps.length > 0) {
      riskFactors.push(`${gaps.length} scans with unresolved findings`);
      recommendedActions.push('Complete remediation for all outstanding findings');
    }

    return {
      overallRisk,
      riskFactors,
      recommendedActions,
    };
  }

  /**
   * Export scan results
   */
  exportResults(organizationId: string, format: 'JSON' | 'CSV' = 'JSON'): string {
    const orgResults = this.scanResults.get(organizationId) || [];

    if (format === 'JSON') {
      return JSON.stringify(orgResults, null, 2);
    } else {
      // CSV format
      const headers = [
        'scanId',
        'scanType',
        'system',
        'findingsCount',
        'critical',
        'high',
        'medium',
        'low',
        'risk',
      ];
      const rows = orgResults.map((r) => [
        r.scanId,
        r.scanType,
        r.systemScanned,
        r.findingsCount,
        r.criticalCount,
        r.highCount,
        r.mediumCount,
        r.lowCount,
        r.overallRisk,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    }
  }
}

export default new ScanResultCollector();
