/**
 * Compliance Calendar - Track compliance deadlines, audit dates, training
 * Manages all compliance-related events and deadlines
 */

import {
  ComplianceCalendar,
  ComplianceEvent,
  ComplianceEventType,
  ComplianceDeadlineEvent,
  AuditSchedule,
  AuditType,
  AuditFinding,
  CertificationTrack,
  CertificationStatus,
  AssessmentResult,
  TrainingEvent,
  TrainingAttendee,
  HolidayInfo,
} from '@/types/office-phase31';

/**
 * Compliance Calendar Manager
 * Manages compliance events, deadlines, audits, and training
 */
export class ComplianceCalendarManager {
  private calendar: ComplianceCalendar;
  private upcomingDeadlines: ComplianceDeadlineEvent[] = [];
  private overdueItems: ComplianceDeadlineEvent[] = [];

  constructor(organizationId: string) {
    this.calendar = {
      id: `calendar-${organizationId}`,
      organizationId,
      events: [],
      deadlines: [],
      audits: [],
      certifications: [],
      trainingSchedule: [],
      holidays: [],
    };

    this.initializeHealthcareCalendar();
  }

  /**
   * Add a compliance event
   */
  public addEvent(
    title: string,
    eventType: ComplianceEventType,
    startDate: Date,
    endDate: Date,
    owner: string,
    description?: string
  ): ComplianceEvent {
    const event: ComplianceEvent = {
      id: `event-${Date.now()}`,
      title,
      eventType,
      startDate,
      endDate,
      description: description || '',
      owner,
      participants: [owner],
      documents: [],
      status: 'scheduled',
      notes: '',
      relatedRegulations: this.getRelatedRegulations(eventType),
    };

    this.calendar.events.push(event);
    return event;
  }

  /**
   * Add a compliance deadline
   */
  public addDeadline(
    title: string,
    regulation: string,
    dueDate: Date,
    requirement: string,
    owner: string,
    priority: 'critical' | 'high' | 'medium' | 'low' = 'high'
  ): ComplianceDeadlineEvent {
    const deadline: ComplianceDeadlineEvent = {
      id: `deadline-${Date.now()}`,
      title,
      regulation,
      dueDate,
      requirement,
      owner,
      priority,
      relatedIncidents: [],
      status: this.calculateDeadlineStatus(dueDate),
      evidence: [],
      notes: '',
    };

    this.calendar.deadlines.push(deadline);
    this.updateDeadlineStatus();

    return deadline;
  }

  /**
   * Schedule an audit
   */
  public scheduleAudit(
    auditType: AuditType,
    scope: string,
    startDate: Date,
    endDate: Date,
    auditor: string,
    auditNumber?: string
  ): AuditSchedule {
    const audit: AuditSchedule = {
      id: `audit-${Date.now()}`,
      auditType,
      scope,
      startDate,
      endDate,
      auditor,
      auditNumber: auditNumber || `AUDIT-${Date.now()}`,
      findingsSummary: [],
      status: 'scheduled',
    };

    this.calendar.audits.push(audit);

    // Create event for audit
    this.addEvent(
      `${auditType.toUpperCase()} Audit`,
      'audit',
      startDate,
      endDate,
      auditor,
      `${auditType} audit - ${scope}`
    );

    return audit;
  }

  /**
   * Add audit findings
   */
  public addAuditFinding(
    auditId: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    category: string,
    description: string,
    owner: string
  ): AuditFinding {
    const audit = this.calendar.audits.find((a) => a.id === auditId);
    if (!audit) return null as any;

    const finding: AuditFinding = {
      id: `finding-${Date.now()}`,
      severity,
      category,
      description,
      owner,
      dueDate: this.calculateRemediationDeadline(severity),
      status: 'open',
    };

    audit.findingsSummary.push(finding);

    // Create remediation deadline
    if (severity === 'critical' || severity === 'high') {
      const regulationMap: Record<string, string> = {
        hipaa: 'HIPAA',
        soc2: 'SOC 2',
        iso27001: 'ISO 27001',
        pci_dss: 'PCI DSS',
        gdpr: 'GDPR',
        ccpa: 'CCPA',
      };

      const regulation = regulationMap[audit.auditType] || 'General Compliance';

      this.addDeadline(
        `Remediate: ${description.substring(0, 50)}`,
        regulation,
        finding.dueDate,
        `Remediate finding: ${description}`,
        owner,
        severity === 'critical' ? 'critical' : 'high'
      );
    }

    return finding;
  }

