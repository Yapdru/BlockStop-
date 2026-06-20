'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Input } from '@/components';
import { a11y } from '@/lib/a11y';

interface WiFiNetwork {
  id: string;
  ssid: string;
  encryption: 'Open' | 'WEP' | 'WPA' | 'WPA2' | 'WPA3';
  signal: number;
  channel: number;
  threats: string[];
  riskScore: number;
  isHidden: boolean;
}

export default function WiFiCheckerPage() {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([
    {
      id: '1',
      ssid: 'HomeNetwork-Secure',
      encryption: 'WPA3',
      signal: 95,
      channel: 6,
      threats: [],
      riskScore: 0,
      isHidden: false,
    },
    {
      id: '2',
      ssid: 'CoffeShop-Public',
      encryption: 'Open',
      signal: 78,
      channel: 11,
      threats: ['Unencrypted', 'Public network', 'No authentication'],
      riskScore: 85,
      isHidden: false,
    },
    {
      id: '3',
      ssid: 'OldRouter',
      encryption: 'WEP',
      signal: 45,
      channel: 1,
      threats: ['Deprecated encryption', 'WEP is insecure'],
      riskScore: 95,
      isHidden: false,
    },
    {
      id: '4',
      ssid: 'NeighborWiFi',
      encryption: 'WPA2',
      signal: 62,
      channel: 8,
      threats: ['Weak password detected'],
      riskScore: 40,
      isHidden: false,
    },
    {
      id: '5',
      ssid: '',
      encryption: 'WPA2',
      signal: 55,
      channel: 13,
      threats: ['Hidden network', 'Suspicious behavior'],
      riskScore: 60,
      isHidden: true,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);

  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'danger';
    if (score >= 50) return 'warning';
    return 'success';
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 80) return 'Critical';
    if (score >= 50) return 'Medium';
    return 'Safe';
  };

  const getEncryptionStatus = (encryption: string): string => {
    const status: Record<string, string> = {
      'WPA3': '🔒 Excellent',
      'WPA2': '✓ Good',
      'WPA': '⚠️ Weak',
      'WEP': '🔴 Compromised',
      'Open': '❌ None',
    };
    return status[encryption] || 'Unknown';
  };

  const handleRescan = async () => {
    setScanning(true);
    // Simulate scan
    setTimeout(() => {
      setScanning(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0" id="main-content">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 bg-primary-600 text-white rounded-b-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 -translate-y-full focus:translate-y-0 transition-transform"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded font-medium"
              aria-label="Back to dashboard"
            >
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">
              <span aria-hidden="true">📡</span> WiFi Security Checker
            </h1>
          </div>
          <p className="text-sm text-neutral-600">Scan nearby networks for security vulnerabilities</p>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Scan Button */}
        <div className="mb-8">
          <Button
            variant="primary"
            className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
            onClick={handleRescan}
            disabled={scanning}
            aria-busy={scanning}
            aria-label={scanning ? 'Scanning networks' : 'Refresh WiFi scan'}
          >
            {scanning ? <><span aria-hidden="true">🔄</span> Scanning networks...</> : <><span aria-hidden="true">📡</span> Refresh Scan</>}
          </Button>
        </div>

        {/* Networks List */}
        <div className="space-y-4">
          {networks.map((network) => (
            <Card
              key={network.id}
              padding="lg"
              className="cursor-pointer transition hover:border-primary-300"
              onClick={() => setSelectedNetwork(selectedNetwork?.id === network.id ? null : network)}
            >
              {/* Network Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📡</span>
                    <div>
                      <h3 className="text-h5 font-bold text-neutral-900">
                        {network.isHidden ? '🔒 Hidden Network' : network.ssid}
                      </h3>
                      <p className="text-xs text-neutral-600">Channel {network.channel}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-neutral-600">Signal Strength</p>
                    <p className="text-h6 font-bold text-neutral-900">{network.signal}%</p>
                  </div>
                  <Badge variant={getRiskColor(network.riskScore)}>
                    {getRiskLevel(network.riskScore)}
                  </Badge>
                </div>
              </div>

              {/* Security Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 mb-4 border-b border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-600">Encryption</p>
                  <p className="text-sm font-medium text-neutral-900">{getEncryptionStatus(network.encryption)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600">Type</p>
                  <p className="text-sm font-medium text-neutral-900">{network.encryption}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600">Risk Score</p>
                  <p className="text-h6 font-bold text-neutral-900">{network.riskScore}/100</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600">Threats</p>
                  <p className="text-h6 font-bold text-neutral-900">{network.threats.length}</p>
                </div>
              </div>

              {/* Threats List */}
              {network.threats.length > 0 && (
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-neutral-900 mb-2">⚠️ Detected Issues:</p>
                  <ul className="space-y-1">
                    {network.threats.map((threat, idx) => (
                      <li key={idx} className="text-xs text-neutral-700">
                        • {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expandable Details */}
              {selectedNetwork?.id === network.id && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 mb-2">Recommendations:</p>
                    <ul className="space-y-1 text-xs text-neutral-700">
                      {network.encryption === 'Open' && (
                        <li>✓ Use WPA3 encryption if available</li>
                      )}
                      {network.encryption === 'WEP' && (
                        <li>✓ Update router to WPA2/WPA3 immediately</li>
                      )}
                      {network.threats.length === 0 && (
                        <li>✓ This network is secure</li>
                      )}
                      <li>✓ Use VPN when connecting to untrusted networks</li>
                      <li>✓ Disable auto-connect for public networks</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-900 mb-2">Network Details:</p>
                    <dl className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">SSID:</dt>
                        <dd className="font-mono font-medium">{network.ssid || 'Hidden'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Frequency:</dt>
                        <dd className="font-medium">2.4 GHz (Channel {network.channel})</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-neutral-600">Signal:</dt>
                        <dd className="font-medium">{network.signal}% strength</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Expand Toggle */}
              <div className="text-center pt-2">
                <p className="text-xs text-primary-600 font-medium cursor-pointer">
                  {selectedNetwork?.id === network.id ? '▲ Collapse' : '▼ Details'}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 space-y-4">
          <Card padding="lg" className="border-warning/20 bg-warning/5">
            <h3 className="font-semibold text-neutral-900 mb-2">🛡️ WiFi Security Tips</h3>
            <ul className="text-sm text-neutral-700 space-y-2">
              <li>✓ Only connect to networks you trust</li>
              <li>✓ Use WPA3 encryption when available</li>
              <li>✓ Disable auto-connect for public networks</li>
              <li>✓ Use VPN on untrusted networks</li>
              <li>✓ Keep your router firmware updated</li>
            </ul>
          </Card>

          <Card padding="lg" className="border-primary-200 bg-primary-50">
            <h3 className="font-semibold text-neutral-900 mb-2">📱 Mobile & Desktop Protection</h3>
            <p className="text-sm text-neutral-700">
              BlockStop monitors WiFi networks in real-time and alerts you to security risks before you connect.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
