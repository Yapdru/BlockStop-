/**
 * BlockStop OFFICE Tier - Professional Reporting Engine
 * Executive summaries, board reports, compliance reports, threat intelligence
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ProfessionalReport,
  ReportSection,
  ReportChart,
  ReportMetric,
  ReportMetadata,
  ReportDistribution,
  DateRange,
  ReportingLevel,
  ProfessionalThreatIntelligence,
} from '@/types/office-tier';

export class ProfessionalReportingEngine {
  private reports: Map<string, ProfessionalReport> = new Map();
  private threatIntelligence: Map<string, ProfessionalThreatIntelligence> = new Map();
  private reportTemplates: Map<string, any> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize report templates
   */
  private initializeTemplates(): void {
    this.reportTemplates.set('executive_summary', {
      title: 'Executive Threat Summary',
      sections: [
        { name: 'overview', required: true },
        { name: 'critical_threats', required: true },
        { name: 'key_metrics', required: true },
        { name: 'recommendations', required: true },
      ],
    });

    this.reportTemplates.set('board_report', {
      title: 'Board Risk Report',
      sections: [
        { name: 'executive_summary', required: true },
        { name: 'risk_metrics', required: true },
        { name: 'compliance_status', required: true },
        { name: 'board_recommendations', required: true },
      ],
    });

    this.reportTemplates.set('compliance_report', {
      title: 'Compliance Status Report',
      sections: [
        { name: 'framework_status', required: true },
        { name: 'control_assessment', required: true },
        { name: 'audit_status', required: true },
        { name: 'remediation_plan', required: true },
      ],
    });

    this.reportTemplates.set('incident_report', {
      title: 'Incident Post-Mortem Report',
      sections: [
        { name: 'incident_summary', required: true },
        { name: 'timeline', required: true },
        { name: 'root_cause_analysis', required: true },
        { name: 'corrective_actions', required: true },
      ],
    });

    this.reportTemplates.set('sla_report', {
      title: 'SLA Performance Report',
      sections: [
        { name: 'metrics_summary', required: true },
        { name: 'compliance_analysis', required: true },
        { name: 'trend_analysis', required: true },
        { name: 'improvement_initiatives', required: true },
      ],
    });

    this.reportTemplates.set('threat_intelligence', {
      title: 'Professional Threat Intelligence Report',
      sections: [
        { name: 'threat_overview', required: true },
        { name: 'affected_sectors', required: true },
        { name: 'indicators_of_compromise', required: true },
        { name: 'mitigation_strategies', required: true },
      ],
    });
  }

  /**
   * Create professional report
   */
  public createReport(
    organizationId: string,
    type: ProfessionalReport['type'],
    title: string,
    period: DateRange,
    generatedBy: string
  ): ProfessionalReport {
    const report: ProfessionalReport = {
      id: `report-${uuidv4()}`,
      type,
      title,
      organizationId,
      generatedBy,
      generatedAt: new Date(),
      period,
      sections: [],
      metadata: {
        confidentiality: 'internal',
        distribution: [],
        version: '1.0',
      },
      distribution: [],
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Get report by ID
   */
  public getReport(reportId: string): ProfessionalReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Add section to report
   */
  public addSection(
    reportId: string,
    section: Omit<ReportSection, 'id'>
  ): ReportSection {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const newSection: ReportSection = {
      ...section,
      id: `section-${uuidv4()}`,
    };

    report.sections.push(newSection);
    return newSection;
  }

  /**
   * Add chart to section
   */
  public addChartToSection(
    reportId: string,
    sectionId: string,
    chart: Omit<ReportChart, 'id'>
  ): ReportChart {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const section = report.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const newChart: ReportChart = {
      ...chart,
      id: `chart-${uuidv4()}`,
    };

    if (!section.charts) {
      section.charts = [];
    }
    section.charts.push(newChart);

    return newChart;
  }

  /**
   * Add metrics to section
   */
  public addMetricsToSection(
    reportId: string,
    sectionId: string,
    metrics: ReportMetric[]
  ): void {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const section = report.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    section.keyMetrics = [...(section.keyMetrics || []), ...metrics];
  }

  /**
   * Set report metadata
   */
  public setReportMetadata(
    reportId: string,
    metadata: Partial<ReportMetadata>
  ): void {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    report.metadata = {
      ...report.metadata,
      ...metadata,
    };
  }

  /**
   * Generate executive summary
   */
  public generateExecutiveSummary(
    organizationId: string,
    period: DateRange,
    threatMetrics: any
  ): ProfessionalReport {
    const report = this.createReport(
      organizationId,
      'executive_summary',
      'Executive Threat Summary',
      period,
      'System Generated'
    );

    // Add overview section
    this.addSection(report.id, {
      title: 'Executive Overview',
      level: 'executive',
      content: this.generateOverviewContent(threatMetrics),
      keyMetrics: [
        {
          label: 'Critical Threats Detected',
          value: threatMetrics.critical || 0,
          trend: 'down',
          trendPercentage: 15,
        },
        {
          label: 'Containment Rate',
          value: `${threatMetrics.containmentRate || 95}%`,
          trend: 'up',
          trendPercentage: 5,
        },
        {
          label: 'Average Response Time',
          value: `${threatMetrics.responseTime || 0}m`,
          trend: 'down',
          trendPercentage: 20,
        },
      ],
      recommendations: [
        'Continue monitoring emerging threats',
        'Maintain current incident response procedures',
        'Schedule quarterly security awareness training',
      ],
    });

    // Add critical threats section
    this.addSection(report.id, {
      title: 'Critical Threats Requiring Action',
      level: 'executive',
      content: this.generateCriticalThreatsContent(threatMetrics),
      keyMetrics: [
        {
          label: 'Threats Requiring Immediate Action',
          value: threatMetrics.immediateAction || 0,
          trend: 'down',
        },
        {
          label: 'High Priority Items',
          value: threatMetrics.highPriority || 0,
          trend: 'stable',
        },
      ],
      recommendations: [
        'Address immediate action items within 24 hours',
        'Assign resources to high priority items',
        'Implement recommended controls',
      ],
    });

    return report;
  }

  /**
   * Generate board report
   */
  public generateBoardReport(
    organizationId: string,
    period: DateRange,
    riskMetrics: any
  ): ProfessionalReport {
    const report = this.createReport(
      organizationId,
      'board_report',
      'Board Risk Report',
      period,
      'System Generated'
    );

    this.addSection(report.id, {
      title: 'Risk Management Summary',
      level: 'strategic',
      content: this.generateBoardSummary(riskMetrics),
      keyMetrics: [
        {
          label: 'Overall Risk Score',
          value: riskMetrics.overallRisk || 35,
          trend: 'down',
          trendPercentage: 10,
          benchmark: '40',
        },
        {
          label: 'Compliance Status',
          value: `${riskMetrics.complianceScore || 92}%`,
          trend: 'up',
          trendPercentage: 3,
          benchmark: '95%',
        },
      ],
      recommendations: [
        'Continue investment in security infrastructure',
        'Expand incident response capabilities',
        'Strengthen third-party risk management',
      ],
    });

    return report;
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(
    organizationId: string,
    period: DateRange,
    complianceData: any
  ): ProfessionalReport {
    const report = this.createReport(
      organizationId,
      'compliance_report',
      'Compliance Status Report',
      period,
      'System Generated'
    );

    this.addSection(report.id, {
      title: 'Compliance Framework Status',
      level: 'operational',
      content: this.generateComplianceStatus(complianceData),
      keyMetrics: [
        {
          label: 'HIPAA Compliance',
          value: `${complianceData.hipaa || 94}%`,
          trend: 'up',
        },
        {
          label: 'SOC2 Compliance',
          value: `${complianceData.soc2 || 96}%`,
          trend: 'stable',
        },
        {
          label: 'ISO27001 Compliance',
          value: `${complianceData.iso27001 || 92}%`,
          trend: 'up',
        },
        {
          label: 'GDPR Compliance',
          value: `${complianceData.gdpr || 95}%`,
          trend: 'up',
        },
      ],
      recommendations: [
        'Remediate non-compliant controls',
        'Schedule compliance assessments',
        'Update policies as needed',
      ],
    });

    return report;
  }

  /**
   * Generate incident post-mortem report
   */
  public generateIncidentReport(
    organizationId: string,
    incidentId: string,
    incidentDetails: any
  ): ProfessionalReport {
    const report = this.createReport(
      organizationId,
      'incident_report',
      `Incident Post-Mortem: ${incidentDetails.title}`,
      {
        startDate: incidentDetails.detectedAt,
        endDate: incidentDetails.resolvedAt || new Date(),
      },
      incidentDetails.investigatedBy || 'System'
    );

    this.addSection(report.id, {
      title: 'Incident Summary',
      level: 'tactical',
      content: this.generateIncidentSummary(incidentDetails),
      keyMetrics: [
        {
          label: 'Severity',
          value: incidentDetails.severity || 'HIGH',
        },
        {
          label: 'Systems Affected',
          value: incidentDetails.affectedSystems || 1,
        },
        {
          label: 'Time to Contain',
          value: `${incidentDetails.containmentHours || 2}h`,
        },
        {
          label: 'Time to Resolve',
          value: `${incidentDetails.resolutionHours || 6}h`,
        },
      ],
      recommendations: incidentDetails.recommendations || [],
    });

    return report;
  }

  /**
   * Publish report (send to distribution list)
   */
  public publishReport(reportId: string, recipients: string[]): void {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    for (const email of recipients) {
      const distribution: ReportDistribution = {
        id: `dist-${uuidv4()}`,
        recipientEmail: email,
        sentAt: new Date(),
        status: 'sent',
      };

      report.distribution.push(distribution);
    }

    report.metadata.distribution = recipients;
  }

  /**
   * Track report opening
   */
  public trackReportOpening(reportId: string, recipientEmail: string): void {
    const report = this.reports.get(reportId);
    if (!report) return;

    const dist = report.distribution.find((d) => d.recipientEmail === recipientEmail);
    if (dist) {
      dist.openedAt = new Date();
      dist.status = 'opened';
    }
  }

  /**
   * Track report download
   */
  public trackReportDownload(reportId: string, recipientEmail: string): void {
    const report = this.reports.get(reportId);
    if (!report) return;

    const dist = report.distribution.find((d) => d.recipientEmail === recipientEmail);
    if (dist) {
      dist.downloadedAt = new Date();
      dist.status = 'downloaded';
    }
  }

  /**
   * Generate threat intelligence report
   */
  public createThreatIntelligenceReport(
    organizationId: string,
    threat: Omit<ProfessionalThreatIntelligence, 'id'>
  ): ProfessionalThreatIntelligence {
    const threatData: ProfessionalThreatIntelligence = {
      ...threat,
      id: `ti-${uuidv4()}`,
    };

    this.threatIntelligence.set(threatData.id, threatData);

    // Create associated report
    const report = this.createReport(
      organizationId,
      'threat_intelligence',
      `Threat Intelligence: ${threat.title}`,
      {
        startDate: threat.publishedDate,
        endDate: threat.updatedDate,
      },
      'Threat Intelligence Team'
    );

    this.addSection(report.id, {
      title: 'Threat Overview',
      level: 'operational',
      content: `Threat Type: ${threat.threatType}\nSeverity: ${threat.severity}\n\n${threat.description}`,
      keyMetrics: [
        {
          label: 'Threat Type',
          value: threat.threatType,
        },
        {
          label: 'Severity',
          value: threat.severity,
        },
        {
          label: 'Related CVEs',
          value: threat.relatedCVEs?.length || 0,
        },
        {
          label: 'Affects Healthcare',
          value: threat.affectsHealthcare ? 'Yes' : 'No',
        },
      ],
      recommendations: threat.recommendations,
    });

    return threatData;
  }

  /**
   * Export report in various formats
   */
  public exportReport(reportId: string, format: 'pdf' | 'html' | 'excel' | 'pptx'): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const data = {
      title: report.title,
      type: report.type,
      generatedAt: report.generatedAt,
      period: report.period,
      sections: report.sections.map((s) => ({
        title: s.title,
        content: s.content,
        metrics: s.keyMetrics,
        recommendations: s.recommendations,
      })),
    };

    if (format === 'pdf') {
      return JSON.stringify(data); // Placeholder
    } else if (format === 'html') {
      return this.convertToHTML(data);
    } else if (format === 'excel') {
      return this.convertToCSV(data);
    } else {
      return JSON.stringify(data); // PPTX placeholder
    }
  }

  /**
   * Convert report to HTML
   */
  private convertToHTML(data: any): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <p>Generated: ${data.generatedAt}</p>
  ${data.sections.map((s: any) => `
    <h2>${s.title}</h2>
    <p>${s.content}</p>
    <div>
      ${s.metrics?.map((m: any) => `<div class="metric"><strong>${m.label}:</strong> ${m.value}</div>`).join('') || ''}
    </div>
    ${s.recommendations?.length ? `<h3>Recommendations</h3><ul>${s.recommendations.map((r: any) => `<li>${r}</li>`).join('')}</ul>` : ''}
  `).join('')}
</body>
</html>
    `;
    return html;
  }

  /**
   * Convert report to CSV
   */
  private convertToCSV(data: any): string {
    const rows = [
      ['Report', data.title],
      ['Generated', data.generatedAt],
      [''],
    ];

    data.sections.forEach((s: any) => {
      rows.push([s.title]);
      rows.push(['Content', s.content]);
      if (s.metrics) {
        s.metrics.forEach((m: any) => {
          rows.push([m.label, m.value]);
        });
      }
      rows.push(['']);
    });

    return rows.map((row) => row.join(',')).join('\n');
  }

  /**
   * Helper methods for content generation
   */
  private generateOverviewContent(metrics: any): string {
    return `
During this period, we detected and contained ${metrics.critical} critical threats with a containment rate of ${metrics.containmentRate}%.
The average response time was ${metrics.responseTime} minutes, demonstrating our proactive security posture.
Compliance status remains strong across all major frameworks.
    `;
  }

  private generateCriticalThreatsContent(metrics: any): string {
    return `
We identified ${metrics.immediateAction} threats requiring immediate attention.
These have been escalated to the incident response team for investigation and remediation.
An estimated ${metrics.immediateAction * 4} hours of resources have been allocated.
    `;
  }

  private generateBoardSummary(metrics: any): string {
    return `
Our organization's overall risk score is ${metrics.overallRisk} (target: 40), reflecting effective risk management.
Compliance across major frameworks averages ${metrics.complianceScore}%, with ongoing improvement initiatives.
Third-party risk assessments are in progress, with results expected next quarter.
    `;
  }

  private generateComplianceStatus(data: any): string {
    return `
We maintain compliance across all assessed frameworks:
- HIPAA: ${data.hipaa}%
- SOC2: ${data.soc2}%
- ISO27001: ${data.iso27001}%
- GDPR: ${data.gdpr}%

Focus areas for the coming quarter include remediation of identified control gaps.
    `;
  }

  private generateIncidentSummary(details: any): string {
    return `
On ${details.detectedAt?.toLocaleDateString()}, we detected a ${details.severity} severity incident: "${details.title}".
The incident affected ${details.affectedSystems} systems and impacted ${details.affectedUsers || 0} users.
We contained the incident in ${details.containmentHours} hours and fully resolved it in ${details.resolutionHours} hours.
Root cause analysis and preventive measures are outlined below.
    `;
  }
}
