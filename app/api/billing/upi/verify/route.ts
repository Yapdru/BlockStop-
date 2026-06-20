import { NextRequest, NextResponse } from 'next/server';
import { createUPIService } from '@/lib/billing/upi-service';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, referenceId } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const upiService = createUPIService();

    // Get transaction to verify ownership
    const transaction = await upiService.getTransactionStatus(transactionId);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to verify this transaction' },
        { status: 403 }
      );
    }

    // Verify payment
    const verified = await upiService.verifyUPIPayment(transactionId, referenceId);

    if (!verified) {
      return NextResponse.json(
        { error: 'Payment verification failed', success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and PRO tier activated',
      transactionId,
      tier: 'pro'
    });
  } catch (error) {
    console.error('UPI verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
