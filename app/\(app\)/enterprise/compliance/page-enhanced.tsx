'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs, Badge } from '@/components';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';
import { BarChart } from '@/app/components/charts/BarChart';

interface PrivacyRight {
  id: string;
  type: string;
  status: string;
  requestedAt: Date;
  completedAt?: Date;
}

interface ConsentRecord {
  id: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
}

export default function EnhancedCompliancePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [privacyRights, setPrivacyRights] = useState<PrivacyRight[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestType, setRequestType] = useState('access');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes] = await Promise.all([
        fetch('/api/enterprise/compliance-reports'),
      ]);

      if (reportRes.ok) {
        const reportsData = await reportRes.json();
        setDashboard(reportsData.data?.[0] || null);
      }

      // Mock data for demo
      setPrivacyRights([
        {
          id: 'right-1',
          type: 'access',
          status: 'completed',
          requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'right-2',
          type: 'deletion',
          status: 'pending',
          requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]);

      setConsents([
        {
          id: 'consent-1',
          consentType: 'marketing',
          granted: true,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'consent-2',
          consentType: 'analytics',
          granted: true,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyRequest = async () => {
    try {
      // In production, call API endpoint
      setShowNewRequest(false);
    } catch (err) {
      setError('Failed to create privacy request');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FadeIn>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">GDPR/CCPA Compliance</h1>
              <p className="text-gray-400 mt-2">
                Data privacy, consent management, and regulatory compliance
              </p>
            </div>
            <Button
              onClick={() => setShowNewRequest(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              New Privacy Request
            </Button>
          </div>
        </FadeIn>

        {error && (
          <FadeIn>
            <Card className="bg-red-900/20 border-red-700 p-4">
              <p className="text-red-400">{error}</p>
            </Card>
          </FadeIn>
        )}

        <FadeIn>
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">Data Subjects</p>
              <p className="text-3xl font-bold text-white mt-2">
                {dashboard?.dataSubjectsCount || 0}
              </p>
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">Compliance Status</p>
              <Badge
                variant={dashboard?.complianceStatus === 'compliant' ? 'green' : 'yellow'}
                text={dashboard?.complianceStatus?.toUpperCase() || 'UNKNOWN'}
                className="mt-2"
              />
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">Privacy Requests</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">
                {privacyRights.length}
              </p>
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">Data Processing Agreements</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">
                {dashboard?.dpaCount || 0}
              </p>
            </Card>
          </div>
        </FadeIn>

        <FadeIn>
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'privacy-rights', label: 'Privacy Rights' },
              { id: 'consents', label: 'Consent Management' },
              { id: 'audit-trail', label: 'Audit Trail' },
              { id: 'data-processing', label: 'Data Processing' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </FadeIn>

        {activeTab === 'overview' && (
          <FadeIn>
            <div className="space-y-4">
              {dashboard && (
                <>
                  <Card className="bg-gray-800 p-6 border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Compliance Score
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <div className="relative w-32 h-32 mx-auto">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                          <div className="absolute inset-2 rounded-full bg-gray-800 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {dashboard.score || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-400 text-sm">Framework</p>
                            <Badge variant="blue" text={dashboard.framework || 'GDPR'} />
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Last Generated</p>
                            <p className="text-white font-semibold">
                              {new Date(dashboard.generatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gray-800 p-6 border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Data Processing Activities</p>
                        <p className="text-2xl font-bold text-white mt-2">12</p>
                      </div>
                      <div className="bg-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Security Measures</p>
                        <p className="text-2xl font-bold text-white mt-2">6</p>
                      </div>
                      <div className="bg-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Data Breaches (YTD)</p>
                        <p className="text-2xl font-bold text-green-400 mt-2">0</p>
                      </div>
                      <div className="bg-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Audit Trail Entries</p>
                        <p className="text-2xl font-bold text-white mt-2">
                          {dashboard.auditTrailEntries || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </FadeIn>
        )}

        {activeTab === 'privacy-rights' && (
          <FadeIn>
            <div className="space-y-4">
              {showNewRequest && (
                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    New Privacy Request
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        Request Type
                      </label>
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      >
                        <option value="access">Right to Access</option>
                        <option value="deletion">Right to Be Forgotten</option>
                        <option value="rectification">Right to Rectification</option>
                        <option value="portability">Right to Data Portability</option>
                        <option value="restriction">Right to Restrict Processing</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Additional information"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                      rows={3}
                    />
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handlePrivacyRequest}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Submit Request
                      </Button>
                      <Button
                        onClick={() => setShowNewRequest(false)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {privacyRights.map((right) => (
                <Card key={right.id} className="bg-gray-800 p-6 border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {right.type.charAt(0).toUpperCase() + right.type.slice(1)} Request
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Requested on {new Date(right.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={right.status === 'completed' ? 'green' : 'yellow'}
                      text={right.status.toUpperCase()}
                    />
                  </div>
                  {right.completedAt && (
                    <p className="text-gray-400 text-sm mt-2">
                      Completed on {new Date(right.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {activeTab === 'consents' && (
          <FadeIn>
            <div className="space-y-4">
              {consents.map((consent) => (
                <Card key={consent.id} className="bg-gray-800 p-6 border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {consent.consentType.charAt(0).toUpperCase() +
                          consent.consentType.slice(1)}{' '}
                        Consent
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(consent.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={consent.granted ? 'green' : 'red'}
                      text={consent.granted ? 'GRANTED' : 'WITHDRAWN'}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {activeTab === 'audit-trail' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Audit Trail
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300">
                <p className="text-center text-gray-400">
                  Audit trail entries will be displayed here
                </p>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === 'data-processing' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Data Processing Activities
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-700 rounded p-4">
                  <p className="text-white font-semibold">User Authentication</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Processing method: Automated | Legal basis: Contract
                  </p>
                </div>
                <div className="bg-gray-700 rounded p-4">
                  <p className="text-white font-semibold">Analytics</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Processing method: Automated | Legal basis: Consent
                  </p>
                </div>
                <div className="bg-gray-700 rounded p-4">
                  <p className="text-white font-semibold">Security Monitoring</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Processing method: Automated | Legal basis: Legitimate Interest
                  </p>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
