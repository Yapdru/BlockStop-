import { NextRequest, NextResponse } from 'next/server';
import { deviceTrustEngine } from '@/lib/zero-trust/device-trust-engine';
import { deviceRegistry } from '@/lib/zero-trust/device-registry';
import { compromisedDeviceDetector } from '@/lib/zero-trust/compromised-device-detector';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, userId } = await request.json();

    // Validate required parameters
    if (!deviceId || !userId) {
      return NextResponse.json(
        { error: 'deviceId and userId are required' },
        { status: 400 }
      );
    }

    // Verify device belongs to user
    const device = await deviceRegistry.getDevice(deviceId);
    if (!device || device.userId !== userId) {
      return NextResponse.json(
        { error: 'Device not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate trust score
    const trustScore = await deviceTrustEngine.calculateDeviceTrustScore(deviceId);

    // Check for compromise
    const compromiseAnalysis = await compromisedDeviceDetector.detectCompromise(deviceId);

    // Enforce device trust
    const accessDecision = await deviceTrustEngine.enforceDeviceTrust(userId, deviceId);

    // Update device last seen
    await deviceRegistry.updateLastSeen(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: trustScore.deviceId,
        trustScore: trustScore.trustScore,
        trustLevel: trustScore.level,
        compromised: compromiseAnalysis.isCompromised,
        compromiseRisk: compromiseAnalysis.riskScore,
        accessDecision: {
          allowed: accessDecision.allowed,
          level: accessDecision.level,
          restrictions: accessDecision.restrictions,
          reason: accessDecision.reason,
        },
        securityDetails: {
          osVulnerable: trustScore.details.osVulnerable,
          antimalwareEnabled: trustScore.details.antimalwareStatus.enabled,
          diskEncrypted: trustScore.details.diskEncrypted,
          firewallEnabled: trustScore.details.firewallEnabled,
          screenLocked: trustScore.details.screenLocked,
          deviceJailbroken: trustScore.details.isJailbroken,
        },
        compromiseIndicators: compromiseAnalysis.indicators.length,
        recommendation: compromiseAnalysis.recommendation,
      },
    });
  } catch (error) {
    console.error('Trust score calculation error:', error);
    return NextResponse.json(
      { error: 'Trust score calculation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    // Verify device exists
    const device = await deviceRegistry.getDevice(deviceId);
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Calculate trust score
    const trustScore = await deviceTrustEngine.calculateDeviceTrustScore(deviceId);

    // Check for compromise
    const compromiseAnalysis = await compromisedDeviceDetector.detectCompromise(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: trustScore.deviceId,
        trustScore: trustScore.trustScore,
        trustLevel: trustScore.level,
        compromised: compromiseAnalysis.isCompromised,
        compromiseRisk: compromiseAnalysis.riskScore,
        securityDetails: trustScore.details,
        compromiseIndicators: compromiseAnalysis.indicators,
      },
    });
  } catch (error) {
    console.error('Trust score retrieval error:', error);
    return NextResponse.json(
      { error: 'Trust score retrieval failed' },
      { status: 500 }
    );
  }
}
