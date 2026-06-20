import { NextRequest, NextResponse } from 'next/server';
import { createPayTMService } from '@/lib/billing/paytm-service';

export async function POST(req: NextRequest) {
  try {
    const { ORDER_ID, TXNID, CHECKSUM, STATUS } = await req.json();

    if (!ORDER_ID || !TXNID || !CHECKSUM) {
      return NextResponse.json(
        { error: 'Missing required PayTM fields' },
        { status: 400 }
      );
    }

    const paytmService = createPayTMService();

    // Verify payment
    const isValid = await paytmService.verifyPayment(ORDER_ID, TXNID, CHECKSUM);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed', success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed',
      orderId: ORDER_ID,
      transactionId: TXNID
    });
  } catch (error) {
    console.error('PayTM callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Callback processing failed', success: false },
      { status: 500 }
    );
  }
}
