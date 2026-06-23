/**
 * BlockStop OFFICE Tier - SLA Tracking and Compliance Management
 * Incident response time, detection time, remediation time tracking
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SLAConfiguration,
  SLAMetrics,
  SLAIncidentTrack,
} from '@/types/office-tier';

export class SLATracker {
  private configurations: Map<string, SLAConfiguration> = new Map();
  private incidentTracks: Map<string, SLAIncidentTrack> = new Map();
  private monthlyMetrics: Map<string, SLAMetrics> = new Map();
  private slaBreaches: Map<string, any> = new Map();

  /**
   * Create SLA configuration
   */
  public createSLAConfiguration(
    organizationId: string,
    config: Omit<SLAConfiguration, 'id' | 'organizationId'>
  ): SLAConfiguration {
    const slaConfig: SLAConfiguration = {
      ...config,
      id: `sla-${uuidv4()}`,
      organizationId,
    };

    this.configurations.set(slaConfig.id, slaConfig);
    return slaConfig;
  }

  /**
   * Get SLA configuration
   */
  public getConfiguration(organizationId: string): SLAConfiguration | null {
    for (const config of this.configurations.values()) {
      if (config.organizationId === organizationId) {
        return config;
      }
    }
    return null;
  }

  /**
   * Update SLA configuration
   */
  public updateConfiguration(organizationId: string, updates: Partial<SLAConfiguration>): void {
    const config = this.getConfiguration(organizationId);
    if (!config) {
      throw new Error(`SLA configuration not found for org ${organizationId}`);
    }

    Object.assign(config, updates);
  }

  /**
   * Track incident against SLA
   */
  public trackIncident(
    organizationId: string,
    incidentId: string,
    createdAt: Date
  ): SLAIncidentTrack {
    const slaConfig = this.getConfiguration(organizationId);
    if (!slaConfig) {
      throw new Error(`SLA configuration not found for org ${organizationId}`);
    }

    const track: SLAIncidentTrack = {
      id: `track-${uuidv4()}`,
      incidentId,
      slaConfigId: slaConfig.id,
      createdAt,
      detectedAt: new Date(),
      detectionTimeMet: true,
      containmentTimeMet: false,
      remediationTimeMet: false,
      reportingTimeMet: false,
    };

    this.incidentTracks.set(track.id, track);
    return track;
  }

  /**
   * Update incident detection
   */
  public updateDetection(trackId: string, detectedAt: Date): void {
    const track = this.incidentTracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.detectedAt = detectedAt;

    // Check if detection time was met
    const config = this.configurations.get(track.slaConfigId);
    if (config) {
      const detectionTimeMs = (detectedAt.getTime() - track.createdAt.getTime()) / 1000 / 60; // minutes
      track.detectionTimeMet = detectionTimeMs <= config.detectionTime;

      if (!track.detectionTimeMet) {
        this.recordBreach(trackId, 'detection', detectionTimeMs, config.detectionTime);
      }
    }
  }

  /**
   * Update incident containment
   */
  public updateContainment(trackId: string, containedAt: Date): void {
    const track = this.incidentTracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.containedAt = containedAt;

    const config = this.configurations.get(track.slaConfigId);
    if (config) {
      const containmentTimeHours =
        (containedAt.getTime() - track.detectedAt.getTime()) / 1000 / 60 / 60;
      track.containmentTimeMet = containmentTimeHours <= config.containmentTime;

      if (!track.containmentTimeMet) {
        this.recordBreach(trackId, 'containment', containmentTimeHours, config.containmentTime);
      }
    }
  }

  /**
   * Update incident remediation
   */
  public updateRemediation(trackId: string, remediatedAt: Date): void {
    const track = this.incidentTracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.remediatedAt = remediatedAt;

    const config = this.configurations.get(track.slaConfigId);
    if (config) {
      const remediationTimeHours =
        (remediatedAt.getTime() - track.detectedAt.getTime()) / 1000 / 60 / 60;
      track.remediationTimeMet = remediationTimeHours <= config.remediationTime;

      if (!track.remediationTimeMet) {
        this.recordBreach(trackId, 'remediation', remediationTimeHours, config.remediationTime);
      }
    }
  }

  /**
   * Update incident reporting
   */
  public updateReporting(trackId: string, reportedAt: Date): void {
    const track = this.incidentTracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.reportedAt = reportedAt;

    const config = this.configurations.get(track.slaConfigId);
    if (config) {
      const reportingTimeHours =
        (reportedAt.getTime() - track.detectedAt.getTime()) / 1000 / 60 / 60;
      track.reportingTimeMet = reportingTimeHours <= config.reportingDeadline;

      if (!track.reportingTimeMet) {
        this.recordBreach(trackId, 'reporting', reportingTimeHours, config.reportingDeadline);
      }
    }
  }

  /**
   * Record SLA breach
   */
  private recordBreach(trackId: string, type: string, actual: number, target: number): void {
    const breachId = `breach-${uuidv4()}`;
    this.slaBreaches.set(breachId, {
      id: breachId,
      trackId,
      type,
      actualTime: actual,
      targetTime: target,
      excess: actual - target,
      recordedAt: new Date(),
    });
  }

  /**
   * Get monthly SLA metrics
   */
  public getMonthlyMetrics(organizationId: string, year: number, month: number): SLAMetrics {
    const metricsKey = `${organizationId}-${year}-${month}`;
    let metrics = this.monthlyMetrics.get(metricsKey);

    if (!metrics) {
      metrics = {
        id: `metrics-${uuidv4()}`,
        organizationId,
        month: new Date(year, month - 1),
        incidentsDetected: 0,
        averageDetectionTime: 0,
        averageContainmentTime: 0,
        averageRemediationTime: 0,
        metricsExceeded: 0,
        slaCompliance: 100,
        availabilityPercentage: 99.9,
        criticalUptime: 100,
        reportingOnTime: 100,
      };

      this.calculateMonthlyMetrics(organizationId, year, month, metrics);
      this.monthlyMetrics.set(metricsKey, metrics);
    }

    return metrics;
  }

  /**
   * Calculate monthly metrics
   */
  private calculateMonthlyMetrics(
    organizationId: string,
    year: number,
    month: number,
    metrics: SLAMetrics
  ): void {
    // Get all incidents for this month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const monthlyTracks = Array.from(this.incidentTracks.values()).filter((track) => {
      return track.createdAt >= startDate && track.createdAt < endDate;
    });

    metrics.incidentsDetected = monthlyTracks.length;

    if (monthlyTracks.length === 0) {
      return;
    }

    // Calculate averages
    let totalDetectionTime = 0;
    let totalContainmentTime = 0;
    let totalRemediationTime = 0;
    let metricsNotMet = 0;

    for (const track of monthlyTracks) {
      const detectionTime =
        (track.detectedAt.getTime() - track.createdAt.getTime()) / 1000 / 60; // minutes
      totalDetectionTime += detectionTime;

      if (track.containedAt) {
        const containmentTime =
          (track.containedAt.getTime() - track.detectedAt.getTime()) / 1000 / 60 / 60; // hours
        totalContainmentTime += containmentTime;
      }

      if (track.remediatedAt) {
        const remediationTime =
          (track.remediatedAt.getTime() - track.detectedAt.getTime()) / 1000 / 60 / 60; // hours
        totalRemediationTime += remediationTime;
      }

      if (
        !track.detectionTimeMet ||
        !track.containmentTimeMet ||
        !track.remediationTimeMet ||
        !track.reportingTimeMet
      ) {
        metricsNotMet++;
      }
    }

    metrics.averageDetectionTime = totalDetectionTime / monthlyTracks.length;
    metrics.averageContainmentTime = totalContainmentTime / monthlyTracks.length;
    metrics.averageRemediationTime = totalRemediationTime / monthlyTracks.length;
    metrics.metricsExceeded = metricsNotMet;

    const slaComplianceCount = monthlyTracks.filter(
      (t) =>
        t.detectionTimeMet &&
        t.containmentTimeMet &&
        t.remediationTimeMet &&
        t.reportingTimeMet
    ).length;

    metrics.slaCompliance =
      monthlyTracks.length > 0 ? (slaComplianceCount / monthlyTracks.length) * 100 : 100;
    metrics.reportingOnTime = metrics.slaCompliance; // Simplified for now
  }

  /**
   * Get SLA compliance report
   */
  public generateComplianceReport(organizationId: string): string {
    const config = this.getConfiguration(organizationId);
    if (!config) {
      return 'SLA configuration not found';
    }

    const currentMonth = new Date();
    const metrics = this.getMonthlyMetrics(
      organizationId,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    );

    const report = `
SLA Compliance Report
=====================
Organization: ${organizationId}
Period: ${metrics.month.toLocaleDateString()}

Configuration:
- Incident Response Time: ${config.incidentResponseTime} minutes
- Detection Time: ${config.detectionTime} minutes
- Containment Time: ${config.containmentTime} hours
- Remediation Time: ${config.remediationTime} hours
- Reporting Deadline: ${config.reportingDeadline} hours
- Monthly Availability: ${config.monthlyAvailability}%
- Critical Uptime: ${config.targetCriticalUptime}%

Metrics:
- Total Incidents: ${metrics.incidentsDetected}
- Average Detection Time: ${metrics.averageDetectionTime.toFixed(2)} minutes
- Average Containment Time: ${metrics.averageContainmentTime.toFixed(2)} hours
- Average Remediation Time: ${metrics.averageRemediationTime.toFixed(2)} hours
- Metrics Exceeded: ${metrics.metricsExceeded}
- SLA Compliance: ${metrics.slaCompliance.toFixed(2)}%
- System Availability: ${metrics.availabilityPercentage}%
- Critical Uptime: ${metrics.criticalUptime}%
- On-Time Reporting: ${metrics.reportingOnTime.toFixed(2)}%

Status: ${metrics.slaCompliance >= 95 ? 'COMPLIANT' : 'NON-COMPLIANT'}
    `;

    return report;
  }

  /**
   * Get SLA breaches
   */
  public getSLABreaches(organizationId: string): Array<any> {
    const breaches = Array.from(this.slaBreaches.values());

    // Filter by organization's incidents
    const orgIncidents = Array.from(this.incidentTracks.values())
      .filter((t) => {
        const config = this.configurations.get(t.slaConfigId);
        return config?.organizationId === organizationId;
      })
      .map((t) => t.id);

    return breaches.filter((b) =>
      Array.from(this.incidentTracks.values())
        .filter((t) => t.id === b.trackId)
        .some((t) => orgIncidents.includes(t.id))
    );
  }

  /**
   * Get SLA metrics summary
   */
  public getSLASummary(organizationId: string): {
    compliance: number;
    incidentsThisMonth: number;
    breachesThisMonth: number;
    nextReviewDate: Date;
    recommendedActions: string[];
  } {
    const currentMonth = new Date();
    const metrics = this.getMonthlyMetrics(
      organizationId,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    );

    const breaches = this.getSLABreaches(organizationId);
    const thisMonthBreaches = breaches.filter(
      (b) =>
        b.recordedAt >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) &&
        b.recordedAt < new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    ).length;

    const recommendations: string[] = [];

    if (metrics.slaCompliance < 95) {
      recommendations.push('Increase incident response team capacity');
      recommendations.push('Review and optimize incident response procedures');
    }

    if (metrics.averageDetectionTime > 30) {
      recommendations.push('Improve threat detection capabilities');
    }

    if (metrics.averageRemediationTime > 24) {
      recommendations.push('Streamline remediation process');
    }

    return {
      compliance: metrics.slaCompliance,
      incidentsThisMonth: metrics.incidentsDetected,
      breachesThisMonth: thisMonthBreaches,
      nextReviewDate: new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      ),
      recommendedActions: recommendations,
    };
  }

  /**
   * Get incident SLA status
   */
  public getIncidentSLAStatus(incidentId: string): {
    status: 'on_track' | 'at_risk' | 'breached';
    detectionStatus: string;
    containmentStatus: string;
    remediationStatus: string;
    reportingStatus: string;
  } {
    const track = Array.from(this.incidentTracks.values()).find((t) => t.incidentId === incidentId);
    if (!track) {
      return {
        status: 'breached',
        detectionStatus: 'Not tracked',
        containmentStatus: 'Not tracked',
        remediationStatus: 'Not tracked',
        reportingStatus: 'Not tracked',
      };
    }

    const breaches = Array.from(this.slaBreaches.values()).filter((b) => b.trackId === track.id);

    return {
      status: breaches.length === 0 ? 'on_track' : 'breached',
      detectionStatus: track.detectionTimeMet ? 'MET' : 'EXCEEDED',
      containmentStatus: track.containmentTimeMet ? 'MET' : track.containedAt ? 'EXCEEDED' : 'PENDING',
      remediationStatus: track.remediationTimeMet ? 'MET' : track.remediatedAt ? 'EXCEEDED' : 'PENDING',
      reportingStatus: track.reportingTimeMet ? 'MET' : track.reportedAt ? 'EXCEEDED' : 'PENDING',
    };
  }

  /**
   * Export SLA metrics
   */
  public exportMetrics(organizationId: string, format: 'json' | 'csv' = 'json'): string {
    const currentMonth = new Date();
    const metrics = this.getMonthlyMetrics(
      organizationId,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    );

    const data = {
      organizationId,
      month: metrics.month.toISOString(),
      incidentsDetected: metrics.incidentsDetected,
      averageDetectionTime: metrics.averageDetectionTime.toFixed(2),
      averageContainmentTime: metrics.averageContainmentTime.toFixed(2),
      averageRemediationTime: metrics.averageRemediationTime.toFixed(2),
      slaCompliance: metrics.slaCompliance.toFixed(2),
      availability: metrics.availabilityPercentage.toFixed(2),
    };

    if (format === 'csv') {
      return Object.entries(data)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
    }

    return JSON.stringify(data, null, 2);
  }
}
