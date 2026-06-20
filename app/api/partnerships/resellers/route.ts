/**
 * Reseller Management API Routes
 */

import { resellerManagement } from '@/lib/partnerships/reseller-management';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/partnerships/resellers
 * Get reseller information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resellerId = searchParams.get('resellerId');
    const pending = searchParams.get('pending') === 'true';

    if (resellerId) {
      const reseller = resellerManagement.getReseller(resellerId);
      if (!reseller) {
        return NextResponse.json(
          { error: 'Reseller not found' },
          { status: 404 }
        );
      }

      const metrics = resellerManagement.getResellerMetrics(resellerId);

      return NextResponse.json({
        success: true,
        data: {
          reseller,
          metrics,
        },
      });
    }

    if (pending) {
      const applications = resellerManagement.getPendingApplications();
      return NextResponse.json({
        success: true,
        data: applications,
        count: applications.length,
      });
    }

    const resellers = resellerManagement.getAllResellers();

    return NextResponse.json({
      success: true,
      data: resellers,
      count: resellers.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch resellers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partnerships/resellers
 * Register new reseller
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactEmail, contactPhone, address, metadata } = body;

    if (!companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'Company name and contact email required' },
        { status: 400 }
      );
    }

    const reseller = resellerManagement.registerReseller(
      companyName,
      contactEmail,
      contactPhone,
      address,
      metadata
    );

    return NextResponse.json(
      {
        success: true,
        data: reseller,
        message: 'Reseller registered for approval',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to register reseller' },
      { status: 500 }
    );
  }
}
