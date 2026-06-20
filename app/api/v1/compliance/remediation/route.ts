/**
 * Compliance Remediation API Routes
 * Endpoints for managing remediation actions and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { RemediationActionEngine } from '@/lib/remediation/actions/action-engine';

const remediationEngine = new RemediationActionEngine();

/**
 * GET /api/v1/compliance/remediation
 * Get remediation actions for organization
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue') === 'true';

    let actions = remediationEngine.getOrganizationActions(
      organizationId,
      status as any
    );

    if (overdue) {
      actions = remediationEngine.getOverdueActions(organizationId);
    }

    return NextResponse.json({
      success: true,
      data: actions.map((a) => ({
        id: a.id,
        title: a.description,
        status: a.status,
        priority: a.priority,
        dueDate: a.targetDate,
        assignedTo: a.assignedTo,
        estimatedCost: a.estimatedCost,
      })),
      total: actions.length,
    });
  } catch (error) {
    console.error('Error fetching remediation actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remediation actions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/remediation
 * Create remediation action
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();

    const {
      findingId,
      description,
      action,
      priority,
      dueDate,
      assignedTo,
      estimatedCost,
    } = body;

    if (!findingId || !description || !dueDate) {
      return NextResponse.json(
        { error: 'findingId, description, and dueDate are required' },
        { status: 400 }
      );
    }

    const newAction = {
      id: `action-${Date.now()}`,
      findingId,
      description,
      action: action || description,
      expectedOutcome: 'Remediation completed',
      assignedTo: assignedTo || '',
      assignedDate: new Date(),
      targetDate: new Date(dueDate),
      status: 'PLANNED' as const,
      priority: (priority || 'MEDIUM') as any,
      estimatedCost: estimatedCost || 0,
      estimatedEffort: '5 days',
    };

    return NextResponse.json({
      success: true,
      data: {
        id: newAction.id,
        findingId: newAction.findingId,
        description: newAction.description,
        status: newAction.status,
      },
    });
  } catch (error) {
    console.error('Error creating remediation action:', error);
    return NextResponse.json(
      { error: 'Failed to create remediation action' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/compliance/remediation/:actionId
 * Update remediation action status
 */
export async function PUT(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();

    const { actionId, status, evidence } = body;

    if (!actionId || !status) {
      return NextResponse.json(
        { error: 'actionId and status are required' },
        { status: 400 }
      );
    }

    const updatedAction = remediationEngine.updateActionStatus(
      actionId,
      status,
      evidence
    );

    if (!updatedAction) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAction.id,
        status: updatedAction.status,
        completionDate: updatedAction.completionDate,
      },
    });
  } catch (error) {
    console.error('Error updating remediation action:', error);
    return NextResponse.json(
      { error: 'Failed to update remediation action' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/compliance/remediation/statistics
 * Get remediation statistics
 */
export async function GET_statistics(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';

    const stats = remediationEngine.getRemediationStats(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        total: stats.totalActions,
        completed: stats.completed,
        inProgress: stats.inProgress,
        planned: stats.planned,
        overdue: stats.overdue,
        totalCost: stats.totalCost,
        averageCost: Math.round(stats.averageCost),
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/remediation/:actionId/assign
 * Assign remediation action to user
 */
export async function POST_assign(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionId, userId, targetDate } = body;

    if (!actionId || !userId) {
      return NextResponse.json(
        { error: 'actionId and userId are required' },
        { status: 400 }
      );
    }

    const updatedAction = remediationEngine.assignAction(
      actionId,
      userId,
      targetDate ? new Date(targetDate) : undefined
    );

    if (!updatedAction) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAction.id,
        assignedTo: updatedAction.assignedTo,
        targetDate: updatedAction.targetDate,
      },
    });
  } catch (error) {
    console.error('Error assigning action:', error);
    return NextResponse.json(
      { error: 'Failed to assign action' },
      { status: 500 }
    );
  }
}
