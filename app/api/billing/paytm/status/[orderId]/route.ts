import { NextRequest, NextResponse } from 'next/server';
import { createPayTMService } from '@/lib/billing/paytm-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paytmService = createPayTMService();
    const order = await paytmService.getOrderStatus(params.orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user owns this order
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      order,
      status: order.status,
      isCompleted: order.status === 'success'
    });
  } catch (error) {
    console.error('Order status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}
