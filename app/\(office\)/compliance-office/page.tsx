'use client';

/**
 * BlockStop OFFICE Tier - Professional Compliance Dashboard
 * HIPAA, SOC2, ISO27001, GDPR compliance monitoring and reporting
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Download,
  FileText,
} from 'lucide-react';

interface ComplianceFramework {
  name: string;
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'remediation';
  score: number;
  controlsPassed: number;
  controlsFailed: number;
  controlsPending: number;
  lastAssessmentDate: Date;
  nextAssessmentDate: Date;
  trend?: 'up' | 'down' | 'stable';
}

const ComplianceOfficePage: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([
    {
      name: 'HIPAA',
      status: 'in_progress',
      score: 94,
      controlsPassed: 15,
      controlsFailed: 1,
      controlsPending: 2,
      lastAssessmentDate: new Date('2024-06-10'),
      nextAssessmentDate: new Date('2024-09-10'),
      trend: 'up',
    },
    {
      name: 'SOC2 Type II',
      status: 'compliant',
      score: 96,
      controlsPassed: 22,
      controlsFailed: 0,
      controlsPending: 0,
      lastAssessmentDate: new Date('2024-05-15'),
      nextAssessmentDate: new Date('2024-08-15'),
      trend: 'stable',
    },
    {
      name: 'ISO 27001',
      status: 'in_progress',
      score: 92,
      controlsPassed: 105,
      controlsFailed: 4,
      controlsPending: 5,
      lastAssessmentDate: new Date('2024-06-01'),
      nextAssessmentDate: new Date('2024-09-01'),
      trend: 'up',
    },
    {
      name: 'GDPR',
      status: 'compliant',
      score: 95,
      controlsPassed: 12,
      controlsFailed: 0,
      controlsPending: 0,
      lastAssessmentDate: new Date('2024-06-05'),
      nextAssessmentDate: new Date('2024-09-05'),
      trend: 'stable',
    },
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: '1',
      severity: 'high',
      framework: 'HIPAA',
      title: 'Missing Encryption Key Rotation',
      description:
        'Encryption keys have not been rotated in 120 days. HIPAA requires rotation every 90 days.',
      dueDate: new Date('2024-06-30'),
      resolved: false,
    },
    {
      id: '2',
      severity: 'medium',
      framework: 'ISO27001',
      title: 'Incomplete Access Control Documentation',
      description:
        '4 additional controls require supporting documentation for audit trail.',
      dueDate: new Date('2024-07-15'),
      resolved: false,
    },
  ]);

  const [selectedTab, setSelectedTab] = useState('overview');
  const overallScore = Math.round(frameworks.reduce((sum, f) => sum + f.score, 0) / frameworks.length);
  const compliantFrameworks = frameworks.filter((f) => f.status === 'compliant').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'non_compliant':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'remediation':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Professional compliance monitoring for enterprise frameworks
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallScore}%</div>
            <p className="text-xs text-gray-600 mt-2">Across all frameworks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliant Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {compliantFrameworks}/{frameworks.length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Fully compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {alerts.filter((a) => !a.resolved && (a.severity === 'critical' || a.severity === 'high')).length}
            </div>
            <p className="text-xs text-gray-600 mt-2">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-gray-600 mt-2">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {alerts.some((a) => !a.resolved) && (
        <Alert className={getSeverityColor('high')} variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            {alerts.filter((a) => !a.resolved).length} compliance items require immediate attention.
            Review the alerts below.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status Summary</CardTitle>
              <CardDescription>Real-time view of your compliance posture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {frameworks.map((framework) => (
                <div key={framework.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(framework.status)}
                      <span className="font-medium">{framework.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{framework.score}%</span>
                      {getTrendIcon(framework.trend)}
                    </div>
                  </div>
                  <Progress value={framework.score} className="h-2" />
                  <div className="text-sm text-gray-600">
                    {framework.controlsPassed} passed • {framework.controlsFailed} failed •{' '}
                    {framework.controlsPending} pending
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Timeline</CardTitle>
              <CardDescription>Upcoming assessments and deadlines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {frameworks.map((framework) => (
                  <div key={framework.name} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{framework.name} Assessment</p>
                      <p className="text-sm text-gray-600">
                        Next: {new Date(framework.nextAssessmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{framework.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(framework.status)}
                      {framework.name}
                    </CardTitle>
                    <Badge
                      variant={framework.status === 'compliant' ? 'default' : 'secondary'}
                    >
                      {framework.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Compliance Score</span>
                      <span className="text-lg font-bold">{framework.score}%</span>
                    </div>
                    <Progress value={framework.score} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {framework.controlsPassed}
                      </p>
                      <p className="text-xs text-gray-600">Passed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{framework.controlsFailed}</p>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {framework.controlsPending}
                      </p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 pt-3 border-t">
                    <p>Last Assessment: {new Date(framework.lastAssessmentDate).toLocaleDateString()}</p>
                    <p>Next Assessment: {new Date(framework.nextAssessmentDate).toLocaleDateString()}</p>
                  </div>

                  <Button className="w-full" variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                {alerts.filter((a) => !a.resolved).length} unresolved alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600">No active alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-l-4 rounded ${
                      alert.severity === 'high'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span>{alert.framework}</span>
                          <span>Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audits Tab */}
        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled & Active Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    framework: 'HIPAA',
                    status: 'in_progress',
                    auditor: 'John Smith',
                    startDate: '2024-06-20',
                    estimatedDays: 5,
                  },
                  {
                    framework: 'SOC2',
                    status: 'scheduled',
                    auditor: 'Jane Doe',
                    startDate: '2024-07-15',
                    estimatedDays: 7,
                  },
                  {
                    framework: 'ISO27001',
                    status: 'scheduled',
                    auditor: 'TBD',
                    startDate: '2024-08-01',
                    estimatedDays: 10,
                  },
                ].map((audit, idx) => (
                  <div key={idx} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{audit.framework}</h4>
                      <Badge variant={audit.status === 'in_progress' ? 'default' : 'secondary'}>
                        {audit.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Auditor: {audit.auditor}</p>
                      <p>Starts: {audit.startDate}</p>
                      <p>Estimated Duration: {audit.estimatedDays} days</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate Compliance Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export Compliance Report (PDF)
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Compliance Report (Excel)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceOfficePage;
