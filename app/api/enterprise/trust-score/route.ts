/**
 * BlockStop Phase 28.2 - Zero-Trust Device Trust Score API
 * /api/enterprise/trust-score
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    const trustScore = {
      deviceId,
      score: 85,
      trustLevel: 'high',
      factors: {
        osSecurityPatches: 20,
        encryptionStatus: 20,
        malwareProtection: 20,
        firewallStatus: 20,
        updateStatus: 20,
        behaviorAnalysis: 20,
      },
      lastCalculated: new Date(),
      risks: [],
    };

    return NextResponse.json({
      success: true,
      data: trustScore,
    });
  } catch (error) {
    console.error('Error fetching trust score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust score' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      deviceName,
      osType,
      osVersion,
      hardwareId,
      owner,
    } = body;

    if (!deviceName || !osType || !osVersion || !owner) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, register device and calculate trust score
    const deviceId = `device-${Date.now()}`;
    const trustScore = {
      deviceId,
      score: 50,
      trustLevel: 'medium',
      factors: {
        osSecurityPatches: 10,
        encryptionStatus: 0,
        malwareProtection: 0,
        firewallStatus: 10,
        updateStatus: 10,
        behaviorAnalysis: 20,
      },
      lastCalculated: new Date(),
      risks: [
        'Disk encryption not enabled',
        'Antivirus not installed',
        'Device not seen for more than 14 days',
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        deviceId,
        trustScore,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      isCompliant,
      encryptionEnabled,
      antivirusEnabled,
      firewallEnabled,
    } = body;

    // In production, update device and recalculate trust score
    let score = 50;
    const factors: Record<string, number> = {
      osSecurityPatches: 20,
      encryptionStatus: 0,
      malwareProtection: 0,
      firewallStatus: 0,
      updateStatus: 20,
      behaviorAnalysis: 10,
    };

    if (encryptionEnabled) {
      factors.encryptionStatus = 20;
      score += 20;
    }
    if (antivirusEnabled) {
      factors.malwareProtection = 20;
      score += 20;
    }
    if (firewallEnabled) {
      factors.firewallStatus = 20;
      score += 20;
    }

    const trustLevel =
      score >= 80 ? 'critical' :
      score >= 60 ? 'high' :
      score >= 40 ? 'medium' :
      score >= 20 ? 'low' : 'unknown';

    const updatedTrustScore = {
      deviceId,
      score: Math.min(100, score),
      trustLevel,
      factors,
      lastCalculated: new Date(),
      risks: [] as string[],
    };

    if (!encryptionEnabled) updatedTrustScore.risks.push('Disk encryption not enabled');
    if (!antivirusEnabled) updatedTrustScore.risks.push('Antivirus not installed');
    if (!firewallEnabled) updatedTrustScore.risks.push('Firewall not enabled');
    if (!isCompliant) updatedTrustScore.risks.push('Device not compliant with policy');

    return NextResponse.json({
      success: true,
      data: updatedTrustScore,
    });
  } catch (error) {
    console.error('Error updating device compliance:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    // In production, unregister device
    return NextResponse.json({
      success: true,
      message: `Device ${deviceId} unregistered successfully`,
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    return NextResponse.json(
      { error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}
