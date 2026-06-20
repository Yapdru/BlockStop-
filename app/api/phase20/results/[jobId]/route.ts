import { NextRequest, NextResponse } from 'next/server';
import { createIntegrationCoordinator } from '@/lib/phase20/integration-coordinator';

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coordinator = createIntegrationCoordinator();
    const job = coordinator.getJob(params.jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this job' },
        { status: 403 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json({
        job,
        status: job.status,
        message: job.status === 'running' ? 'Scanning in progress' : 'Job processing'
      });
    }

    const aggregated = await coordinator.aggregateResults(params.jobId);

    return NextResponse.json({
      job,
      aggregatedResults: aggregated,
      status: 'completed'
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
