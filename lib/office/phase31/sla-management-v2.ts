/**
 * SLA Management v2 - Advanced SLA tracking and per-incident SLA management
 * Handles service level agreements with escalation policies and metrics
 */

import {
  SLAManagement,
  SLA,
  IncidentSeverity,
  EscalationPolicy,
  IncidentSLATrack,
  EscalationEvent,
  SLAMetrics,
  SLAMetricsSeverity,
  SLAAlert,
  SLATrend,
} from '@/types/office-phase31';

/**
 * SLA Management System
 * Tracks incident-level SLAs with escalation and compliance metrics
 */
export class SLAManagementSystem {
  private management: SLAManagement;
  private slaAlerts: Map<string, SLAAlert> = new Map();
  private trends: SLATrend[] = [];

  constructor(organizationId: string) {
    this.management = {
      id: `sla-management-${organizationId}`,
      organizationId,
      slas: this.initializeSLAs(),
      incidentSLATracking: [],
      slaMetrics: this.initializeMetrics(),
      alerts: [],
      trends: [],
    };
  }

  /**
   * Create or update SLA
   */
  public createSLA(
    name: string,
    incidentSeverity: IncidentSeverity,
    responseTimeMinutes: number,
    resolutionTimeHours: number,
    applicableTo: string[]
  ): SLA {
    const sla: SLA = {
      id: `sla-${Date.now()}`,
      name,
      incidentSeverity,
      responseTimeMinutes,
      resolutionTimeHours,
      escalationPolicy: this.createEscalationPolicy(incidentSeverity),
      businessHours: incidentSeverity === 'critical' ? false : true,
      applicableTo,
      effectiveDate: new Date(),
      lastUpdatedBy: 'system',
      lastUpdatedDate: new Date(),
    };

    this.management.slas.push(sla);
    return sla;
  }

  /**
   * Create escalation policy
   */
  private createEscalationPolicy(severity: IncidentSeverity): EscalationPolicy[] {
    const policies: EscalationPolicy[] = [];

    switch (severity) {
      case 'critical':
        policies.push(
          {
            order: 1,
            time: 15, // 15 minutes
            escalateTo: 'on_call_engineer',
            notificationMethod: 'call',
            autoEscalate: true,
          },
          {
            order: 2,
            time: 30,
            escalateTo: 'team_lead',
            notificationMethod: 'call',
            autoEscalate: true,
          },
          {
            order: 3,
            time: 60,
            escalateTo: 'director',
            notificationMethod: 'email',
            autoEscalate: true,
          }
        );
        break;

      case 'high':
        policies.push(
          {
            order: 1,
            time: 30,
            escalateTo: 'on_call_engineer',
            notificationMethod: 'email',
            autoEscalate: true,
          },
          {
            order: 2,
            time: 120,
            escalateTo: 'team_lead',
            notificationMethod: 'email',
            autoEscalate: true,
          }
        );
        break;

      case 'medium':
        policies.push({
          order: 1,
          time: 240,
          escalateTo: 'team_lead',
          notificationMethod: 'email',
          autoEscalate: false,
        });
        break;

      case 'low':
        policies.push({
          order: 1,
          time: 480,
          escalateTo: 'team_lead',
          notificationMethod: 'email',
          autoEscalate: false,
        });
        break;
    }

    return policies;
  }

