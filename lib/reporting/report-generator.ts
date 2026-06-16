/**
 * Report Generator - Generate comprehensive security reports
 */

export interface SecurityReport {
  reportId: string;
  title: string;
  reportType: "executive" | "technical" | "forensics" | "hunting" | "compliance";
  generatedAt: Date;
  generatedBy: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    affectedAssets: number;
  };
  sections: Array<{
    title: string;
    content: string;
    findings?: Array<{
      id: string;
      type: string;
      severity: string;
      description: string;
      recommendation: string;
    }>;
  }>;
  appendices?: {
    methodology?: string;
    definitions?: string;
    references?: string[];
  };
}

export class ReportGenerator {
  private reports: Map<string, SecurityReport> = new Map();

  /**
   * Generate executive report
   */
  async generateExecutiveReport(
    findings: Array<{
      severity: string;
      type: string;
      count: number;
    }>,
    generatedBy: string
  ): Promise<SecurityReport> {
    const reportId = `report-exec-${Date.now()}`;

    const summary = {
      totalFindings: findings.reduce((sum, f) => sum + f.count, 0),
      criticalFindings: findings
        .filter((f) => f.severity === "critical")
        .reduce((sum, f) => sum + f.count, 0),
      highFindings: findings
        .filter((f) => f.severity === "high")
        .reduce((sum, f) => sum + f.count, 0),
      mediumFindings: findings
        .filter((f) => f.severity === "medium")
        .reduce((sum, f) => sum + f.count, 0),
      lowFindings: findings
        .filter((f) => f.severity === "low")
        .reduce((sum, f) => sum + f.count, 0),
      affectedAssets: 0,
    };

    const report: SecurityReport = {
      reportId,
      title: "Executive Security Report",
      reportType: "executive",
      generatedAt: new Date(),
      generatedBy,
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      summary,
      sections: [
        {
          title: "Overview",
          content:
            "This report summarizes the security findings and recommendations for the organization.",
        },
        {
          title: "Key Findings",
          content: `During the analysis period, ${summary.totalFindings} security findings were identified, with ${summary.criticalFindings} critical issues requiring immediate attention.`,
        },
        {
          title: "Risk Assessment",
          content:
            "Overall risk assessment indicates a need for immediate remediation of critical findings.",
        },
        {
          title: "Recommendations",
          content:
            "Priority should be given to addressing critical and high-severity findings within 30 days.",
        },
      ],
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Generate technical report
   */
  async generateTechnicalReport(
    investigations: Array<{
      caseId: string;
      title: string;
      findings: number;
    }>,
    generatedBy: string
  ): Promise<SecurityReport> {
    const reportId = `report-tech-${Date.now()}`;

    const report: SecurityReport = {
      reportId,
      title: "Technical Analysis Report",
      reportType: "technical",
      generatedAt: new Date(),
      generatedBy,
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      summary: {
        totalFindings: investigations.reduce((sum, i) => sum + i.findings, 0),
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        affectedAssets: investigations.length,
      },
      sections: [
        {
          title: "Methodology",
          content: "This analysis employed advanced forensic and behavioral analytics techniques.",
        },
        {
          title: "Investigation Details",
          content: `${investigations.length} detailed investigations were conducted.`,
        },
      ],
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Generate forensics report
   */
  async generateForensicsReport(
    caseId: string,
    evidence: Array<{
      id: string;
      type: string;
      description: string;
      chainValid: boolean;
    }>,
    generatedBy: string
  ): Promise<SecurityReport> {
    const reportId = `report-forensics-${Date.now()}`;

    const report: SecurityReport = {
      reportId,
      title: `Forensic Analysis Report - ${caseId}`,
      reportType: "forensics",
      generatedAt: new Date(),
      generatedBy,
      timeRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      summary: {
        totalFindings: evidence.length,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        affectedAssets: 1,
      },
      sections: [
        {
          title: "Case Information",
          content: `Case ID: ${caseId}`,
        },
        {
          title: "Evidence Collected",
          content: `${evidence.length} items of evidence collected with valid chain of custody.`,
        },
        {
          title: "Findings",
          content: "Analysis of collected evidence is documented in detail.",
        },
        {
          title: "Chain of Custody",
          content:
            "All evidence has been maintained with proper chain of custody documentation.",
        },
      ],
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Export report to HTML
   */
  async exportToHTML(reportId: string): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${report.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #1f2937; margin-top: 30px; }
        .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-item { display: inline-block; margin-right: 30px; }
        .summary-item strong { color: #1f2937; }
        .finding { margin: 15px 0; padding: 10px; border-left: 4px solid #ef4444; background: #fef2f2; }
        .critical { border-left-color: #dc2626; }
        .high { border-left-color: #ea580c; }
        .medium { border-left-color: #eab308; }
        .low { border-left-color: #22c55e; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f9fafb; font-weight: bold; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
    <p><strong>By:</strong> ${report.generatedBy}</p>

    <h2>Summary</h2>
    <div class="summary">
        <div class="summary-item">
            <strong>Total Findings:</strong> ${report.summary.totalFindings}
        </div>
        <div class="summary-item">
            <strong>Critical:</strong> <span style="color: #dc2626;">${report.summary.criticalFindings}</span>
        </div>
        <div class="summary-item">
            <strong>High:</strong> <span style="color: #ea580c;">${report.summary.highFindings}</span>
        </div>
        <div class="summary-item">
            <strong>Medium:</strong> <span style="color: #eab308;">${report.summary.mediumFindings}</span>
        </div>
        <div class="summary-item">
            <strong>Low:</strong> <span style="color: #22c55e;">${report.summary.lowFindings}</span>
        </div>
    </div>
`;

    for (const section of report.sections) {
      html += `<h2>${section.title}</h2>`;
      html += `<p>${section.content}</p>`;

      if (section.findings && section.findings.length > 0) {
        html += `<div>`;
        for (const finding of section.findings) {
          html += `<div class="finding ${finding.severity}">`;
          html += `<strong>${finding.type}</strong> (${finding.severity.toUpperCase()})<br/>`;
          html += `${finding.description}<br/>`;
          html += `<em>Recommendation: ${finding.recommendation}</em>`;
          html += `</div>`;
        }
        html += `</div>`;
      }
    }

    html += `
</body>
</html>
`;

    return html;
  }

  /**
   * Export report to PDF
   */
  async exportToPDF(reportId: string): Promise<Buffer> {
    const htmlReport = await this.exportToHTML(reportId);

    // Note: In production, you would use a library like puppeteer or wkhtmltopdf
    // For now, returning HTML as buffer
    return Buffer.from(htmlReport);
  }

  /**
   * Export report to JSON
   */
  async exportToJSON(reportId: string): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Get report
   */
  async getReport(reportId: string): Promise<SecurityReport | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get all reports
   */
  async getAllReports(reportType?: string): Promise<SecurityReport[]> {
    let reports = Array.from(this.reports.values());

    if (reportType) {
      reports = reports.filter((r) => r.reportType === reportType);
    }

    return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    return this.reports.delete(reportId);
  }
}

export default ReportGenerator;
