'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs, Badge } from '@/components';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';
import { LineChart } from '@/app/components/charts/LineChart';

interface Device {
  deviceId: string;
  deviceName: string;
  owner: string;
  osType: string;
  trustLevel: string;
  score: number;
  lastSeen: Date;
  risks: string[];
}

export default function ZeroTrustPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');
  const [error, setError] = useState('');
  const [showRegisterDevice, setShowRegisterDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceName: '',
    osType: 'windows',
    osVersion: '',
    hardwareId: '',
    owner: '',
  });
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      // Mock data for demo
      const mockDevices: Device[] = [
        {
          deviceId: 'dev-001',
          deviceName: 'John-Laptop',
          owner: 'john@company.com',
          osType: 'windows',
          trustLevel: 'high',
          score: 85,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          risks: [],
        },
        {
          deviceId: 'dev-002',
          deviceName: 'Mary-MacBook',
          owner: 'mary@company.com',
          osType: 'macos',
          trustLevel: 'critical',
          score: 92,
          lastSeen: new Date(Date.now() - 30 * 60 * 1000),
          risks: [],
        },
        {
          deviceId: 'dev-003',
          deviceName: 'Mobile-Device',
          owner: 'bob@company.com',
          osType: 'ios',
          trustLevel: 'medium',
          score: 65,
          lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000),
          risks: ['Antivirus not installed', 'Firewall not enabled'],
        },
      ];
      setDevices(mockDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    try {
      const response = await fetch('/api/enterprise/trust-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      });

      if (response.ok) {
        await fetchDevices();
        setNewDevice({
          deviceName: '',
          osType: 'windows',
          osVersion: '',
          hardwareId: '',
          owner: '',
        });
        setShowRegisterDevice(false);
      }
    } catch (err) {
      setError('Failed to register device');
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-green-600 text-white';
      case 'high':
        return 'bg-blue-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
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
              <h1 className="text-3xl font-bold text-white">Zero-Trust Architecture</h1>
              <p className="text-gray-400 mt-2">
                Device trust scoring, continuous authentication, and micro-segmentation
              </p>
            </div>
            <Button
              onClick={() => setShowRegisterDevice(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Register Device
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
              <p className="text-gray-400 text-sm">Total Devices</p>
              <p className="text-3xl font-bold text-white mt-2">{devices.length}</p>
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">Average Trust Score</p>
              <p className="text-3xl font-bold text-white mt-2">
                {Math.round(devices.reduce((sum, d) => sum + d.score, 0) / devices.length)}
              </p>
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">High Trust Devices</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {devices.filter(d => d.score >= 80).length}
              </p>
            </Card>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <p className="text-gray-400 text-sm">At-Risk Devices</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {devices.filter(d => d.score < 60).length}
              </p>
            </Card>
          </div>
        </FadeIn>

        <FadeIn>
          <Tabs
            tabs={[
              { id: 'devices', label: 'Devices', badge: devices.length },
              { id: 'policies', label: 'Access Policies' },
              { id: 'segments', label: 'Micro-Segments' },
              { id: 'analytics', label: 'Analytics' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </FadeIn>

        {activeTab === 'devices' && (
          <FadeIn>
            <div className="space-y-4">
              {showRegisterDevice && (
                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Register New Device
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Device name"
                      value={newDevice.deviceName}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, deviceName: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <select
                      value={newDevice.osType}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, osType: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="windows">Windows</option>
                      <option value="macos">macOS</option>
                      <option value="linux">Linux</option>
                      <option value="ios">iOS</option>
                      <option value="android">Android</option>
                    </select>
                    <input
                      type="text"
                      placeholder="OS version"
                      value={newDevice.osVersion}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, osVersion: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Hardware ID"
                      value={newDevice.hardwareId}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, hardwareId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <input
                      type="email"
                      placeholder="Owner email"
                      value={newDevice.owner}
                      onChange={(e) =>
                        setNewDevice({ ...newDevice, owner: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                    />
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleRegisterDevice}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Register
                      </Button>
                      <Button
                        onClick={() => setShowRegisterDevice(false)}
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {devices.map((device) => (
                <Card
                  key={device.deviceId}
                  className="bg-gray-800 p-6 border-gray-700 cursor-pointer hover:border-gray-600 transition"
                  onClick={() => setSelectedDevice(device)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {device.deviceName}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{device.owner}</p>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-semibold ${getTrustLevelColor(device.trustLevel)}`}>
                      {device.trustLevel.toUpperCase()} ({device.score})
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400">OS</p>
                      <p className="text-white font-semibold">{device.osType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Trust Score</p>
                      <div className="w-full bg-gray-700 rounded h-2 mt-2">
                        <div
                          className={`h-full rounded ${
                            device.score >= 80
                              ? 'bg-green-500'
                              : device.score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${device.score}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Seen</p>
                      <p className="text-white font-semibold">
                        {device.lastSeen.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Encryption</p>
                      <Badge variant="green" text="Enabled" />
                    </div>
                    <div>
                      <p className="text-gray-400">Antivirus</p>
                      <Badge variant={device.risks.length > 0 ? 'red' : 'green'} text={device.risks.length > 0 ? 'Not Protected' : 'Protected'} />
                    </div>
                  </div>

                  {device.risks.length > 0 && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
                      <p className="text-yellow-400 text-sm font-semibold mb-2">
                        Security Risks:
                      </p>
                      <ul className="space-y-1">
                        {device.risks.map((risk, idx) => (
                          <li key={idx} className="text-yellow-300 text-sm">
                            • {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </FadeIn>
        )}

        {activeTab === 'policies' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Access Policies
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <p className="text-white font-semibold">Default Deny</p>
                      <p className="text-gray-400 text-sm">Deny all access by default</p>
                    </div>
                    <Badge variant="red" text="Active" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <p className="text-white font-semibold">Admin MFA Required</p>
                      <p className="text-gray-400 text-sm">All admin access requires MFA</p>
                    </div>
                    <Badge variant="green" text="Active" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <p className="text-white font-semibold">High Trust Access</p>
                      <p className="text-gray-400 text-sm">Allow access for devices with high trust score</p>
                    </div>
                    <Badge variant="green" text="Active" />
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === 'segments' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Micro-Segments
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300">
                <div className="space-y-3">
                  <div className="p-3 bg-gray-800 rounded">
                    <p className="text-white font-semibold">Admin Segment</p>
                    <p className="text-gray-400 text-sm">Restricted access for administrators</p>
                    <p className="text-gray-500 text-xs mt-2">Requires: MFA + High Trust (80+)</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <p className="text-white font-semibold">Standard User Segment</p>
                    <p className="text-gray-400 text-sm">Standard access for team members</p>
                    <p className="text-gray-500 text-xs mt-2">Requires: Medium Trust (60+)</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <p className="text-white font-semibold">Public Segment</p>
                    <p className="text-gray-400 text-sm">Limited public access</p>
                    <p className="text-gray-500 text-xs mt-2">Requires: Low Trust (40+)</p>
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {activeTab === 'analytics' && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Trust Score Analytics
              </h3>
              <div className="bg-gray-700 rounded p-4 text-gray-300 text-center">
                <p>Analytics visualization coming soon</p>
              </div>
            </Card>
          </FadeIn>
        )}

        {selectedDevice && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Device Details: {selectedDevice.deviceName}
                </h3>
                <Button
                  onClick={() => setSelectedDevice(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Owner</p>
                  <p className="text-white font-semibold">{selectedDevice.owner}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">OS Type</p>
                  <p className="text-white font-semibold">{selectedDevice.osType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Trust Score</p>
                  <p className="text-white font-semibold">{selectedDevice.score}/100</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Last Seen</p>
                  <p className="text-white font-semibold">
                    {selectedDevice.lastSeen.toLocaleString()}
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
