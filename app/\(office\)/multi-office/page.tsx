'use client';

/**
 * BlockStop OFFICE Tier - Multi-Location Management
 * Multi-office/location support with regional compliance requirements
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
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  Plus,
  Sync,
  TrendingUp,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'regional';
  region: string;
  timezone: string;
  riskLevel: 'low' | 'medium' | 'high';
  teams: number;
  complianceScore: number;
  lastSync?: Date;
  status: 'healthy' | 'degraded' | 'offline';
}

const MultiOfficePage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [locations] = useState<Location[]>([
    {
      id: '1',
      name: 'New York (HQ)',
      type: 'primary',
      region: 'US-East',
      timezone: 'EST',
      riskLevel: 'low',
      teams: 4,
      complianceScore: 96,
      lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'healthy',
    },
    {
      id: '2',
      name: 'London',
      type: 'secondary',
      region: 'EU-West',
      timezone: 'GMT',
      riskLevel: 'low',
      teams: 2,
      complianceScore: 94,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'healthy',
    },
    {
      id: '3',
      name: 'Singapore',
      type: 'regional',
      region: 'APAC',
      timezone: 'SGT',
      riskLevel: 'medium',
      teams: 1,
      complianceScore: 91,
      lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'healthy',
    },
    {
      id: '4',
      name: 'São Paulo',
      type: 'regional',
      region: 'LATAM',
      timezone: 'BRT',
      riskLevel: 'medium',
      teams: 1,
      complianceScore: 88,
      lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'degraded',
    },
  ]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'offline':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const overallCompliance = Math.round(
    locations.reduce((sum, l) => sum + l.complianceScore, 0) / locations.length
  );
  const healthyLocations = locations.filter((l) => l.status === 'healthy').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Multi-Location Management</h1>
        <p className="text-gray-600 mt-2">
          Manage security across distributed offices and regional locations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{locations.length}</div>
            <p className="text-xs text-gray-600 mt-2">1 Primary, 3 Secondary/Regional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Healthy Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{healthyLocations}</div>
            <p className="text-xs text-gray-600 mt-2">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallCompliance}%</div>
            <Progress value={overallCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {locations.reduce((sum, l) => sum + l.teams, 0)}
            </div>
            <p className="text-xs text-gray-600 mt-2">Across all locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Location Status Overview</CardTitle>
              <CardDescription>Real-time status of all office locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {locations.map((location) => (
                <div key={location.id} className="p-4 border rounded">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(location.status)}
                      <div>
                        <h4 className="font-medium">{location.name}</h4>
                        <p className="text-sm text-gray-600">
                          {location.region} • {location.timezone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(location.riskLevel)}>
                        {location.riskLevel.toUpperCase()} RISK
                      </Badge>
                      <Badge variant={location.type === 'primary' ? 'default' : 'secondary'}>
                        {location.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-gray-600">Compliance Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold">{location.complianceScore}%</span>
                        {location.complianceScore >= 90 && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Teams</p>
                      <p className="text-lg font-bold mt-1">{location.teams}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Last Sync</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {location.lastSync
                          ? `${Math.round((Date.now() - location.lastSync.getTime()) / 60000)}m ago`
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Compliance Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { region: 'US-East', requirements: 'HIPAA, SOC2' },
                { region: 'EU-West', requirements: 'GDPR, ISO27001' },
                { region: 'APAC', requirements: 'PDPA, IAPP' },
                { region: 'LATAM', requirements: 'LGPD' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{item.region}</span>
                  <span className="text-sm text-gray-600">{item.requirements}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {location.name}
                      </CardTitle>
                      <CardDescription>{location.region}</CardDescription>
                    </div>
                    {getStatusIcon(location.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <Badge variant="outline">{location.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timezone</span>
                      <span className="font-medium">{location.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level</span>
                      <Badge className={getRiskColor(location.riskLevel)}>
                        {location.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Teams</span>
                      <span className="font-medium">{location.teams}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2">Compliance Score</p>
                    <Progress value={location.complianceScore} />
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Users className="w-4 h-4 mr-1" />
                      Teams
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance by Location</CardTitle>
              <CardDescription>Framework compliance status across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {locations.map((location) => (
                  <div key={location.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{location.name}</h4>
                      <span className="text-lg font-bold">{location.complianceScore}%</span>
                    </div>
                    <Progress value={location.complianceScore} />
                    <div className="text-sm text-gray-600">
                      {location.complianceScore >= 90 ? (
                        <span className="text-green-600">
                          ✓ Compliant with all regional requirements
                        </span>
                      ) : location.complianceScore >= 80 ? (
                        <span className="text-yellow-600">
                          ⚠ Minor gaps in compliance requirements
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ✗ Significant compliance gaps require attention
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  location: 'São Paulo',
                  issue: 'LGPD compliance gap (88% score)',
                  action: 'Schedule remediation audit',
                },
                {
                  location: 'Singapore',
                  issue: 'PDPA documentation incomplete',
                  action: 'Update policy documentation',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.location}</p>
                      <p className="text-sm text-gray-700 mt-1">{item.issue}</p>
                      <p className="text-sm text-yellow-700 mt-1 font-medium">{item.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Location Sync Status</CardTitle>
              <CardDescription>Data synchronization across all locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-gray-600">
                        Last sync:{' '}
                        {location.lastSync
                          ? new Date(location.lastSync).toLocaleTimeString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {location.status === 'healthy' && (
                        <Badge variant="outline" className="text-green-700">
                          In Sync
                        </Badge>
                      )}
                      {location.status === 'degraded' && (
                        <Badge variant="outline" className="text-yellow-700">
                          Syncing...
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost">
                        <Sync className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-2">Sync Frequency</label>
                  <select className="w-full border rounded px-3 py-2">
                    <option>Hourly</option>
                    <option>Every 2 hours</option>
                    <option selected>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Sync Direction</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="direction" checked /> Bidirectional
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="direction" /> Primary to Secondary Only
                    </label>
                  </div>
                </div>
              </div>

              <Button className="w-full">Save Sync Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiOfficePage;
