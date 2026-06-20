/**
 * Marketplace Certification API Routes
 */

import { certificationEngine } from '@/lib/marketplace/certification-engine';
import { CERTIFICATION_TIERS } from '@/lib/marketplace/certification-levels';
import { securityAuditor } from '@/lib/marketplace/security-audit';
import { performanceAuditor } from '@/lib/marketplace/performance-audit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/certifications
 * List certifications
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const developerId = searchParams.get('developerId');
    const level = searchParams.get('level');

    // Return certifications based on filters
    const certifications = developerId
      ? certificationEngine.getDeveloperCertifications(developerId)
      : [];

    return NextResponse.json({
      success: true,
      data: certifications,
      count: certifications.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/certifications
 * Submit plugin for certification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pluginId,
      pluginName,
      developerId,
      version,
      description,
      targetLevel,
      supportContactEmail,
    } = body;

    // Validate required fields
    if (!pluginId || !developerId || !version) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Submit for certification
    const certification = await certificationEngine.submitForCertification({
      pluginId,
      pluginName,
      developerId,
      version,
      description,
      targetLevel: targetLevel || 'bronze',
      supportContactEmail,
    });

    return NextResponse.json(
      {
        success: true,
        data: certification,
        message: 'Plugin submitted for certification',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit for certification' },
      { status: 500 }
    );
  }
}
