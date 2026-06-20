import { NextRequest, NextResponse } from 'next/server';
import { PayTMWebhookHandler } from '@/lib/billing/paytm-webhook';

/**
 * POST /api/webhooks/paytm
 * 
 * Receives PayTM payment notifications
 * Automatically verifies payments and issues JWT tokens
 */
export async function POST(req: NextRequest) {
  try {
    // Parse webhook payload
    const body = await req.json();

    console.log('📥 PayTM Webhook received:', {
      txnId: body.TXNID,
      orderId: body.ORDERID,
      email: body.EMAIL,
      amount: body.TXNAMOUNT,
      status: body.STATUS,
    });

    // Process webhook
    const result = await PayTMWebhookHandler.handleWebhook(body);

    if (!result.success) {
      console.error('❌ Webhook processing failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // ✅ Payment verified! JWT token issued
    console.log('✅ Payment verified successfully');
    console.log(`✅ JWT Token: ${result.token?.slice(0, 30)}...`);

    // Return success to PayTM
    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified',
        token: result.token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing PayTM webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/paytm
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'PayTM webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
