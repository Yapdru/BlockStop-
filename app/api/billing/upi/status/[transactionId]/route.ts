import { NextRequest, NextResponse } from 'next/server';
import { createUPIService } from '@/lib/billing/upi-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const upiService = createUPIService();
    const transaction = await upiService.getTransactionStatus(params.transactionId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user owns this transaction
    if (transaction.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this transaction' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      transaction,
      status: transaction.status,
      isPending: transaction.status === 'pending',
      isCompleted: transaction.status === 'success',
      isFailed: transaction.status === 'failed'
    });
  } catch (error) {
    console.error('UPI status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction status' },
      { status: 500 }
    );
  }
}
