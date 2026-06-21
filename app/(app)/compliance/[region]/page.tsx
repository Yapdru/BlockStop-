'use client';

/**
 * BlockStop Phase 28.5 - Regional Compliance Dashboard
 * Display compliance status and requirements per region
 */

import React, { useState, useEffect } from 'react';
import { regionalComplianceChecker } from '@/lib/compliance/regional-checker';
import { REGION_METADATA, DataRegion } from '@/lib/data/region-manager';

interface CompliancePageProps {
  params: {
    region: string;
  };
}

export default function CompliancePage({ params }: CompliancePageProps) {
  const region = params.region.toUpperCase() as DataRegion;
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any>(null);

  useEffect(() => {
    // Load compliance data
    const checks = regionalComplianceChecker.checkRegionalCompliance(region);
    setComplianceData(checks);
    setLoading(false);
  }, [region]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const metadata = REGION_METADATA[region];

  if (!metadata) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-600">Region Not Found</h1>
        <p>The region "{region}" is not supported.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{metadata.name} Compliance</h1>
        <p className="text-gray-600">
          Compliance status for {metadata.region} region
        </p>
      </div>

      {/* Region Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Region Details</h2>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Code:</span> {metadata.code}
            </p>
            <p>
              <span className="font-semibold">Region:</span> {metadata.region}
            </p>
            <p>
              <span className="font-semibold">Countries:</span>{' '}
              {metadata.countries.join(', ')}
            </p>
            <p>
              <span className="font-semibold">GDPR Required:</span>{' '}
              {metadata.gdprRequired ? 'Yes' : 'No'}
            </p>
            <p>
              <span className="font-semibold">Data Residency Enforced:</span>{' '}
              {metadata.dataResidencyEnforced ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Compliance Frameworks</h2>
          <div className="space-y-2">
            {metadata.complianceFrameworks.map((framework, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm"
              >
                {framework}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Checks */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Compliance Checks</h2>
        <div className="space-y-4">
          {complianceData?.map((check: any) => (
            <div
              key={check.framework}
              className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{check.framework}</h3>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold">Status:</span>
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          check.status === 'compliant'
                            ? 'bg-green-100 text-green-800'
                            : check.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Last checked: {new Date(check.lastChecked).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-3">Requirements</h4>
                <div className="space-y-2">
                  {check.requirements?.map((req: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={req.status === 'met'}
                        disabled
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{req.name}</p>
                        <p className="text-xs text-gray-600">{req.description}</p>
                        {req.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Note: {req.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          req.status === 'met'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Configuration */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4">Security Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">API Endpoint</h3>
            <p className="text-sm text-gray-600 break-all">
              {metadata.endpoints.api}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Database Endpoint</h3>
            <p className="text-sm text-gray-600 break-all">
              {metadata.endpoints.database}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Storage Endpoint</h3>
            <p className="text-sm text-gray-600 break-all">
              {metadata.endpoints.storage}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Encryption</h3>
            <p className="text-sm text-gray-600">
              {metadata.encryptionRequired ? 'Required' : 'Optional'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Export Report
        </button>
        <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          View Details
        </button>
      </div>
    </div>
  );
}
