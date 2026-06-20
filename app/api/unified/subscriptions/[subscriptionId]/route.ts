import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Verify user owns this subscription
    const verifyResult = await db.query(
      `SELECT * FROM scan_subscriptions WHERE id = $1 AND user_id = $2`,
      [params.subscriptionId, userId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Delete the subscription
    await db.query(
      `DELETE FROM scan_subscriptions WHERE id = $1`,
      [params.subscriptionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive, schedule } = await req.json();

    const db = getDb();

    // Verify user owns this subscription
    const verifyResult = await db.query(
      `SELECT * FROM scan_subscriptions WHERE id = $1 AND user_id = $2`,
      [params.subscriptionId, userId]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Update the subscription
    const updateResult = await db.query(
      `UPDATE scan_subscriptions SET is_active = COALESCE($1, is_active), schedule = COALESCE($2, schedule), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [isActive !== undefined ? isActive : null, schedule || null, params.subscriptionId]
    );

    return NextResponse.json({
      subscription: updateResult.rows[0],
      success: true
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
