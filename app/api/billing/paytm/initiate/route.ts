import { NextRequest, NextResponse } from 'next/server';
import { createPayTMService } from '@/lib/billing/paytm-service';

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

    const paytmService = createPayTMService();

    // Determine amount based on plan
    const amounts = {
      pro_monthly: 99, // ₹99 per month
      pro_annual: 999 // ₹999 per year
    };

    const amount = amounts[planType as keyof typeof amounts];

    const order = await paytmService.initializeOrder(userId, amount, planType as any);

    return NextResponse.json({
      orderId: order.orderId,
      paytmUrl: order.paytmUrl,
      checksum: order.checksum,
      amount,
      currency: 'INR'
    }, { status: 201 });
  } catch (error) {
    console.error('PayTM initiation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
