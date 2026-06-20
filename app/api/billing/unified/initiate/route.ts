import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedPaymentService } from '@/lib/billing/unified-payments';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { method, product, frequency } = await req.json();

    if (!method || !['upi', 'bhim', 'paytm', 'apple_pay', 'credit_card', 'debit_card'].includes(method)) {
      return NextResponse.json(
        { error: 'Valid payment method required (upi, bhim, paytm, apple_pay, credit_card, debit_card)' },
        { status: 400 }
      );
    }

    if (!product || !['free', 'neo', 'pro', 'office', 'health', 'max'].includes(product)) {
      return NextResponse.json(
        { error: 'Valid product required (free, neo, pro, office, health, max)' },
        { status: 400 }
      );
    }

    if (product === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    const paymentService = createUnifiedPaymentService();
    const transaction = await paymentService.processPayment(
      userId,
      method as any,
      product as any,
      frequency || 'monthly'
    );

    const productConfig = paymentService.getProductConfig(product as any);

    const instructionsMap: Record<string, string> = {
      upi: 'Scan QR or use UPI ID',
      bhim: 'Open BHIM app or use deep link',
      paytm: 'Redirect to PayTM gateway',
      apple_pay: 'Use Apple Pay on iOS/Mac',
      credit_card: 'Enter credit card details on PayTM',
      debit_card: 'Enter debit card details on PayTM'
    };

    return NextResponse.json({
      transactionId: transaction.id,
      product: productConfig,
      amount: transaction.amount,
      currency: transaction.currency,
      method,
      frequency,
      paymentData: transaction.metadata,
      instructions: instructionsMap[method]
    }, { status: 201 });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment initiation failed' },
      { status: 500 }
    );
  }
}
