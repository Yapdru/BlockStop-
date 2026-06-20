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
// GET_export endpoint moved to separate route file