  /**
   * Track certification
   */
  public trackCertification(
    certificationName: string,
    certificationBody: string,
    scope: string,
    auditor: string,
    status: CertificationStatus = 'in_progress'
  ): CertificationTrack {
    const cert: CertificationTrack = {
      id: `cert-${Date.now()}`,
      certificationName,
      certificationBody,
      currentStatus: status,
      scope,
      auditor,
      documents: [],
      assessmentResults: [],
    };

    if (status === 'obtained') {
      cert.issueDate = new Date();
      cert.expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    this.calendar.certifications.push(cert);

    // Create event for certification
    this.addEvent(
      `${certificationName} Certification`,
      'certification',
      new Date(),
      cert.expirationDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      auditor,
      `${certificationName} tracking and renewal`
    );

    return cert;
  }

  /**
   * Schedule training
   */
  public scheduleTraining(
    title: string,
    subject: string,
    startDate: Date,
    endDate: Date,
    instructor: string,
    location: string,
    attendeeEmails: string[]
  ): TrainingEvent {
    const training: TrainingEvent = {
      id: `training-${Date.now()}`,
      title,
      subject,
      startDate,
      endDate,
      instructor,
      location,
      attendees: attendeeEmails.map((email) => ({
        userId: `user-${email}`,
        name: email.split('@')[0],
        email,
        attendanceStatus: 'registered',
        completionStatus: 'not_started',
        certificateIssued: false,
      })),
      completionPercentage: 0,
      status: 'scheduled',
    };

    this.calendar.trainingSchedule.push(training);

    // Create event
    this.addEvent(
      title,
      'training',
      startDate,
      endDate,
      instructor,
      `Training: ${subject}`
    );

    return training;
  }

  /**
   * Mark training attendance
   */
  public recordTrainingAttendance(
    trainingId: string,
    userId: string,
    attended: boolean,
    score?: number
  ): TrainingAttendee | null {
    const training = this.calendar.trainingSchedule.find((t) => t.id === trainingId);
    if (!training) return null;

    const attendee = training.attendees.find((a) => a.userId === userId);
    if (!attendee) return null;

    attendee.attendanceStatus = attended ? 'attended' : 'absent';
    attendee.completionStatus = attended ? 'completed' : 'not_started';

    if (score !== undefined) {
      attendee.score = score;
      attendee.certificateIssued = score >= 80;
    }

    // Update completion percentage
    const completed = training.attendees.filter(
      (a) => a.completionStatus === 'completed'
    ).length;
    training.completionPercentage = (completed / training.attendees.length) * 100;

    return attendee;
  }

  /**
   * Add holiday
   */
  public addHoliday(
    date: Date,
    name: string,
    country: string,
    affectsOffices: string[]
  ): HolidayInfo {
    const holiday: HolidayInfo = {
      date,
      name,
      country,
      affectsOffices,
    };

    this.calendar.holidays.push(holiday);
    return holiday;
  }

  /**
   * Get upcoming deadlines
   */
  public getUpcomingDeadlines(daysAhead: number = 30): ComplianceDeadlineEvent[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.calendar.deadlines
      .filter((d) => d.dueDate >= now && d.dueDate <= futureDate)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get overdue items
   */
  public getOverdueItems(): ComplianceDeadlineEvent[] {
    const now = new Date();
    return this.calendar.deadlines
      .filter((d) => d.dueDate < now && d.status !== 'on_track')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get compliance calendar view
   */
  public getCalendarView(
    startDate: Date,
    endDate: Date
  ): {
    events: ComplianceEvent[];
    deadlines: ComplianceDeadlineEvent[];
    audits: AuditSchedule[];
    trainings: TrainingEvent[];
    holidays: HolidayInfo[];
  } {
    return {
      events: this.calendar.events.filter(
        (e) => e.startDate >= startDate && e.endDate <= endDate
      ),
      deadlines: this.calendar.deadlines.filter(
        (d) => d.dueDate >= startDate && d.dueDate <= endDate
      ),
      audits: this.calendar.audits.filter(
        (a) => a.startDate >= startDate && a.endDate <= endDate
      ),
      trainings: this.calendar.trainingSchedule.filter(
        (t) => t.startDate >= startDate && t.endDate <= endDate
      ),
      holidays: this.calendar.holidays.filter(
        (h) => h.date >= startDate && h.date <= endDate
      ),
    };
  }

  /**
   * Get compliance status summary
   */
  public getComplianceStatus(): {
    totalDeadlines: number;
    onTrack: number;
    atRisk: number;
    overdue: number;
    openAuditFindings: number;
    certifications: number;
    upcomingTrainings: number;
    overallStatus: string;
  } {
    const onTrack = this.calendar.deadlines.filter((d) => d.status === 'on_track').length;
    const atRisk = this.calendar.deadlines.filter((d) => d.status === 'at_risk').length;
    const overdue = this.calendar.deadlines.filter((d) => d.status === 'overdue').length;

    const openFindings = this.calendar.audits.reduce(
      (sum, a) => sum + a.findingsSummary.filter((f) => f.status === 'open').length,
      0
    );

    const now = new Date();
    const upcomingTrainings = this.calendar.trainingSchedule.filter(
      (t) => t.startDate > now && t.status === 'scheduled'
    ).length;

    const overallStatus =
      overdue === 0 && atRisk === 0
        ? 'Compliant'
        : atRisk > 0
          ? 'At Risk'
          : 'Non-Compliant';

    return {
      totalDeadlines: this.calendar.deadlines.length,
      onTrack,
      atRisk,
      overdue,
      openAuditFindings: openFindings,
      certifications: this.calendar.certifications.length,
      upcomingTrainings,
      overallStatus,
    };
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(month: Date): {
    month: string;
    completedDeadlines: number;
    missedDeadlines: number;
    auditsFacilitating: number;
    findingsRemediating: number;
    trainingsCompleted: number;
    trainingAttendanceRate: number;
    certificationStatus: string;
    recommendations: string[];
  } {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const monthDeadlines = this.calendar.deadlines.filter(
      (d) => d.dueDate >= monthStart && d.dueDate <= monthEnd
    );

    const completed = monthDeadlines.filter((d) => d.status === 'on_track').length;
    const missed = monthDeadlines.filter((d) => d.status === 'overdue').length;

    const monthAudits = this.calendar.audits.filter(
      (a) => a.startDate >= monthStart && a.startDate <= monthEnd
    );

    const monthTrainings = this.calendar.trainingSchedule.filter(
      (t) => t.startDate >= monthStart && t.startDate <= monthEnd && t.status === 'completed'
    );

    let attendanceRate = 0;
    if (monthTrainings.length > 0) {
      const totalAttended = monthTrainings.reduce((sum, t) => sum + t.completionPercentage, 0);
      attendanceRate = totalAttended / monthTrainings.length;
    }

    let remediatingFindings = 0;
    this.calendar.audits.forEach((a) => {
      remediatingFindings += a.findingsSummary.filter((f) => f.status === 'in_remediation').length;
    });

    return {
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      completedDeadlines: completed,
      missedDeadlines: missed,
      auditsFacilitating: monthAudits.length,
      findingsRemediating: remediatingFindings,
      trainingsCompleted: monthTrainings.length,
      trainingAttendanceRate,
      certificationStatus:
        this.calendar.certifications.some((c) => c.currentStatus === 'obtained')
          ? 'Current'
          : 'In Progress',
      recommendations: [
        'Maintain focus on deadline management',
        'Continue remediation of audit findings',
        'Expand security training coverage',
        'Track certification renewal dates',
      ],
    };
  }

  // ========== Private helper methods ==========

  private getRelatedRegulations(eventType: ComplianceEventType): string[] {
    const regulations: Record<ComplianceEventType, string[]> = {
      audit: ['HIPAA', 'HITECH', 'SOC 2'],
      assessment: ['HIPAA', 'ISO 27001'],
      training: ['HIPAA', 'GDPR', 'CCPA'],
      review: ['HIPAA', 'SOC 2'],
      certification: ['ISO 27001', 'SOC 2'],
      testing: ['HIPAA', 'SOC 2'],
      meeting: ['HIPAA'],
      deadline: ['HIPAA', 'GDPR'],
    };

    return regulations[eventType] || [];
  }

  private calculateDeadlineStatus(dueDate: Date): 'on_track' | 'at_risk' | 'overdue' {
    const now = new Date();
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 24 * 60 * 60);

    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue < 7) return 'at_risk';
    return 'on_track';
  }

  private calculateRemediationDeadline(severity: string): Date {
    const daysToAdd = severity === 'critical' ? 14 : severity === 'high' ? 30 : 90;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private updateDeadlineStatus(): void {
    this.calendar.deadlines.forEach((deadline) => {
      deadline.status = this.calculateDeadlineStatus(deadline.dueDate);
    });

    // Separate upcoming and overdue
    const now = new Date();
    this.upcomingDeadlines = this.calendar.deadlines.filter((d) => d.dueDate > now);
    this.overdueItems = this.calendar.deadlines.filter((d) => d.dueDate < now);
  }

  private initializeHealthcareCalendar(): void {
    // Initialize with standard healthcare compliance deadlines

    const thisYear = new Date().getFullYear();

    // HIPAA annual audit
    this.scheduleAudit(
      'hipaa',
      'HIPAA Compliance Review',
      new Date(thisYear, 9, 1),
      new Date(thisYear, 9, 30),
      'Compliance Officer'
    );

    // SOC 2 annual audit
    this.scheduleAudit(
      'soc2',
      'SOC 2 Type II Audit',
      new Date(thisYear, 0, 15),
      new Date(thisYear, 1, 28),
      'External Auditor'
    );

    // Security training deadlines
    this.scheduleTraining(
      'HIPAA Security Awareness',
      'HIPAA Compliance',
      new Date(thisYear, 0, 15),
      new Date(thisYear, 0, 16),
      'Training Team',
      'Virtual',
      ['all@organization.com']
    );

    // Add compliance deadlines
    this.addDeadline(
      'HIPAA Risk Assessment',
      'HIPAA',
      new Date(thisYear, 2, 31),
      'Complete annual risk assessment',
      'Security Officer',
      'high'
    );

    this.addDeadline(
      'Business Associate Agreements Review',
      'HIPAA',
      new Date(thisYear, 5, 30),
      'Review all BAAs for compliance',
      'Compliance Officer',
      'high'
    );
  }

  public getCalendarData(): ComplianceCalendar {
    return this.calendar;
  }
}

export default ComplianceCalendarManager;
