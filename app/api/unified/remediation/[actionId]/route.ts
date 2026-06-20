import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT * FROM remediation_actions WHERE id = $1 AND user_id = $2`,
      [params.actionId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json({ action: result.rows[0] });
  } catch (error) {
    console.error('Get action error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, result: actionResult } = await req.json();

    const db = getDb();

    // Verify user owns this action
    const verifyResult = await db.query(
      `SELECT * FROM remediation_actions WHERE id = $1 AND user_id = $2`,
      [params.actionId, userId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Update action status
    const updateResult = await db.query(
      `UPDATE remediation_actions SET status = $1, result = $2, executed_at = NOW() WHERE id = $3 RETURNING *`,
      [status, actionResult ? JSON.stringify(actionResult) : null, params.actionId]
    );

    return NextResponse.json({
      action: updateResult.rows[0],
      success: true
    });
  } catch (error) {
    console.error('Update action error:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { actionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Verify user owns this action
    const verifyResult = await db.query(
      `SELECT * FROM remediation_actions WHERE id = $1 AND user_id = $2`,
      [params.actionId, userId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const action = verifyResult.rows[0];

    // Execute the action based on its type
    let result = { status: 'executed' };

    if (action.action_type === 'isolate_and_alert') {
      result = await executeIsolationAction(userId, action.threat_id);
    } else if (action.action_type === 'quarantine_and_notify') {
      result = await executeQuarantineAction(userId, action.threat_id);
    } else if (action.action_type === 'monitor_and_log') {
      result = await executeMonitoringAction(userId, action.threat_id);
    } else if (action.action_type === 'log_only') {
      result = { status: 'logged' };
    }

    // Update action with execution result
    const updateResult = await db.query(
      `UPDATE remediation_actions SET status = 'completed', result = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(result), params.actionId]
    );

    return NextResponse.json({
      action: updateResult.rows[0],
      executionResult: result,
      success: true
    });
  } catch (error) {
    console.error('Execute action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

async function executeIsolationAction(userId: string, threatId: string): Promise<any> {
  // In production, this would trigger actual isolation procedures
  // (network isolation, process termination, etc.)
  return {
    status: 'isolated',
    message: 'System isolated from network',
    timestamp: new Date()
  };
}

async function executeQuarantineAction(userId: string, threatId: string): Promise<any> {
  // In production, this would quarantine files/processes
  return {
    status: 'quarantined',
    message: 'Threat quarantined',
    timestamp: new Date()
  };
}

async function executeMonitoringAction(userId: string, threatId: string): Promise<any> {
  // In production, this would enable enhanced monitoring
  return {
    status: 'monitoring',
    message: 'Enhanced monitoring enabled',
    timestamp: new Date()
  };
}
