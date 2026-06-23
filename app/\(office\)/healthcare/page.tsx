'use client';

/**
 * BlockStop OFFICE Tier - Healthcare-Specific Features
 * HIPAA compliance, patient data protection, BAA management
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  Users,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';

interface BAA {
  id: string;
  associateName: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'draft';
  effectiveDate: Date;
  expiryDate?: Date;
  daysUntilExpiry?: number;
}

interface PatientAccessLog {
  timestamp: Date;
  userId: string;
  patientId: string;
  action: 'read' | 'write' | 'delete' | 'export';
  dataType: string;
  allowed: boolean;
}

const HealthcarePage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const [baas] = useState<BAA[]>([
    {
      id: '1',
      associateName: 'EHR Provider Inc',
      status: 'active',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2025-12-31'),
      daysUntilExpiry: 580,
    },
    {
      id: '2',
      associateName: 'Cloud Backup Services',
      status: 'expiring_soon',
      effectiveDate: new Date('2022-06-01'),
      expiryDate: new Date('2024-08-31'),
      daysUntilExpiry: 60,
    },
    {
      id: '3',
      associateName: 'Analytics Provider',
      status: 'draft',
      effectiveDate: new Date('2024-07-01'),
    },
  ]);

  const [accessLogs] = useState<PatientAccessLog[]>([
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: 'doctor_001',
      patientId: 'patient_123',
      action: 'read',
      dataType: 'Medical Records',
      allowed: true,
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      userId: 'nurse_005',
      patientId: 'patient_456',
      action: 'write',
      dataType: 'Vital Signs',
      allowed: true,
    },
    {
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
      userId: 'admin_002',
      patientId: 'patient_789',
      action: 'export',
      dataType: 'Complete Medical Record',
      allowed: true,
    },
  ]);

  const hipaaComplianceItems = [
    { item: 'HIPAA enabled', status: 'complete', notes: 'Fully configured' },
    { item: 'Patient data encryption', status: 'complete', notes: 'AES-256-GCM' },
    { item: 'Access controls defined', status: 'complete', notes: '5 roles configured' },
    { item: 'Breach notification enabled', status: 'complete', notes: 'Automated' },
    { item: 'Audit logging enabled', status: 'complete', notes: 'Monthly reviews' },
    { item: 'BAAs in place', status: 'warning', notes: '1 expiring soon' },
    { item: 'Encryption key rotation', status: 'complete', notes: 'Last: 60 days ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBAAStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expiring_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Healthcare Compliance</h1>
        <p className="text-gray-600 mt-2">
          HIPAA compliance, patient data protection, and healthcare-specific security
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">HIPAA Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94%</div>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Patient Records Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45,231</div>
            <p className="text-xs text-gray-600 mt-2">Encrypted & secured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active BAAs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {baas.filter((b) => b.status === 'active').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {baas.filter((b) => b.status === 'expiring_soon').length} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Breach Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-xs text-gray-600 mt-2">No incidents detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {baas.some((b) => b.status === 'expiring_soon') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Business Associate Agreement Expiring</AlertTitle>
          <AlertDescription>
            {baas.find((b) => b.status === 'expiring_soon')?.associateName} BAA expires in{' '}
            {baas.find((b) => b.status === 'expiring_soon')?.daysUntilExpiry} days. Please renew.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="baas">Business Associates</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HIPAA Compliance Status</CardTitle>
              <CardDescription>Current compliance posture and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hipaaComplianceItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.status === 'complete' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {item.status === 'warning' && (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-gray-600">{item.notes}</p>
                    </div>
                  </div>
                  <Badge
                    variant={item.status === 'complete' ? 'default' : 'secondary'}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Data Protection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <Lock className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">Encryption</p>
                  <p className="text-lg font-bold">AES-256</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <Shield className="w-6 h-6 text-green-600 mb-2" />
                  <p className="text-sm text-gray-600">Access Control</p>
                  <p className="text-lg font-bold">5 Roles</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <Activity className="w-6 h-6 text-purple-600 mb-2" />
                  <p className="text-sm text-gray-600">Key Rotation</p>
                  <p className="text-lg font-bold">90 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>HIPAA Security Rule requirements tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  category: 'Administrative Safeguards',
                  requirements: [
                    'Security Management Process',
                    'Workforce Security',
                    'Security Awareness Training',
                    'Security Incident Procedures',
                  ],
                  complete: 4,
                },
                {
                  category: 'Physical Safeguards',
                  requirements: [
                    'Facility Access Controls',
                    'Workstation Use & Security',
                    'Device Access Management',
                  ],
                  complete: 3,
                },
                {
                  category: 'Technical Safeguards',
                  requirements: [
                    'Access Controls',
                    'Audit Controls',
                    'Integrity Controls',
                    'Transmission Security',
                  ],
                  complete: 4,
                },
              ].map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{section.category}</h4>
                    <Badge variant="outline">
                      {section.complete}/{section.requirements.length}
                    </Badge>
                  </div>
                  <Progress value={(section.complete / section.requirements.length) * 100} />
                  <ul className="text-sm space-y-1">
                    {section.requirements.map((req, ridx) => (
                      <li key={ridx} className="text-gray-600 flex items-center gap-2">
                        {section.complete > ridx ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BAAs Tab */}
        <TabsContent value="baas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Associate Agreements</CardTitle>
              <CardDescription>Manage BAAs with service providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {baas.map((baa) => (
                <div key={baa.id} className="p-4 border rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{baa.associateName}</h4>
                    <Badge className={getBAAStatusColor(baa.status)}>
                      {baa.status === 'expiring_soon' ? `Expires in ${baa.daysUntilExpiry} days` : baa.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Effective: {baa.effectiveDate.toLocaleDateString()}</p>
                    {baa.expiryDate && (
                      <p>Expires: {baa.expiryDate.toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      View Agreement
                    </Button>
                    {baa.status === 'expiring_soon' && (
                      <Button size="sm" className="flex-1">
                        <Clock className="w-4 h-4 mr-2" />
                        Renew
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Add New Business Associate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span>Renew BAA with Cloud Backup Services (60 days remaining)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Sign BAA with Analytics Provider (draft pending)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patient Data Access</CardTitle>
              <CardDescription>Audit trail of patient data access events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 border rounded">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.action.toUpperCase()}</Badge>
                        <span className="font-medium">{log.dataType}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        User: {log.userId} | Patient: {log.patientId}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {log.allowed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Control Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { role: 'Physician', permissions: 'Read, Write, Export', dataTypes: 'PHI, PII, Genetic' },
                  { role: 'Nurse', permissions: 'Read, Write', dataTypes: 'PHI, PII' },
                  { role: 'Administrator', permissions: 'All', dataTypes: 'All' },
                  { role: 'Billing', permissions: 'Read, Export', dataTypes: 'PSI, PII' },
                  { role: 'Patient', permissions: 'Read, Export', dataTypes: 'PHI, PII' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 border rounded">
                    <h4 className="font-medium">{item.role}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Permissions: {item.permissions}
                    </p>
                    <p className="text-sm text-gray-600">
                      Data Types: {item.dataTypes}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HealthcarePage;
