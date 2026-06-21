// Phase 28.1 - Custom AI Model Training (MAX tier only)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { customModelTrainer, TrainedModel, ModelConfiguration } from '@/lib/ai/custom-model-trainer';
import { Card } from '@/components/Card';

interface UserTier {
  name: 'FREE' | 'PRO' | 'MAX';
}

export default function AITrainingPage() {
  const router = useRouter();
  const [tier, setTier] = useState<UserTier['name']>('PRO');
  const [models, setModels] = useState<TrainedModel[]>([]);
  const [configs, setConfigs] = useState<ModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'create'>('overview');

  useEffect(() => {
    // Check user tier (hardcoded for demo)
    // In production, fetch from auth/user context
    setTier('MAX');

    // Load models
    setTimeout(() => {
      const mockModels: TrainedModel[] = [
        {
          id: 'model-1',
          organizationId: 'org-1',
          configurationId: 'config-1',
          version: 1,
          modelData: {},
          performance: {
            accuracy: 0.92,
            precision: 0.89,
            recall: 0.94,
            f1Score: 0.91,
            auc: 0.95,
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          trainedOn: {
            id: 'dataset-1',
            organizationId: 'org-1',
            name: 'Phishing Detection Training Set',
            description: 'Dataset with 10,000 records',
            recordCount: 10000,
            features: ['subject_line', 'sender_domain', 'link_count', 'attachment_type'],
            targetVariable: 'is_phishing',
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            sourceType: 'csv',
            sampleRecords: [],
          },
          featureImportance: {
            sender_domain: 0.35,
            subject_line: 0.28,
            link_count: 0.22,
            attachment_type: 0.15,
          },
          status: 'active',
        },
      ];

      setModels(mockModels);
      setLoading(false);
    }, 1000);
  }, []);

  if (tier !== 'MAX') {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">AI Model Training</h1>
          <p className="text-gray-600">
            Custom ML models for your organization (MAX tier only)
          </p>
        </div>

        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🔒</div>
            <h2 className="text-2xl font-bold">MAX Tier Feature</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Custom AI model training is available exclusively for BlockStop MAX tier customers.
              This enterprise feature allows you to train ML models on your own data.
            </p>
            <button
              onClick={() => router.push('/upgrade')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
            >
              Upgrade to MAX Tier
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900">Why Choose MAX Tier?</h3>
          <ul className="mt-4 space-y-2 text-sm text-blue-800">
            <li>• Train custom ML models on your proprietary data</li>
            <li>• Full model versioning and management</li>
            <li>• A/B testing framework for model evaluation</li>
            <li>• Advanced performance metrics and analytics</li>
            <li>• Priority support and training assistance</li>
          </ul>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI Model Training</h1>
        <p className="text-gray-600">
          Train custom ML models on your organization's data using TensorFlow.js and advanced ML frameworks
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-8">
          {(['overview', 'models', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 font-medium transition capitalize ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Active Models</p>
                <p className="text-3xl font-bold">{models.length}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-3xl font-bold">
                  {models.length > 0
                    ? (
                        models.reduce((sum, m) => sum + m.performance.accuracy, 0) /
                        models.length *
                        100
                      ).toFixed(1)
                    : 'N/A'}
                  %
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-3xl font-bold">
                  {models.reduce((sum, m) => sum + m.trainedOn.recordCount, 0).toLocaleString()}
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Training Features</p>
                <p className="text-3xl font-bold">{models.length > 0 ? models[0].trainedOn.features.length : 0}</p>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">How to Get Started</h3>
            <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
              <li>Upload your training data (CSV, JSON, or API)</li>
              <li>Configure model parameters and algorithm</li>
              <li>Start training (can take minutes to hours)</li>
              <li>Evaluate model performance</li>
              <li>Deploy model to production</li>
              <li>Run A/B tests to optimize performance</li>
            </ol>
          </Card>
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          {models.length > 0 ? (
            models.map((model) => (
              <Card key={model.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {model.trainedOn.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Created {model.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Active
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      v{model.version}
                    </span>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Accuracy</p>
                    <p className="text-lg font-bold">{(model.performance.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Precision</p>
                    <p className="text-lg font-bold">{(model.performance.precision * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Recall</p>
                    <p className="text-lg font-bold">{(model.performance.recall * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">F1 Score</p>
                    <p className="text-lg font-bold">{(model.performance.f1Score * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">AUC</p>
                    <p className="text-lg font-bold">{(model.performance.auc * 100).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Feature Importance */}
                {model.featureImportance && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Feature Importance</p>
                    <div className="space-y-2">
                      {Object.entries(model.featureImportance)
                        .sort(([, a], [, b]) => b - a)
                        .map(([feature, importance]) => (
                          <div key={feature}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm capitalize">{feature}</span>
                              <span className="text-xs font-semibold">{(importance * 100).toFixed(1)}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${importance * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold">
                    View Details
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm font-semibold">
                    Start A/B Test
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm font-semibold">
                    Deploy
                  </button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">No trained models yet</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Create Your First Model
              </button>
            </Card>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Model</h2>

          <div className="space-y-6">
            {/* Step 1: Dataset */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                Select Training Dataset
              </h3>

              <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Choose a dataset...</option>
                <option>Phishing Detection Training Set (10,000 records)</option>
                <option>Malware Classification Set (5,000 records)</option>
                <option>Upload New Dataset...</option>
              </select>
            </div>

            {/* Step 2: Algorithm */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Choose Algorithm
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: 'Random Forest', desc: 'Great for classification tasks' },
                  { name: 'Gradient Boosting', desc: 'High accuracy for complex patterns' },
                  { name: 'Neural Network', desc: 'Deep learning for advanced patterns' },
                  { name: 'Isolation Forest', desc: 'Anomaly detection specialist' },
                ].map((algo) => (
                  <label key={algo.name} className="border rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition">
                    <input type="radio" name="algorithm" defaultChecked={algo.name === 'Random Forest'} className="mr-2" />
                    <span className="font-semibold">{algo.name}</span>
                    <p className="text-xs text-gray-600 ml-6">{algo.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                Model Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Model Name</label>
                  <input type="text" placeholder="e.g., Phishing Detector v2" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Model Type</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Classification</option>
                    <option>Regression</option>
                    <option>Clustering</option>
                    <option>Anomaly Detection</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                Start Training
              </button>
              <button className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Information */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="space-y-2">
          <h3 className="font-semibold text-purple-900">About Custom AI Training</h3>
          <p className="text-sm text-purple-800">
            BlockStop's custom model trainer allows MAX tier customers to:
          </p>
          <ul className="text-sm text-purple-800 list-disc list-inside space-y-1 mt-2">
            <li>Train models on your proprietary data</li>
            <li>Use TensorFlow.js and open-source ML frameworks</li>
            <li>Maintain full model versioning and history</li>
            <li>Run A/B tests to compare model performance</li>
            <li>Deploy models to production with monitoring</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
