import { NextRequest, NextResponse } from 'next/server';
import { createUPIService } from '@/lib/billing/upi-service';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await req.json();

    if (!planType || !['pro_monthly', 'pro_annual'].includes(planType)) {
      return NextResponse.json(
        { error: 'Valid planType (pro_monthly or pro_annual) is required' },
        { status: 400 }
      );
    }

    const upiService = createUPIService();
    const transaction = await upiService.generateUPITransaction(userId, planType as any);

    return NextResponse.json({
      transactionId: transaction.transactionId,
      qrCode: transaction.qrCode,
      deepLink: transaction.deepLink,
      upiId: transaction.upiId,
      amount: transaction.amount,
      currency: 'INR',
      planType,
      instructions: [
        'Option 1: Scan QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)',
        'Option 2: Share UPI ID: ' + transaction.upiId,
        'Option 3: Use deep link to open UPI app directly'
      ]
    }, { status: 201 });
  } catch (error) {
    console.error('UPI generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate UPI transaction' },
      { status: 500 }
    );
  }
}