  /**
   * Track incident against SLA
   */
  public trackIncidentSLA(
    incidentId: string,
    slaId: string,
    createdTime: Date
  ): IncidentSLATrack {
    const sla = this.management.slas.find((s) => s.id === slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    const track: IncidentSLATrack = {
      id: `sla-track-${incidentId}-${Date.now()}`,
      incidentId,
      slaId,
      createdTime,
      responseTimeMET: false,
      resolutionTimeMET: false,
      responseTimeDelta: 0,
      resolutionTimeDelta: 0,
      escalations: [],
    };

    this.management.incidentSLATracking.push(track);
    this.scheduleEscalations(track, sla);

    return track;
  }

  /**
   * Record first response
   */
  public recordFirstResponse(
    incidentSLATrackId: string,
    responseTime: Date
  ): IncidentSLATrack | null {
    const track = this.management.incidentSLATracking.find((t) => t.id === incidentSLATrackId);
    if (!track) return null;

    const sla = this.management.slas.find((s) => s.id === track.slaId);
    if (!sla) return null;

    track.firstResponseTime = responseTime;
    const deltaMinutes = (responseTime.getTime() - track.createdTime.getTime()) / (1000 * 60);
    track.responseTimeMET = deltaMinutes <= sla.responseTimeMinutes;
    track.responseTimeDelta = deltaMinutes - sla.responseTimeMinutes;

    if (!track.responseTimeMET) {
      this.createAlert(track.incidentId, 'response_sla_at_risk', 'critical');
    }

    return track;
  }

  /**
   * Record incident resolution
   */
  public recordResolution(
    incidentSLATrackId: string,
    resolutionTime: Date
  ): IncidentSLATrack | null {
    const track = this.management.incidentSLATracking.find((t) => t.id === incidentSLATrackId);
    if (!track) return null;

    const sla = this.management.slas.find((s) => s.id === track.slaId);
    if (!sla) return null;

    track.resolutionTime = resolutionTime;
    const deltaHours = (resolutionTime.getTime() - track.createdTime.getTime()) / (1000 * 60 * 60);
    track.resolutionTimeMET = deltaHours <= sla.resolutionTimeHours;
    track.resolutionTimeDelta = deltaHours - sla.resolutionTimeHours;

    if (!track.resolutionTimeMET) {
      this.createAlert(track.incidentId, 'sla_breached', 'critical');
    }

    return track;
  }

  /**
   * Trigger escalation for incident
   */
  public escalateIncident(
    incidentSLATrackId: string,
    escalationLevel: number,
    reason: string
  ): boolean {
    const track = this.management.incidentSLATracking.find((t) => t.id === incidentSLATrackId);
    if (!track) return false;

    const sla = this.management.slas.find((s) => s.id === track.slaId);
    if (!sla) return false;

    const policy = sla.escalationPolicy.find((p) => p.order === escalationLevel);
    if (!policy) return false;

    const escalation: EscalationEvent = {
      escalationLevel,
      escalatedTime: new Date(),
      escalatedTo: policy.escalateTo,
      reason,
      acknowledged: false,
    };

    track.escalations.push(escalation);

    this.createAlert(
      track.incidentId,
      'resolution_sla_at_risk',
      escalationLevel >= 2 ? 'critical' : 'warning'
    );

    return true;
  }

  /**
   * Acknowledge escalation
   */
  public acknowledgeEscalation(incidentSLATrackId: string, escalationLevel: number): boolean {
    const track = this.management.incidentSLATracking.find((t) => t.id === incidentSLATrackId);
    if (!track) return false;

    const escalation = track.escalations.find((e) => e.escalationLevel === escalationLevel);
    if (!escalation) return false;

    escalation.acknowledged = true;
    escalation.acknowledgedTime = new Date();

    return true;
  }

  /**
   * Calculate SLA metrics for period
   */
  public calculateMetrics(
    startDate: Date,
    endDate: Date,
    groupBy?: 'severity' | 'team'
  ): SLAMetrics {
    const tracks = this.management.incidentSLATracking.filter(
      (t) => t.createdTime >= startDate && t.createdTime <= endDate
    );

    const compliant = tracks.filter((t) => t.responseTimeMET && t.resolutionTimeMET).length;
    const breached = tracks.length - compliant;

    const avgResponseTime =
      tracks.reduce((sum, t) => sum + (t.firstResponseTime ? (t.firstResponseTime.getTime() - t.createdTime.getTime()) / (1000 * 60) : 0), 0) / tracks.length || 0;

    const avgResolutionTime =
      tracks.reduce((sum, t) => sum + (t.resolutionTime ? (t.resolutionTime.getTime() - t.createdTime.getTime()) / (1000 * 60 * 60) : 0), 0) / tracks.length || 0;

    const metrics: SLAMetrics = {
      period: { startDate, endDate },
      totalIncidents: tracks.length,
      slaCompliantIncidents: compliant,
      slaBreachIncidents: breached,
      slaComplianceRate: tracks.length > 0 ? (compliant / tracks.length) * 100 : 0,
      averageResponseTime: avgResponseTime,
      averageResolutionTime: avgResolutionTime,
      bySeverity: {},
      byTeam: {},
    };

    // Calculate metrics by severity
    (['critical', 'high', 'medium', 'low'] as IncidentSeverity[]).forEach((severity) => {
      const severityTracks = tracks.filter((t) => {
        const sla = this.management.slas.find((s) => s.id === t.slaId);
        return sla?.incidentSeverity === severity;
      });

      const severityCompliant = severityTracks.filter((t) => t.responseTimeMET && t.resolutionTimeMET).length;

      metrics.bySeverity[severity] = {
        totalIncidents: severityTracks.length,
        compliant: severityCompliant,
        breached: severityTracks.length - severityCompliant,
        complianceRate: severityTracks.length > 0 ? (severityCompliant / severityTracks.length) * 100 : 0,
        avgResponseTime: severityTracks.length > 0
          ? severityTracks.reduce((sum, t) => sum + (t.responseTimeDelta || 0), 0) / severityTracks.length
          : 0,
        avgResolutionTime: severityTracks.length > 0
          ? severityTracks.reduce((sum, t) => sum + (t.resolutionTimeDelta || 0), 0) / severityTracks.length
          : 0,
      };
    });

    this.management.slaMetrics = metrics;
    return metrics;
  }

  /**
   * Get SLA compliance dashboard data
   */
  public getDashboardData(): {
    overallCompliance: number;
    complianceByLevel: Record<IncidentSeverity, number>;
    totalIncidents: number;
    breachedIncidents: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    openAlerts: number;
    atRiskIncidents: number;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const metrics = this.calculateMetrics(thirtyDaysAgo, now);

    const atRiskAlerts = Array.from(this.slaAlerts.values()).filter(
      (a) =>
        a.alertType === 'response_sla_at_risk' || a.alertType === 'resolution_sla_at_risk'
    );

    return {
      overallCompliance: metrics.slaComplianceRate,
      complianceByLevel: {
        critical: metrics.bySeverity.critical?.complianceRate || 0,
        high: metrics.bySeverity.high?.complianceRate || 0,
        medium: metrics.bySeverity.medium?.complianceRate || 0,
        low: metrics.bySeverity.low?.complianceRate || 0,
      },
      totalIncidents: metrics.totalIncidents,
      breachedIncidents: metrics.slaBreachIncidents,
      averageResponseTime: metrics.averageResponseTime,
      averageResolutionTime: metrics.averageResolutionTime,
      openAlerts: Array.from(this.slaAlerts.values()).filter(
        (a) => !a.dismissedAt && !a.acknowledged
      ).length,
      atRiskIncidents: atRiskAlerts.length,
    };
  }

  /**
   * Get incident SLA status
   */
  public getIncidentSLAStatus(incidentId: string): {
    responseStatus: 'met' | 'at_risk' | 'breached' | 'pending';
    resolutionStatus: 'met' | 'at_risk' | 'breached' | 'pending';
    timeRemaining: number | null;
    escalationLevel: number;
    escalationDetails: EscalationEvent[];
  } {
    const track = this.management.incidentSLATracking.find((t) => t.incidentId === incidentId);
    if (!track) {
      return {
        responseStatus: 'pending',
        resolutionStatus: 'pending',
        timeRemaining: null,
        escalationLevel: 0,
        escalationDetails: [],
      };
    }

    const sla = this.management.slas.find((s) => s.id === track.slaId);
    if (!sla) {
      return {
        responseStatus: 'pending',
        resolutionStatus: 'pending',
        timeRemaining: null,
        escalationLevel: 0,
        escalationDetails: [],
      };
    }

    const now = new Date();
    const createdMinutes = (now.getTime() - track.createdTime.getTime()) / (1000 * 60);

    let responseStatus: 'met' | 'at_risk' | 'breached' | 'pending' = 'pending';
    if (track.firstResponseTime) {
      responseStatus = track.responseTimeMET ? 'met' : 'breached';
    } else if (createdMinutes > sla.responseTimeMinutes * 0.8) {
      responseStatus = 'at_risk';
    }

    let resolutionStatus: 'met' | 'at_risk' | 'breached' | 'pending' = 'pending';
    if (track.resolutionTime) {
      resolutionStatus = track.resolutionTimeMET ? 'met' : 'breached';
    } else {
      const createdHours = createdMinutes / 60;
      if (createdHours > sla.resolutionTimeHours * 0.8) {
        resolutionStatus = 'at_risk';
      }
    }

    const timeRemaining = track.resolutionTime
      ? null
      : sla.resolutionTimeHours * 60 - createdMinutes;

    return {
      responseStatus,
      resolutionStatus,
      timeRemaining: timeRemaining ? Math.max(0, timeRemaining) : null,
      escalationLevel: track.escalations.length,
      escalationDetails: track.escalations,
    };
  }

  /**
   * Get alert for incident
   */
  public getIncidentAlerts(incidentId: string): SLAAlert[] {
    return this.management.alerts.filter((a) => a.incidentId === incidentId);
  }

  /**
   * Generate trend analysis
   */
  public generateTrendAnalysis(days: number = 30): {
    trends: SLATrend[];
    improvingAreas: string[];
    concernAreas: string[];
    forecast: string;
  } {
    const trends: SLATrend[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMetrics = this.calculateMetrics(dayStart, dayEnd);

      trends.push({
        date: dayStart,
        complianceRate: dayMetrics.slaComplianceRate,
        incidentsCompliant: dayMetrics.slaCompliantIncidents,
        incidentsBreached: dayMetrics.slaBreachIncidents,
        avgResponseTime: dayMetrics.averageResponseTime,
        avgResolutionTime: dayMetrics.averageResolutionTime,
      });
    }

    trends.reverse(); // Oldest first

    const improvingAreas: string[] = [];
    const concernAreas: string[] = [];

    if (trends.length > 1) {
      const recent = trends[trends.length - 1];
      const previous = trends[trends.length - 7] || trends[0];

      if (recent.complianceRate > previous.complianceRate) {
        improvingAreas.push('Overall SLA Compliance');
      } else {
        concernAreas.push('Overall SLA Compliance');
      }

      if (recent.avgResponseTime < previous.avgResponseTime) {
        improvingAreas.push('Response Time');
      } else {
        concernAreas.push('Response Time');
      }

      if (recent.avgResolutionTime < previous.avgResolutionTime) {
        improvingAreas.push('Resolution Time');
      } else {
        concernAreas.push('Resolution Time');
      }
    }

    return {
      trends,
      improvingAreas,
      concernAreas,
      forecast: 'Maintain current compliance through process optimization',
    };
  }

  // ========== Private helper methods ==========

  private initializeSLAs(): SLA[] {
    return [
      this.createSLA(
        'Critical Incidents',
        'critical',
        15, // 15 minutes
        2, // 2 hours
        ['all_offices']
      ),
      this.createSLA(
        'High Priority Incidents',
        'high',
        60, // 60 minutes
        8, // 8 hours
        ['all_offices']
      ),
      this.createSLA(
        'Medium Priority Incidents',
        'medium',
        240, // 4 hours
        24, // 24 hours
        ['all_offices']
      ),
      this.createSLA(
        'Low Priority Incidents',
        'low',
        480, // 8 hours
        72, // 72 hours
        ['all_offices']
      ),
    ];
  }

  private initializeMetrics(): SLAMetrics {
    return {
      period: { startDate: new Date(), endDate: new Date() },
      totalIncidents: 0,
      slaCompliantIncidents: 0,
      slaBreachIncidents: 0,
      slaComplianceRate: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      bySeverity: {
        critical: { totalIncidents: 0, compliant: 0, breached: 0, complianceRate: 0, avgResponseTime: 0, avgResolutionTime: 0 },
        high: { totalIncidents: 0, compliant: 0, breached: 0, complianceRate: 0, avgResponseTime: 0, avgResolutionTime: 0 },
        medium: { totalIncidents: 0, compliant: 0, breached: 0, complianceRate: 0, avgResponseTime: 0, avgResolutionTime: 0 },
        low: { totalIncidents: 0, compliant: 0, breached: 0, complianceRate: 0, avgResponseTime: 0, avgResolutionTime: 0 },
      },
      byTeam: {},
    };
  }

  private scheduleEscalations(track: IncidentSLATrack, sla: SLA): void {
    // In production, this would schedule escalation events
    // For now, we just track that escalations could be triggered
  }

  private createAlert(incidentId: string, alertType: string, severity: string): void {
    const alert: SLAAlert = {
      id: `alert-${Date.now()}`,
      incidentId,
      alertType: alertType as any,
      severity: severity as any,
      timeUntilBreach: 0,
      createdAt: new Date(),
      acknowledged: false,
    };

    this.slaAlerts.set(alert.id, alert);
    this.management.alerts.push(alert);
  }

  public getManagementData(): SLAManagement {
    return this.management;
  }
}

export default SLAManagementSystem;
