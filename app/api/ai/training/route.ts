// Phase 28.1 - Custom Model Training API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { customModelTrainer } from '@/lib/ai/custom-model-trainer';

export async function POST(request: NextRequest) {
  try {
    const { action, organizationId, ...data } = await request.json();

    if (!action || !organizationId) {
      return NextResponse.json(
        { error: 'action and organizationId are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create-dataset':
        {
          const { name, records, features, targetVariable, sourceType } = data;
          const dataset = customModelTrainer.createDataset(
            organizationId,
            name,
            records,
            features,
            targetVariable,
            sourceType || 'json'
          );
          return NextResponse.json({
            success: true,
            data: dataset,
          });
        }

      case 'create-config':
        {
          const { name, datasetId, modelType, algorithm, hyperparameters } = data;
          const config = customModelTrainer.createModelConfiguration(
            organizationId,
            name,
            datasetId,
            modelType,
            algorithm,
            hyperparameters
          );
          return NextResponse.json({
            success: true,
            data: config,
          });
        }

      case 'train':
        {
          const { configurationId } = data;
          const model = await customModelTrainer.trainModel(configurationId);
          return NextResponse.json({
            success: true,
            data: model,
          });
        }

      case 'predict':
        {
          const { modelId, input } = data;
          const prediction = await customModelTrainer.predict(modelId, input);
          return NextResponse.json({
            success: true,
            data: prediction,
          });
        }

      case 'list-models':
        {
          const models = customModelTrainer.listModels(organizationId);
          return NextResponse.json({
            success: true,
            data: models,
          });
        }

      case 'ab-test':
        {
          const { testId } = data;
          if (!testId) {
            const { controlModelId, treatmentModelId, testPercentage } = data;
            const test = customModelTrainer.createABTest(
              organizationId,
              controlModelId,
              treatmentModelId,
              testPercentage
            );
            return NextResponse.json({
              success: true,
              data: test,
            });
          } else {
            const results = customModelTrainer.evaluateABTest(testId);
            return NextResponse.json({
              success: true,
              data: results,
            });
          }
        }

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Training API error:', error);
    return NextResponse.json(
      { error: 'Failed to process training request' },
      { status: 500 }
    );
  }
}
