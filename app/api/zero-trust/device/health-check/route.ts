import { NextRequest, NextResponse } from 'next/server';
import { deviceHealthCheck } from '@/lib/zero-trust/device-health-check';
import { deviceRegistry } from '@/lib/zero-trust/device-registry';

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

    // Perform health check
    const health = await deviceHealthCheck.performHealthCheck(deviceId);

    // Update device last seen
    await deviceRegistry.updateLastSeen(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: health.deviceId,
        healthy: health.healthy,
        score: health.score,
        lastCheck: health.lastCheck,
        issues: health.issues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description,
          recommendation: issue.recommendation,
        })),
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
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

    // Perform health check
    const health = await deviceHealthCheck.performHealthCheck(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: health.deviceId,
        healthy: health.healthy,
        score: health.score,
        lastCheck: health.lastCheck,
        issues: health.issues,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
