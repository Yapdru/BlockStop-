import { NextRequest, NextResponse } from 'next/server';

interface ScalingStatusResponse {
  status: string;
  currentInstanceCount: number;
  minInstances: number;
  maxInstances: number;
  metrics?: {
    cpu: number;
    memory: number;
    requestLatency: number;
    requestsPerSecond: number;
  };
  activePolicies?: string[];
  lastScalingAction?: {
    type: string;
    reason: string;
    timestamp: string;
  };
  recentActions?: Array<{
    type: string;
    reason: string;
    targetCount?: number;
    timestamp: string;
  }>;
  loadBalancer?: {
    totalInstances: number;
    healthyInstances: number;
    totalConnections: number;
    strategy: string;
  };
}

// Simulated in-memory state for demonstration
let scalingState = {
  currentCount: 3,
  minInstances: 1,
  maxInstances: 10,
  metrics: {
    cpu: 45.5,
    memory: 62.3,
    requestLatency: 125,
    requestsPerSecond: 4500,
  },
  activePolicies: ['cpu-scale-out', 'cpu-scale-in', 'memory-scale-out'],
  lastScalingAction: {
    type: 'scale-up',
    reason: 'CPU usage exceeded 70% threshold',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  loadBalancer: {
    totalInstances: 3,
    healthyInstances: 3,
    totalConnections: 1250,
    strategy: 'least-connections',
  },
};

/**
 * GET /api/performance/scaling/status
 * Get current auto-scaling status and metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse<ScalingStatusResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Simulate metrics updates
    scalingState.metrics.cpu = Math.max(10, Math.min(90, scalingState.metrics.cpu + (Math.random() - 0.5) * 10));
    scalingState.metrics.memory = Math.max(20, Math.min(95, scalingState.metrics.memory + (Math.random() - 0.5) * 8));
    scalingState.metrics.requestLatency = Math.max(50, Math.min(500, scalingState.metrics.requestLatency + (Math.random() - 0.5) * 50));
    scalingState.metrics.requestsPerSecond = Math.max(1000, Math.min(10000, scalingState.metrics.requestsPerSecond + (Math.random() - 0.5) * 1000));

    const response: ScalingStatusResponse = {
      status: scalingState.metrics.cpu > 70 ? 'scaling' : 'stable',
      currentInstanceCount: scalingState.currentCount,
      minInstances: scalingState.minInstances,
      maxInstances: scalingState.maxInstances,
    };

    if (detailed) {
      response.metrics = scalingState.metrics;
      response.activePolicies = scalingState.activePolicies;
      response.lastScalingAction = scalingState.lastScalingAction;
      response.recentActions = [
        {
          type: 'scale-up',
          reason: 'CPU usage exceeded 70% threshold',
          targetCount: 2,
          timestamp: new Date(Date.now() - 900000).toISOString(),
        },
        {
          type: 'scale-down',
          reason: 'CPU usage below 30% threshold',
          targetCount: 1,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          type: 'scale-up',
          reason: 'CPU usage exceeded 70% threshold',
          targetCount: 3,
          timestamp: new Date(Date.now() - 300000).toISOString(),
        },
      ];
      response.loadBalancer = scalingState.loadBalancer;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get scaling status:', error);
    return NextResponse.json(
      { error: 'Failed to get scaling status', status: 'unknown' } as any,
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/scaling/status
 * Trigger manual scaling action
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string }>> {
  try {
    const body = await request.json() as {
      action: 'scale-up' | 'scale-down';
      count?: number;
      reason?: string;
    };

    const { action, count = 1, reason = 'Manual scaling request' } = body;

    if (!['scale-up', 'scale-down'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be scale-up or scale-down' },
        { status: 400 }
      );
    }

    const newCount = Math.max(
      scalingState.minInstances,
      Math.min(
        scalingState.maxInstances,
        action === 'scale-up' ? scalingState.currentCount + count : scalingState.currentCount - count
      )
    );

    if (newCount === scalingState.currentCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Instance count already at ${newCount}`,
        },
        { status: 400 }
      );
    }

    // Update state
    scalingState.currentCount = newCount;
    scalingState.loadBalancer.totalInstances = newCount;
    scalingState.loadBalancer.healthyInstances = Math.max(1, Math.ceil(newCount * 0.95)); // Simulate 95% health
    scalingState.lastScalingAction = {
      type: action,
      reason,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Scaling ${action}: instances changed from ${scalingState.currentCount - (action === 'scale-up' ? count : -count)} to ${newCount}`,
    });
  } catch (error) {
    console.error('Failed to process scaling action:', error);
    return NextResponse.json(
      { error: 'Failed to process scaling action', success: false },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/performance/scaling/status
 * Update scaling configuration
 */
export async function PATCH(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string }>> {
  try {
    const body = await request.json() as {
      minInstances?: number;
      maxInstances?: number;
      strategy?: string;
    };

    const { minInstances, maxInstances, strategy } = body;

    if (minInstances !== undefined) {
      if (minInstances < 1) {
        return NextResponse.json(
          { error: 'Minimum instances must be at least 1' },
          { status: 400 }
        );
      }
      scalingState.minInstances = minInstances;
    }

    if (maxInstances !== undefined) {
      if (maxInstances < scalingState.minInstances) {
        return NextResponse.json(
          { error: 'Maximum instances must be >= minimum instances' },
          { status: 400 }
        );
      }
      scalingState.maxInstances = maxInstances;
    }

    if (strategy !== undefined) {
      scalingState.loadBalancer.strategy = strategy;
    }

    return NextResponse.json({
      success: true,
      message: 'Scaling configuration updated',
    });
  } catch (error) {
    console.error('Failed to update scaling configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/performance/scaling/status
 * Reset scaling state
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string }>> {
  try {
    scalingState = {
      currentCount: 1,
      minInstances: 1,
      maxInstances: 10,
      metrics: {
        cpu: 30,
        memory: 40,
        requestLatency: 100,
        requestsPerSecond: 2000,
      },
      activePolicies: ['cpu-scale-out', 'cpu-scale-in', 'memory-scale-out'],
      lastScalingAction: {
        type: 'reset',
        reason: 'Scaling state reset by administrator',
        timestamp: new Date().toISOString(),
      },
      loadBalancer: {
        totalInstances: 1,
        healthyInstances: 1,
        totalConnections: 0,
        strategy: 'least-connections',
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Scaling state reset',
    });
  } catch (error) {
    console.error('Failed to reset scaling state:', error);
    return NextResponse.json(
      { error: 'Failed to reset state', success: false },
      { status: 500 }
    );
  }
}
