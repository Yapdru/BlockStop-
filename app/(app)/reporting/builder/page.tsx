"use client";

import React, { useState } from "react";

interface ReportConfig {
  title: string;
  reportType: "executive" | "technical" | "forensics" | "hunting";
  format: "pdf" | "excel" | "json" | "csv";
  includeCharts: boolean;
  includeBranding: boolean;
  sections: string[];
}

export default function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    title: "Security Report",
    reportType: "executive",
    format: "pdf",
    includeCharts: true,
    includeBranding: true,
    sections: ["executive_summary", "findings", "recommendations"],
  });

  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const availableSections = [
    { id: "executive_summary", label: "Executive Summary" },
    { id: "findings", label: "Detailed Findings" },
    { id: "timeline", label: "Timeline Analysis" },
    { id: "evidence", label: "Evidence Details" },
    { id: "recommendations", label: "Recommendations" },
    { id: "appendix", label: "Technical Appendix" },
  ];

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reporting/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      setGeneratedReport(data);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Report Builder</h1>
        <p className="text-gray-600">Create and customize security reports</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="font-bold text-lg">Configuration</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) =>
                  setConfig({ ...config, title: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Report Type
              </label>
              <select
                value={config.reportType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    reportType: e.target.value as any,
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value="executive">Executive Summary</option>
                <option value="technical">Technical Analysis</option>
                <option value="forensics">Forensics Report</option>
                <option value="hunting">Threat Hunting</option>
              </select>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Export Format
              </label>
              <select
                value={config.format}
                onChange={(e) =>
                  setConfig({ ...config, format: e.target.value as any })
                }
                className="w-full p-2 border rounded"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeCharts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      includeCharts: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">Include Charts & Graphs</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeBranding}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      includeBranding: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">Include Branding</span>
              </label>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Sections Panel */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="font-bold text-lg">Sections</h2>
            <div className="space-y-2">
              {availableSections.map((section) => (
                <label key={section.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.sections.includes(section.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          sections: [...config.sections, section.id],
                        });
                      } else {
                        setConfig({
                          ...config,
                          sections: config.sections.filter(
                            (s) => s !== section.id
                          ),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{section.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-4">Preview</h2>
            {generatedReport ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Report ID:</span>
                  <p className="font-mono text-sm">{generatedReport.report.reportId}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Type:</span>
                  <p className="text-sm capitalize">{generatedReport.report.type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Format:</span>
                  <p className="text-sm uppercase">{generatedReport.report.format}</p>
                </div>
                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-600">Summary:</span>
                  <p className="text-sm mt-2">
                    Total Findings: {generatedReport.report.summary.totalFindings}
                  </p>
                  <p className="text-sm">
                    Critical: {generatedReport.report.summary.criticalFindings}
                  </p>
                </div>
                <a
                  href={generatedReport.downloadUrl}
                  className="block px-4 py-2 bg-green-600 text-white rounded text-center hover:bg-green-700 mt-4"
                >
                  Download Report
                </a>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Configure and generate a report to see preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
