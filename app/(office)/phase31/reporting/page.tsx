'use client';

/**
 * OFFICE Phase 31.1 - Professional Reporting Dashboard
 * Executive reports, board-ready presentations, metrics
 */

import React, { useState } from 'react';

interface Report {
  id: string;
  title: string;
  type: string;
  period: string;
  status: 'draft' | 'final' | 'distributed';
  generatedDate: Date;
  recipients: number;
  metrics: {
    label: string;
    value: string | number;
  }[];
}

interface ReportSection {
  title: string;
  content: string;
  metrics: Array<{ label: string; value: string | number }>;
}

/**
 * Professional Reporting Dashboard
 */
export default function ReportingDashboard() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState<'quarterly' | 'annual' | 'incident' | 'compliance'>('quarterly');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const reports: Report[] = [
    {
      id: '1',
      title: 'Q3 2024 Security Posture Report',
      type: 'quarterly',
      period: 'July - September 2024',
      status: 'final',
      generatedDate: new Date('2024-10-01'),
      recipients: 12,
      metrics: [
        { label: 'Total Incidents', value: '24' },
        { label: 'SLA Compliance', value: '96%' },
        { label: 'Threats Blocked', value: '2,847' },
        { label: 'Mean Time to Detect', value: '45 min' },
      ],
    },
    {
      id: '2',
      title: 'Healthcare Data Breach Response - Incident Report',
      type: 'incident',
      period: 'August 15, 2024',
      status: 'final',
      generatedDate: new Date('2024-08-20'),
      recipients: 8,
      metrics: [
        { label: 'Detection Time', value: '12 min' },
        { label: 'Response Time', value: '30 min' },
        { label: 'Resolution Time', value: '4 hours' },
        { label: 'Records Affected', value: '0' },
      ],
    },
    {
      id: '3',
      title: 'HIPAA Compliance Assessment 2024',
      type: 'compliance',
      period: 'Annual Assessment',
      status: 'draft',
      generatedDate: new Date('2024-09-15'),
      recipients: 0,
      metrics: [
        { label: 'Compliance Score', value: '88%' },
        { label: 'Critical Findings', value: '0' },
        { label: 'Open Findings', value: '3' },
        { label: 'BAA Status', value: 'Current' },
      ],
    },
  ];

  const reportSections: ReportSection[] = [
    {
      title: 'Executive Summary',
      content:
        'This report summarizes security posture, incident management, and compliance status for Q3 2024. The organization effectively managed 24 security incidents with 96% SLA compliance, demonstrating mature incident response capabilities.',
      metrics: [
        { label: 'Total Incidents', value: '24' },
        { label: 'Critical Incidents', value: '2' },
        { label: 'High Severity', value: '8' },
      ],
    },
    {
      title: 'Performance Metrics',
      content:
        'Key performance indicators show consistent improvement in detection and response times. System uptime remained at 99.8%, exceeding organizational targets.',
      metrics: [
        { label: 'Mean Time to Detect', value: '45 min' },
        { label: 'Mean Time to Respond', value: '30 min' },
        { label: 'Mean Time to Resolve', value: '8 hours' },
        { label: 'System Uptime', value: '99.8%' },
      ],
    },
    {
      title: 'Threat Landscape',
      content:
        'Healthcare sector continues to face elevated ransomware threat. Phishing attempts increased 15% but successful compromise rate remained low due to enhanced email security.',
      metrics: [
        { label: 'Phishing Emails', value: '3,247' },
        { label: 'Blocked', value: '99.8%' },
        { label: 'Malware Detected', value: '156' },
        { label: 'Ransomware Blocked', value: '34' },
      ],
    },
    {
      title: 'Compliance Status',
      content:
        'Organization maintains substantial compliance with HIPAA, HITECH, and SOC 2 requirements. Minor findings from recent assessments are in remediation with 100% on-time completion rate.',
      metrics: [
        { label: 'HIPAA Score', value: '88%' },
        { label: 'SOC 2 Status', value: 'On Track' },
        { label: 'ISO 27001', value: 'Certified' },
        { label: 'Finding Remediation', value: '100%' },
      ],
    },
  ];

  const handleGenerateReport = () => {
    // Simulate report generation
    console.log(`Generating ${reportType} report...`);
    setShowGenerateModal(false);
  };

  const handleDistributeReport = (reportId: string) => {
    // Simulate report distribution
    console.log(`Distributing report ${reportId}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Professional Reporting</h1>
            <p className="mt-2 text-gray-600">
              Executive reports and board-ready presentations
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Generate Report
          </button>
        </div>

        {!selectedReport ? (
          <div className="space-y-6">
            {/* Recent Reports */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Recent Reports</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{report.period}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'final'
                              ? 'bg-green-100 text-green-800'
                              : report.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-600 mt-2">
                          {report.generatedDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                      {report.metrics.map((metric, idx) => (
                        <div key={idx}>
                          <p className="text-xs text-gray-600">{metric.label}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {report.status === 'final' && (
                      <div className="mt-4 flex gap-2">
                        <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDistributeReport(report.id);
                          }}
                          className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                        >
                          Distribute
                        </button>
                        <button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                          Export
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Report Templates */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Available Report Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { type: 'quarterly', title: 'Quarterly Report', icon: '📊' },
                  { type: 'annual', title: 'Annual Review', icon: '📈' },
                  { type: 'incident', title: 'Incident Report', icon: '🚨' },
                  { type: 'compliance', title: 'Compliance Report', icon: '✓' },
                ].map((template) => (
                  <button
                    key={template.type}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <p className="text-2xl mb-2">{template.icon}</p>
                    <p className="font-semibold text-gray-900">{template.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report View */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Reports
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors">
                  Print
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Export as PDF
                </button>
              </div>
            </div>

            {/* Report Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-center mb-8 pb-8 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">{selectedReport.title}</h1>
                <p className="text-gray-600 mt-2">{selectedReport.period}</p>
                <span className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedReport.status === 'final'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedReport.status.toUpperCase()}
                </span>
              </div>

              {/* Report Sections */}
              <div className="space-y-8">
                {reportSections.map((section, idx) => (
                  <div key={idx}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">{section.content}</p>

                    {/* Section Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      {section.metrics.map((metric, midx) => (
                        <div key={midx}>
                          <p className="text-sm text-gray-600">{metric.label}</p>
                          <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                        </div>
                      ))}
                    </div>

                    {idx < reportSections.length - 1 && (
                      <hr className="mt-8" />
                    )}
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Recommendations</h3>
                <ul className="space-y-3">
                  {[
                    'Implement advanced threat detection capabilities',
                    'Enhance network segmentation for critical systems',
                    'Expand security awareness training program',
                    'Establish threat intelligence sharing partnerships',
                    'Develop ransomware recovery procedures',
                  ].map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-600 mr-3">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Approval Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">Approvals</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Prepared by: Security Operations Team</span>
                    <span className="text-gray-600">October 1, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Reviewed by: Chief Information Security Officer</span>
                    <span className="text-gray-600">October 2, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Approved by: Board of Directors</span>
                    <span className="text-gray-600">October 3, 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate New Report</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="quarterly">Quarterly Report</option>
                    <option value="annual">Annual Report</option>
                    <option value="incident">Incident Report</option>
                    <option value="compliance">Compliance Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period
                  </label>
                  <input
                    type="month"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="2024-09"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
