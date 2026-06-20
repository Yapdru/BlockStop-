/**
 * Compliance Controls API Routes
 * Endpoints for managing controls and compliance status
 */

import { NextRequest, NextResponse } from 'next/server';
import { ControlRegistry } from '@/lib/compliance/controls/control-registry';
import { ComplianceFrameworkType, ControlStatus } from '@/lib/compliance/types/compliance-types';
import { ComplianceScorer } from '@/lib/compliance/scoring/compliance-scorer';

const registry = new ControlRegistry();
const scorer = new ComplianceScorer();

/**
 * GET /api/v1/compliance/controls
 * Get controls with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework') as ComplianceFrameworkType;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let controls = registry.getAllControls();

    if (framework) {
      controls = registry.getControlsByFramework(framework);
    }

    if (category) {
      controls = registry.getControlsByCategory(category);
    }

    if (search) {
      controls = registry.searchControls(search);
    }

    return NextResponse.json({
      success: true,
      data: controls.map((c) => ({
        id: c.id,
        controlNumber: c.controlNumber,
        title: c.title,
        category: c.category,
        severity: c.severity,
        framework: c.frameworkReferences[0]?.framework,
      })),
      total: controls.length,
    });
  } catch (error) {
    console.error('Error fetching controls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch controls' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/controls/score
 * Calculate compliance score for controls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { controls, controlStatuses, useRiskWeighting } = body;

    if (!controls || !Array.isArray(controls)) {
      return NextResponse.json(
        { error: 'controls array is required' },
        { status: 400 }
      );
    }

    const statusMap = new Map(
      Object.entries(controlStatuses || {})
        .map(([controlId, status]) => [controlId, status as ControlStatus])
    );

    const score = scorer.calculateScore(controls, statusMap, useRiskWeighting);

    return NextResponse.json({
      success: true,
      data: {
        percentage: score.percentage,
        totalScore: score.totalScore,
        maxScore: score.maxScore,
        trend: score.trend,
        categoryBreakdown: Array.from(score.categoryScores.values()).map((cs) => ({
          category: cs.category,
          percentage: cs.percentage,
          compliant: cs.compliantCount,
          nonCompliant: cs.nonCompliantCount,
        })),
      },
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}
