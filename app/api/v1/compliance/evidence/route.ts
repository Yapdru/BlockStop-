/**
 * Compliance Evidence API Routes
 * Endpoints for managing evidence collection and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { EvidenceStore } from '@/lib/evidence/storage/evidence-store';
import { EvidenceType } from '@/lib/compliance/types/compliance-types';

const evidenceStore = new EvidenceStore();

/**
 * GET /api/v1/compliance/evidence
 * Get evidence items with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const { searchParams } = new URL(request.url);
    const controlId = searchParams.get('controlId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    let results = evidenceStore.getOrganizationEvidence(organizationId);

    if (controlId) {
      results = results.filter((e) => e.controlId === controlId);
    }

    if (type) {
      results = results.filter((e) => e.type === type);
    }

    if (search) {
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: results.map((e) => ({
        id: e.id,
        controlId: e.controlId,
        type: e.type,
        title: e.title,
        uploadedAt: e.uploadedAt,
        isValid: e.isValid,
        expiryDate: e.expiryDate,
      })),
      total: results.length,
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/evidence
 * Upload evidence item
 */
export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();

    const {
      controlId,
      type,
      title,
      description,
      location,
      expiryDate,
    } = body;

    if (!controlId || !type || !title) {
      return NextResponse.json(
        { error: 'controlId, type, and title are required' },
        { status: 400 }
      );
    }

    const evidence = {
      id: `evidence-${Date.now()}`,
      controlId,
      type: type as EvidenceType,
      title,
      description: description || '',
      location: location || '',
      uploadedBy: userId,
      uploadedAt: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      isValid: true,
      linkedControls: [controlId],
      relatedEvidence: [],
    };

    evidenceStore.storeEvidence(organizationId, evidence, userId);

    return NextResponse.json({
      success: true,
      data: {
        id: evidence.id,
        controlId: evidence.controlId,
        type: evidence.type,
        title: evidence.title,
      },
    });
  } catch (error) {
    console.error('Error uploading evidence:', error);
    return NextResponse.json(
      { error: 'Failed to upload evidence' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/compliance/evidence/statistics
 * Get evidence statistics
 */
export async function GET_statistics(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';

    const stats = evidenceStore.getStatistics(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        total: stats.total,
        valid: stats.valid,
        expired: stats.expired,
        expiring: stats.expiring,
        byType: Array.from(stats.byType.entries()).map(([type, count]) => ({
          type,
          count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/compliance/evidence/verify
 * Verify evidence item
 */
export async function POST_verify(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-org-id') || 'default';
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();

    const { evidenceId, isValid, notes } = body;

    if (!evidenceId) {
      return NextResponse.json(
        { error: 'evidenceId is required' },
        { status: 400 }
      );
    }

    evidenceStore.updateEvidence(
      evidenceId,
      {
        isValid,
        validationNotes: notes,
        verifiedBy: userId,
        verificationDate: new Date(),
      },
      userId,
      'Evidence verification'
    );

    return NextResponse.json({
      success: true,
      message: 'Evidence verified successfully',
    });
  } catch (error) {
    console.error('Error verifying evidence:', error);
    return NextResponse.json(
      { error: 'Failed to verify evidence' },
      { status: 500 }
    );
  }
}
