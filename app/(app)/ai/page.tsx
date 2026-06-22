'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Badge,
  AlertTriangle,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  Target,
  Radar as RadarIcon,
  Activity,
  Lock,
  AlertCircle,
  CheckCircle2,
  ClockAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

interface ThreatSimulation {
  id: string;
  name: string;
  status: 'running' | 'completed';
  successRate: number;
  detectionRate: number;
  avgDetectionTime: number;
}

interface AnomalyDetectionStats {
  total: number;
  high: number;
  medium: number;
  low: number;
}

interface InsiderThreatStats {
  totalIndicators: number;
  critical: number;
  high: number;
  medium: number;
  investigating: number;
}

const AIAdvancedDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for ML Models
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([
    {
      name: 'Custom Threat Classifier',
      accuracy: 94.2,
      precision: 92.8,
      recall: 93.5,
      f1Score: 93.1,
    },
    {
      name: 'Anomaly Detection',
      accuracy: 89.7,
      precision: 88.2,
      recall: 91.3,
      f1Score: 89.7,
    },
    {
      name: 'Behavioral Predictor',
      accuracy: 87.5,
      precision: 85.9,
      recall: 88.2,
      f1Score: 87.0,
    },
    {
      name: 'NLP Analyzer',
      accuracy: 91.3,
      precision: 90.1,
      recall: 92.4,
      f1Score: 91.2,
    },
  ]);

  // Threat Simulations
  const [simulations, setSimulations] = useState<ThreatSimulation[]>([
    {
      id: '1',
      name: 'Ransomware Campaign',
      status: 'completed',
      successRate: 68,
      detectionRate: 92,
      avgDetectionTime: 145,
    },
    {
      id: '2',
      name: 'APT Intrusion',
      status: 'running',
      successRate: 72,
      detectionRate: 88,
      avgDetectionTime: 234,
    },
  ]);

  // Anomaly Detection Stats
  const [anomalyStats, setAnomalyStats] = useState<AnomalyDetectionStats>({
    total: 342,
    high: 28,
    medium: 87,
    low: 227,
  });

  // Insider Threat Stats
  const [insiderThreatStats, setInsiderThreatStats] = useState<InsiderThreatStats>({
    totalIndicators: 156,
    critical: 3,
    high: 12,
    medium: 31,
    investigating: 18,
  });

  // Performance trends
  const [performanceTrends, setPerformanceTrends] = useState([
    { time: '00:00', detectionRate: 88, responseTime: 234, threatLevel: 45 },
    { time: '06:00', detectionRate: 90, responseTime: 198, threatLevel: 52 },
    { time: '12:00', detectionRate: 92, responseTime: 156, threatLevel: 68 },
    { time: '18:00', detectionRate: 94, responseTime: 134, threatLevel: 73 },
    { time: '00:00', detectionRate: 96, responseTime: 112, threatLevel: 81 },
  ]);

  // Model comparison
  const [modelComparison, setModelComparison] = useState([
    { metric: 'Accuracy', 'Custom Classifier': 94.2, 'Anomaly Detector': 89.7, 'Behavior Predictor': 87.5, 'NLP Analyzer': 91.3 },
    { metric: 'Precision', 'Custom Classifier': 92.8, 'Anomaly Detector': 88.2, 'Behavior Predictor': 85.9, 'NLP Analyzer': 90.1 },
    { metric: 'Recall', 'Custom Classifier': 93.5, 'Anomaly Detector': 91.3, 'Behavior Predictor': 88.2, 'NLP Analyzer': 92.4 },
    { metric: 'F1 Score', 'Custom Classifier': 93.1, 'Anomaly Detector': 89.7, 'Behavior Predictor': 87.0, 'NLP Analyzer': 91.2 },
  ]);

  // Threat detection radar
  const [threatRadar, setThreatRadar] = useState([
    { category: 'Ransomware', value: 72 },
    { category: 'Phishing', value: 85 },
    { category: 'Malware', value: 68 },
    { category: 'APT', value: 64 },
    { category: 'Insider', value: 58 },
    { category: 'Zero-Day', value: 45 },
  ]);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Advanced AI & Threat Intelligence</h1>
        </div>
        <p className="text-gray-600">
          Custom ML models, threat simulation, behavioral prediction, and advanced NLP analysis
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Model Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">91.2%</div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2.1% this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              +342 anomalies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Insider Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">3</div>
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Critical level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156ms</div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              -23ms improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="custom-models" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ML Models
          </TabsTrigger>
          <TabsTrigger value="threat-sim" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="nlp" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            NLP
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Critical Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Critical Alerts</h3>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical: Insider Threat Detected</AlertTitle>
              <AlertDescription>
                User ID #4521 showing signs of data exfiltration (9.2 GB transfer in last hour). Investigation status: Open
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>High: Phishing Campaign Detected</AlertTitle>
              <AlertDescription>
                Advanced phishing emails detected targeting 147 employees. NLP analysis indicates CEO fraud pattern with 94% confidence.
              </AlertDescription>
            </Alert>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Performance Trends</CardTitle>
              <CardDescription>Detection rate, response time, and threat level over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="detectionRate" stroke="#3b82f6" strokeWidth={2} name="Detection Rate (%)" />
                  <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#10b981" strokeWidth={2} name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Threat Detection Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection Capabilities</CardTitle>
              <CardDescription>Detection effectiveness by threat category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={threatRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Detection Effectiveness" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom ML Models Tab */}
        <TabsContent value="custom-models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom ML Models Performance</CardTitle>
              <CardDescription>Real-time metrics for all trained models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Comparison Chart */}
              <div>
                <h4 className="font-semibold mb-4">Model Metrics Comparison</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={modelMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[80, 100]} />
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#3b82f6" />
                    <Bar dataKey="precision" fill="#10b981" />
                    <Bar dataKey="recall" fill="#f59e0b" />
                    <Bar dataKey="f1Score" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Model Details Table */}
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Detailed Model Metrics</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-gray-600">
                        <th className="text-left py-2 px-4">Model Name</th>
                        <th className="text-center py-2 px-4">Accuracy</th>
                        <th className="text-center py-2 px-4">Precision</th>
                        <th className="text-center py-2 px-4">Recall</th>
                        <th className="text-center py-2 px-4">F1 Score</th>
                        <th className="text-center py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelMetrics.map((model) => (
                        <tr key={model.name} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{model.name}</td>
                          <td className="text-center py-3 px-4">{model.accuracy.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4">{model.precision.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4">{model.recall.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4">{model.f1Score.toFixed(1)}%</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Model Training Info */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Latest Training</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="text-gray-600">Version 2.1.0</p>
                    <p className="font-semibold mt-2">Training Time: 4h 23m</p>
                    <p className="text-gray-600">Dataset: 450,000 samples</p>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Deployment Status</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="text-gray-600">Production: 100%</p>
                    <p className="font-semibold mt-2">Canary: 2%</p>
                    <p className="text-gray-600">Last Update: 2 hours ago</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Simulation Tab */}
        <TabsContent value="threat-sim" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purple Team Exercises</CardTitle>
              <CardDescription>Threat simulation and defense effectiveness testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Start New Simulation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-4">Launch New Simulation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Ransomware Campaign
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RadarIcon className="h-4 w-4 mr-2" />
                    APT Intrusion
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Supply Chain Attack
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Lock className="h-4 w-4 mr-2" />
                    Insider Threat
                  </Button>
                </div>
              </div>

              {/* Active Simulations */}
              <div>
                <h4 className="font-semibold mb-4">Active & Recent Simulations</h4>
                <div className="space-y-3">
                  {simulations.map((sim) => (
                    <div key={sim.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold">{sim.name}</h5>
                          <p className="text-sm text-gray-600">
                            Status: <Badge variant={sim.status === 'running' ? 'default' : 'secondary'}>
                              {sim.status}
                            </Badge>
                          </p>
                        </div>
                        {sim.status === 'running' && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Activity className="h-3 w-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Success Rate</p>
                          <p className="font-semibold text-lg">{sim.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Detection Rate</p>
                          <p className="font-semibold text-lg text-green-600">{sim.detectionRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Detection Time</p>
                          <p className="font-semibold text-lg">{sim.avgDetectionTime}ms</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Effectiveness */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm">Defense Effectiveness Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <p><strong>Signature Detection:</strong> 87% effectiveness</p>
                    <p><strong>Behavioral Detection:</strong> 92% effectiveness</p>
                    <p><strong>AI Detection:</strong> 94% effectiveness</p>
                    <p><strong>Overall Defense Score:</strong> 91/100</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavioral Prediction Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>UEBA & Insider Threat Detection</CardTitle>
              <CardDescription>Behavioral analytics and anomaly detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Anomaly Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-sm">Total Anomalies</p>
                    <p className="text-3xl font-bold mt-2">{anomalyStats.total}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-sm">High Risk</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{anomalyStats.high}</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-sm">Medium Risk</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{anomalyStats.medium}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <p className="text-gray-600 text-sm">Low Risk</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{anomalyStats.low}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Insider Threat Stats */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Insider Threat Indicators</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Total Indicators</p>
                    <p className="text-3xl font-bold mt-2">{insiderThreatStats.totalIndicators}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Critical Level</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{insiderThreatStats.critical}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">High Level</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{insiderThreatStats.high}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Under Investigation</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{insiderThreatStats.investigating}</p>
                  </div>
                </div>
              </div>

              {/* ML Algorithms */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Machine Learning Algorithms</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Isolation Forest</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p><strong>Status:</strong> <Badge variant="outline" className="bg-green-50">Active</Badge></p>
                      <p><strong>Accuracy:</strong> 92.5%</p>
                      <p><strong>Trees:</strong> 100</p>
                      <p><strong>Contamination:</strong> 5%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Local Outlier Factor</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p><strong>Status:</strong> <Badge variant="outline" className="bg-green-50">Active</Badge></p>
                      <p><strong>Accuracy:</strong> 88.7%</p>
                      <p><strong>K Neighbors:</strong> 5</p>
                      <p><strong>Min Points:</strong> 5</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Autoencoder</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p><strong>Status:</strong> <Badge variant="outline" className="bg-blue-50">Training</Badge></p>
                      <p><strong>Progress:</strong> 67%</p>
                      <p><strong>Input Dims:</strong> 256</p>
                      <p><strong>Layers:</strong> 6</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Statistical Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                      <p><strong>Status:</strong> <Badge variant="outline" className="bg-green-50">Active</Badge></p>
                      <p><strong>Z-score Threshold:</strong> 3.0</p>
                      <p><strong>Features:</strong> 47</p>
                      <p><strong>Baseline:</strong> 30 days</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NLP Tab */}
        <TabsContent value="nlp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced NLP Analysis</CardTitle>
              <CardDescription>Text analysis, sentiment detection, and threat pattern recognition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NLP Capabilities */}
              <div>
                <h4 className="font-semibold mb-4">NLP Capabilities</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertTitle>Sentiment Analysis</AlertTitle>
                    <AlertDescription>
                      Emotional tone analysis with 6 emotion dimensions (anger, fear, joy, sadness, surprise, disgust)
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Social Engineering Detection</AlertTitle>
                    <AlertDescription>
                      8 manipulation tactics: urgency, authority, scarcity, fear, greed, consensus, liking, reciprocity
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>Spear-Phishing Detection</AlertTitle>
                    <AlertDescription>
                      5 major patterns: credential harvesting, invoice fraud, MFA bypass, CEO fraud, account compromise
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>Language Anomaly Detection</AlertTitle>
                    <AlertDescription>
                      Detects unusual capitalization, character combinations, punctuation, and non-ASCII content
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* Text Analysis Results */}
              <div>
                <h4 className="font-semibold mb-4">Recent Text Analysis Results</h4>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Phishing Email Detected</h5>
                        <p className="text-xs text-gray-600 mt-1">Subject: Urgent: Verify Your Account Immediately</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Critical
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Phishing Score</p>
                        <p className="font-semibold text-red-600">94%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Urgency Level</p>
                        <p className="font-semibold">92%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Anomaly Score</p>
                        <p className="font-semibold">87%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confidence</p>
                        <p className="font-semibold">96%</p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold">Invoice Fraud Attempt</h5>
                        <p className="text-xs text-gray-600 mt-1">Subject: Invoice #12345 - Urgent Payment Required</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Critical
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Phishing Score</p>
                        <p className="font-semibold text-red-600">89%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Authority Imperson.</p>
                        <p className="font-semibold">85%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Anomaly Score</p>
                        <p className="font-semibold">81%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Confidence</p>
                        <p className="font-semibold">93%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Security Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Emails Analyzed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">12,547</p>
                    <p className="text-xs text-gray-600 mt-2">Today</p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Threats Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">342</p>
                    <p className="text-xs text-gray-600 mt-2">Blocked</p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Detection Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">97.8%</p>
                    <p className="text-xs text-gray-600 mt-2">No false positives</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings & Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI System Configuration</CardTitle>
          <CardDescription>Model settings and advanced configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Model Updates</h4>
              <Button className="w-full mb-2">Train New Models</Button>
              <Button variant="outline" className="w-full mb-2">Deploy Staging</Button>
              <Button variant="outline" className="w-full">Rollback Production</Button>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Threat Intelligence</h4>
              <Button className="w-full mb-2">Update MITRE ATT&CK DB</Button>
              <Button variant="outline" className="w-full mb-2">Sync Threat Feeds</Button>
              <Button variant="outline" className="w-full">Export Indicators</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAdvancedDashboard;
