/**
 * White-Label Tenants API Routes
 */

import { multiTenancyEngine } from '@/lib/white-label/multi-tenancy-engine';
import { brandingEngine } from '@/lib/white-label/branding-engine';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/white-label/tenants
 * Get tenant information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const domain = searchParams.get('domain');

    let tenant;

    if (tenantId) {
      tenant = multiTenancyEngine.getTenant(tenantId);
    } else if (domain) {
      tenant = multiTenancyEngine.getTenantByDomain(domain);
    } else {
      return NextResponse.json(
        { error: 'Tenant ID or domain required' },
        { status: 400 }
      );
    }

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const branding = brandingEngine.getOrCreateBranding(tenant.tenantId);
    const usage = multiTenancyEngine.getTenantUsage(tenant.tenantId);

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        branding,
        usage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/white-label/tenants
 * Create new tenant
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tier, metadata } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tenant name required' },
        { status: 400 }
      );
    }

    const tenant = multiTenancyEngine.createTenant(name, tier || 'starter', metadata);

    // Initialize branding
    brandingEngine.getOrCreateBranding(tenant.tenantId);

    return NextResponse.json(
      {
        success: true,
        data: tenant,
        message: 'Tenant created',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
