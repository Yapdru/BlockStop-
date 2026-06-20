/**
 * Compliance Reports API Routes
 * Endpoints for generating and managing compliance reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/reporting/generators/report-generator';
import { ComplianceScorer } from '@/lib/compliance/scoring/compliance-scorer';
import { ComplianceFrameworkType } from '@/lib/compliance/types/compliance-types';

const reportGenerator = new ReportGenerator();
const scorer = new ComplianceScorer();

/**
 * POST /api/v1/compliance/reports/generate
 * Generate compliance report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const organizationId = request.headers.get('x-org-id') || 'default';
    const {
      framework,
      controls,
      score,
      findings,
      organizationName,
      reportType,
      includeExecutiveSummary,
      confidentiality,
    } = body;

    if (!framework || !controls) {
      return NextResponse.json(
        { error: 'framework and controls are required' },
        { status: 400 }
      );
    }

    const reportConfig = {
      organizationName: organizationName || 'Organization',
      reportDate: new Date(),
      reportingPeriod: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
      includeExecutiveSummary: includeExecutiveSummary !== false,
      includeDetnote: true,
      includeAuditTrail: true,
      confidentiality: confidentiality || 'INTERNAL',
      recipients: [],
    };

    const report = reportGenerator.generateReport(
      framework,
      controls,
      score,
      findings || [],
      reportConfig
    );

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.reportId,
        framework: report.frameworkId,
        score: report.overallScore.percentage.toFixed(1),
        keyFindings: report.keyFindings.length,
        recommendations: report.recommendations.length,
        generatedAt: report.generatedDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/compliance/reports
 * Get reports for organization
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework');

    // Mock data - would be fetched from database
    const reports = [
      {
        id: 'report-001',
        framework: framework || 'SOC2',
        title: 'SOC 2 Compliance Report',
        generatedAt: new Date().toISOString(),
        score: 75.5,
        status: 'COMPLETED',
      },
    ];

    return NextResponse.json({
      success: true,
      data: reports,
      total: reports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/compliance/reports/:reportId/export
 * Export report in specified format
 */
export async function GET_export(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const format = (searchParams.get('format') || 'PDF') as 'JSON' | 'CSV' | 'HTML';

    if (!reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 }
      );
    }

    // Mock report data
    const mockReport = {
      reportId,
      frameworkId: 'SOC2',
      reportType: 'DETAILED_ASSESSMENT',
      overallScore: {
        percentage: 75.5,
        totalScore: 755,
        maxScore: 1000,
      },
      keyFindings: [],
      recommendations: [],
      auditFindings: [],
      generatedDate: new Date(),
      executiveSummary: 'Mock report summary',
      riskAssessment: {
        criticalRisks: 2,
        highRisks: 5,
        mediumRisks: 10,
        lowRisks: 15,
        overallRiskLevel: 'MEDIUM',
        riskTrend: 'STABLE',
        mitigationStatus: 'In progress',
      },
      trendAnalysis: {
        period: 'QUARTERLY',
        dataPoints: [],
        direction: 'STABLE',
        percentageChange: 0,
        insights: [],
      },
    };

    if (format === 'JSON') {
      return NextResponse.json({
        success: true,
        data: mockReport,
      });
    } else if (format === 'HTML') {
      const html = reportGenerator.exportHTML(mockReport as any);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="report-${reportId}.html"`,
        },
      });
    } else if (format === 'CSV') {
      const csv = reportGenerator.exportCSV(mockReport as any);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${reportId}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}
