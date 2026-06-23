'use client';

/**
 * BlockStop OFFICE Tier - Professional Reporting Interface
 * Executive summaries, board reports, compliance reports, threat intelligence
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Eye,
  Mail,
  FileText,
  BarChart3,
  TrendingDown,
  Calendar,
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  status: 'draft' | 'final' | 'archived';
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  distribution: Array<{
    email: string;
    sentAt?: Date;
    openedAt?: Date;
  }>;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    trend?: string;
  }>;
}

const ProfessionalReportsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState('all');
  const [dateRange, setDateRange] = useState('month');

  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Executive Threat Summary - June 2024',
      type: 'executive_summary',
      generatedAt: new Date('2024-06-30'),
      period: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      },
      status: 'final',
      confidentiality: 'confidential',
      distribution: [
        { email: 'ciso@company.com', sentAt: new Date('2024-06-30'), openedAt: new Date('2024-07-01') },
        { email: 'cfo@company.com', sentAt: new Date('2024-06-30') },
      ],
      keyMetrics: [
        { label: 'Threats Detected', value: 24, trend: 'down' },
        { label: 'Critical Incidents', value: 1, trend: 'down' },
        { label: 'Containment Rate', value: '100%', trend: 'up' },
        { label: 'Response Time', value: '15 min', trend: 'down' },
      ],
    },
    {
      id: '2',
      title: 'Board Risk Report - Q2 2024',
      type: 'board_report',
      generatedAt: new Date('2024-06-28'),
      period: {
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
      },
      status: 'final',
      confidentiality: 'restricted',
      distribution: [
        { email: 'board@company.com', sentAt: new Date('2024-06-28'), openedAt: new Date('2024-06-29') },
      ],
      keyMetrics: [
        { label: 'Risk Score', value: 32, trend: 'down' },
        { label: 'Compliance Rate', value: '94%', trend: 'up' },
        { label: 'Incidents', value: 3, trend: 'down' },
      ],
    },
    {
      id: '3',
      title: 'Compliance Status Report - June 2024',
      type: 'compliance_report',
      generatedAt: new Date('2024-06-25'),
      period: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      },
      status: 'final',
      confidentiality: 'internal',
      distribution: [
        { email: 'compliance@company.com', sentAt: new Date('2024-06-25') },
        { email: 'audit@company.com', sentAt: new Date('2024-06-25'), openedAt: new Date('2024-06-26') },
      ],
      keyMetrics: [
        { label: 'HIPAA Score', value: '94%', trend: 'up' },
        { label: 'SOC2 Score', value: '96%', trend: 'up' },
        { label: 'ISO27001 Score', value: '92%', trend: 'up' },
        { label: 'GDPR Score', value: '95%', trend: 'up' },
      ],
    },
    {
      id: '4',
      title: 'SLA Performance Report - June 2024',
      type: 'sla_report',
      generatedAt: new Date('2024-07-01'),
      period: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      },
      status: 'final',
      confidentiality: 'internal',
      distribution: [],
      keyMetrics: [
        { label: 'Detection SLA', value: '98%', trend: 'up' },
        { label: 'Containment SLA', value: '97%', trend: 'up' },
        { label: 'Remediation SLA', value: '95%', trend: 'down' },
      ],
    },
  ]);

  const filteredReports =
    reportType === 'all'
      ? reports
      : reports.filter((r) => r.type === reportType);

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      executive_summary: 'Executive Summary',
      board_report: 'Board Report',
      compliance_report: 'Compliance Report',
      sla_report: 'SLA Report',
      incident_report: 'Incident Report',
      threat_intelligence: 'Threat Intelligence',
    };
    return labels[type] || type;
  };

  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-gray-100 text-gray-800';
      case 'confidential':
        return 'bg-orange-100 text-orange-800';
      case 'restricted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Professional Reports</h1>
        <p className="text-gray-600 mt-2">
          Executive summaries, board reports, and compliance documentation
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Reports</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Reports Overview */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="executive_summary">Executive Summary</SelectItem>
                      <SelectItem value="board_report">Board Report</SelectItem>
                      <SelectItem value="compliance_report">Compliance Report</SelectItem>
                      <SelectItem value="sla_report">SLA Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedReport(report)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {report.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Generated: {report.generatedAt.toLocaleDateString()} •{' '}
                        {report.period.startDate.toLocaleDateString()} to{' '}
                        {report.period.endDate.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge>{getReportTypeLabel(report.type)}</Badge>
                      <Badge className={getConfidentialityColor(report.confidentiality)}>
                        {report.confidentiality}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {report.keyMetrics.map((metric, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">{metric.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold">{metric.value}</span>
                          {metric.trend === 'up' && (
                            <TrendingDown className="w-4 h-4 text-green-600" />
                          )}
                          {metric.trend === 'down' && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Distribution */}
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Distribution</p>
                    {report.distribution.length === 0 ? (
                      <p className="text-sm text-gray-600">Not distributed yet</p>
                    ) : (
                      <div className="space-y-1">
                        {report.distribution.map((dist, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span>{dist.email}</span>
                            {dist.openedAt && (
                              <Badge variant="outline" className="ml-auto">
                                Opened
                              </Badge>
                            )}
                            {dist.sentAt && !dist.openedAt && (
                              <Badge variant="outline" className="ml-auto">
                                Sent
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create New Report */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Report</CardTitle>
              <CardDescription>Generate a professional report from available templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive_summary">Executive Threat Summary</SelectItem>
                    <SelectItem value="board_report">Board Risk Report</SelectItem>
                    <SelectItem value="compliance_report">Compliance Status Report</SelectItem>
                    <SelectItem value="sla_report">SLA Performance Report</SelectItem>
                    <SelectItem value="incident_report">Incident Post-Mortem</SelectItem>
                    <SelectItem value="threat_intelligence">Threat Intelligence Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Report Period</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                    <Input type="date" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confidentiality Level</label>
                <Select defaultValue="internal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Recipients</label>
                <Input placeholder="Enter email addresses (comma separated)" />
              </div>

              <Button className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate & Send Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Executive Threat Summary',
                description: 'High-level overview of threats and response',
                sections: 4,
              },
              {
                name: 'Board Risk Report',
                description: 'Strategic risk assessment for board oversight',
                sections: 5,
              },
              {
                name: 'Compliance Status Report',
                description: 'Multi-framework compliance tracking',
                sections: 4,
              },
              {
                name: 'SLA Performance Report',
                description: 'Monthly SLA metrics and compliance',
                sections: 4,
              },
            ].map((template, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{template.sections} sections</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalReportsPage;
