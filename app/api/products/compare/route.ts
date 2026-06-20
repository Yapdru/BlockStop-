import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedPaymentService, PRODUCTS } from '@/lib/billing/unified-payments';

export async function GET(req: NextRequest) {
  try {
    const paymentService = createUnifiedPaymentService();
    const products = paymentService.getAllProducts();

    // Create comparison matrix
    const allFeatures = new Set<string>();
    products.forEach(p => {
      p.features.forEach(f => allFeatures.add(f));
    });

    const comparisonMatrix = Array.from(allFeatures).map(feature => ({
      feature,
      free: PRODUCTS.free.features.includes(feature),
      neo: PRODUCTS.neo.features.includes(feature),
      pro: PRODUCTS.pro.features.includes(feature),
      office: PRODUCTS.office.features.includes(feature),
      health: PRODUCTS.health.features.includes(feature)
    }));

    return NextResponse.json({
      products,
      comparisonMatrix,
      pricing: {
        free: { monthly: 0, annual: 0 },
        neo: { monthly: 99, annual: 999 },
        pro: { monthly: 299, annual: 2999 },
        office: { monthly: 499, annual: 4999 },
        health: { monthly: 599, annual: 5999 }
      }
    });
  } catch (error) {
    console.error('Product comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison' },
      { status: 500 }
    );
  }
}
