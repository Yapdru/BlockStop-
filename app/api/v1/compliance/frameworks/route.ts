/**
 * Compliance Frameworks API Routes
 * Endpoints for managing and retrieving compliance frameworks
 */

import { NextRequest, NextResponse } from 'next/server';
import { ComplianceFrameworkEngine } from '@/lib/compliance/framework-engine';
import { ComplianceFrameworkType } from '@/lib/compliance/types/compliance-types';

const engine = new ComplianceFrameworkEngine('org-default');

/**
 * GET /api/v1/compliance/frameworks
 * Get all available frameworks or specific framework
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frameworkType = searchParams.get('type') as ComplianceFrameworkType;
    const organizationId = request.headers.get('x-org-id') || 'default';

    if (frameworkType) {
      // Get specific framework
      const framework = engine.getFramework(frameworkType);
      if (!framework) {
        return NextResponse.json(
          { error: `Framework ${frameworkType} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: framework.id,
          type: framework.type,
          name: framework.name,
          version: framework.version,
          description: framework.description,
          totalControls: framework.totalControls,
          controlCategories: framework.controlCategories,
          publishedBy: framework.publishedBy,
        },
      });
    } else {
      // Get all frameworks
      const frameworks = engine.getAllFrameworks();
      const frameworkList = frameworks.map((f) => ({
        id: f.id,
        type: f.type,
        name: f.name,
        version: f.version,
        totalControls: f.totalControls,
        controlCategories: f.controlCategories,
      }));

      return NextResponse.json({
        success: true,
        data: frameworkList,
        total: frameworkList.length,
      });
    }
  } catch (error) {
    console.error('Error fetching frameworks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch frameworks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/frameworks/enable
 * Enable frameworks for organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const organizationId = request.headers.get('x-org-id') || 'default';
    const { frameworkTypes } = body;

    if (!Array.isArray(frameworkTypes)) {
      return NextResponse.json(
        { error: 'frameworkTypes must be an array' },
        { status: 400 }
      );
    }

    engine.setOrganizationFrameworks(organizationId, frameworkTypes);

    const enabledFrameworks = engine.getOrganizationFrameworks(organizationId);

    return NextResponse.json({
      success: true,
      message: `${enabledFrameworks.length} frameworks enabled for organization`,
      data: {
        organizationId,
        enabledFrameworks: enabledFrameworks.map((f) => ({
          type: f.type,
          name: f.name,
          totalControls: f.totalControls,
        })),
      },
    });
  } catch (error) {
    console.error('Error enabling frameworks:', error);
    return NextResponse.json(
      { error: 'Failed to enable frameworks' },
      { status: 500 }
    );
  }
}
