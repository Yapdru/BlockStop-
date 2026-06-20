import { NextRequest, NextResponse } from 'next/server';
import { createAIOrchestrator } from '@/lib/phase20/ai-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailContent, fileName, fileData } = await req.json();

    const orchestrator = createAIOrchestrator();

    const result = await orchestrator.analyzeWithMultipleModels({
      emailContent,
      fileName,
      fileData: fileData ? Buffer.from(fileData, 'base64') : undefined
    });

    return NextResponse.json({
      analysis: result,
      models: orchestrator.getModels(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
