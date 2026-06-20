import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedPaymentService, PRODUCTS } from '@/lib/billing/unified-payments';

export async function GET(req: NextRequest) {
  try {
    const paymentService = createUnifiedPaymentService();
    const products = paymentService.getAllProducts();

    return NextResponse.json({
      products,
      total: products.length,
      available: ['free', 'neo', 'pro', 'office', 'health']
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { product } = await req.json();

    if (!product || !PRODUCTS[product as keyof typeof PRODUCTS]) {
      return NextResponse.json(
        { error: 'Invalid product' },
        { status: 400 }
      );
    }

    const paymentService = createUnifiedPaymentService();
    const config = paymentService.getProductConfig(product as any);

    return NextResponse.json({ product: config });
  } catch (error) {
    console.error('Product detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
