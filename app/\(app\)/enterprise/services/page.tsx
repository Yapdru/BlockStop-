'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs, Badge } from '@/components';
import { FadeIn } from '@/app/components/animations/FadeIn';

interface Service {
  id: string;
  name: string;
  description: string;
  type: 'onboarding' | 'training' | 'consulting' | 'support';
  duration: string;
  price?: string;
  features: string[];
}

const PROFESSIONAL_SERVICES: Service[] = [
  {
    id: 'onboarding-enterprise',
    name: 'Enterprise Onboarding',
    description:
      'Complete onboarding package for enterprise deployments including architecture review, security assessment, and implementation support',
    type: 'onboarding',
    duration: '4-6 weeks',
    features: [
      'Initial security assessment',
      'Architecture design review',
      'RBAC configuration',
      'Zero-trust setup',
      'Integration planning',
      'Staff training',
      '24/7 implementation support',
    ],
  },
  {
    id: 'training-administrators',
    name: 'Administrator Training',
    description: 'Comprehensive training program for system administrators and security teams',
    type: 'training',
    duration: '2 weeks',
    features: [
      'Role-based access control',
      'Zero-trust architecture',
      'Compliance management',
      'Advanced security features',
      'Integration guides',
      'Incident response',
      'Ongoing Q&A sessions',
    ],
  },
  {
    id: 'training-compliance',
    name: 'Compliance & Privacy Training',
    description: 'In-depth training on GDPR/CCPA compliance, privacy controls, and audit requirements',
    type: 'training',
    duration: '1 week',
    features: [
      'GDPR/CCPA requirements',
      'Data privacy controls',
      'Consent management',
      'Audit trail review',
      'Breach notification',
      'Legal compliance checklist',
      'Regulatory reporting',
    ],
  },
  {
    id: 'consulting-architecture',
    name: 'Security Architecture Consulting',
    description:
      'Expert consulting for designing robust security architectures tailored to your organization',
    type: 'consulting',
    duration: 'Flexible',
    features: [
      'Security assessment',
      'Threat modeling',
      'Architecture design',
      'Zero-trust implementation',
      'Compliance roadmap',
      'Risk mitigation strategies',
      'Ongoing advisory',
    ],
  },
  {
    id: 'consulting-compliance',
    name: 'Compliance & Regulatory Consulting',
    description:
      'Specialized consulting for meeting GDPR, CCPA, HIPAA, SOC2, and other regulatory requirements',
    type: 'consulting',
    duration: 'Flexible',
    features: [
      'Compliance gap analysis',
      'Policy development',
      'Process documentation',
      'Audit preparation',
      'DPA development',
      'Privacy impact assessment',
      'Continuous compliance monitoring',
    ],
  },
  {
    id: 'support-premium',
    name: 'Premium Support',
    description: 'Priority support with dedicated technical account manager',
    type: 'support',
    duration: '12 months',
    features: [
      '4-hour response time',
      'Dedicated account manager',
      'Quarterly business reviews',
      'Architecture guidance',
      'Custom integrations',
      'Priority bug fixes',
      'Emergency support (24/7)',
    ],
  },
  {
    id: 'support-enterprise',
    name: 'Enterprise Support',
    description: 'Comprehensive enterprise-grade support with SLA guarantees',
    type: 'support',
    duration: '12 months',
    features: [
      '1-hour response time',
      'Dedicated support team',
      'Monthly business reviews',
      'Strategic planning',
      'Custom development',
      'Guaranteed uptime SLA',
      'Continuous optimization',
    ],
  },
];

export default function ProfessionalServicesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestedService, setRequestedService] = useState<string | null>(null);

  const handleRequestService = (serviceId: string) => {
    setRequestedService(serviceId);
    setTimeout(() => setRequestedService(null), 3000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold text-white">Professional Services</h1>
            <p className="text-gray-400 mt-2">
              Expert onboarding, training, consulting, and support services for enterprises
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'onboarding', label: 'Onboarding', badge: 1 },
              { id: 'training', label: 'Training', badge: 2 },
              { id: 'consulting', label: 'Consulting', badge: 2 },
              { id: 'support', label: 'Support', badge: 2 },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </FadeIn>

        {activeTab === 'overview' && (
          <FadeIn>
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-8 border border-blue-700/50">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Enterprise Success Starts Here
                </h2>
                <p className="text-gray-300 mb-6">
                  Our professional services team has extensive experience helping enterprises
                  implement secure, compliant, and scalable solutions. From initial assessment
                  to ongoing optimization, we're here to ensure your success.
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-gray-400 text-sm">Total Services</p>
                    <p className="text-2xl font-bold text-white mt-2">7</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-gray-400 text-sm">Experts</p>
                    <p className="text-2xl font-bold text-blue-400 mt-2">20+</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-gray-400 text-sm">Years Combined</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">150+</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-gray-400 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-400 mt-2">99%</p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Why Choose Our Services
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex gap-3">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Expert team with decades of enterprise experience</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Customized solutions tailored to your needs</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Guaranteed results and measurable outcomes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Dedicated support throughout the engagement</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Transparent pricing and no hidden costs</span>
                    </li>
                  </ul>
                </Card>

                <Card className="bg-gray-800 p-6 border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Service Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-2 w-3 h-3 bg-blue-500 rounded-full" />
                      <p className="text-white font-semibold">Initial Assessment</p>
                      <p className="text-gray-400 text-sm">Week 1</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-2 w-3 h-3 bg-green-500 rounded-full" />
                      <p className="text-white font-semibold">Design & Planning</p>
                      <p className="text-gray-400 text-sm">Week 2-3</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-2 w-3 h-3 bg-purple-500 rounded-full" />
                      <p className="text-white font-semibold">Implementation</p>
                      <p className="text-gray-400 text-sm">Week 4-6</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-2 w-3 h-3 bg-yellow-500 rounded-full" />
                      <p className="text-white font-semibold">Training & Handoff</p>
                      <p className="text-gray-400 text-sm">Week 7-8</p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="bg-gray-800 p-6 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Our Service Categories
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {['Onboarding', 'Training', 'Consulting', 'Support'].map((category) => (
                    <div
                      key={category}
                      className="bg-gray-700 rounded p-4 cursor-pointer hover:bg-gray-600 transition text-center"
                      onClick={() =>
                        setActiveTab(category.toLowerCase() as typeof activeTab)
                      }
                    >
                      <p className="text-white font-semibold">{category}</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {PROFESSIONAL_SERVICES.filter(
                          (s) =>
                            s.type ===
                            category.toLowerCase().replace(/ing$/, '')
                        ).length}{' '}
                        Services
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </FadeIn>
        )}

        {['onboarding', 'training', 'consulting', 'support'].map((category) => (
          activeTab === category && (
            <FadeIn key={category}>
              <div className="space-y-4">
                {PROFESSIONAL_SERVICES.filter(
                  (s) =>
                    s.type ===
                    category.replace(/ing$/, '')
                ).map((service) => (
                  <Card
                    key={service.id}
                    className="bg-gray-800 p-6 border-gray-700 cursor-pointer hover:border-gray-600 transition"
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          {service.name}
                          {service.price && (
                            <Badge variant="green" text={service.price} />
                          )}
                        </h3>
                        <p className="text-gray-400 mt-2">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Duration</p>
                        <p className="text-white font-semibold">{service.duration}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Key Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="blue" text={feature} />
                        ))}
                        {service.features.length > 3 && (
                          <Badge
                            variant="gray"
                            text={`+${service.features.length - 3} more`}
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestService(service.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                    >
                      {requestedService === service.id ? 'Request Sent!' : 'Request Service'}
                    </Button>
                  </Card>
                ))}
              </div>
            </FadeIn>
          )
        ))}

        {selectedService && (
          <FadeIn>
            <Card className="bg-gray-800 p-6 border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">{selectedService.name}</h2>
                <Button
                  onClick={() => setSelectedService(null)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Close
                </Button>
              </div>

              <p className="text-gray-300 mb-6">{selectedService.description}</p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      <span className="text-gray-400">Type:</span>{' '}
                      <Badge variant="blue" text={selectedService.type.toUpperCase()} />
                    </p>
                    <p>
                      <span className="text-gray-400">Duration:</span>{' '}
                      {selectedService.duration}
                    </p>
                    {selectedService.price && (
                      <p>
                        <span className="text-gray-400">Price:</span> {selectedService.price}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    All Features
                  </h3>
                  <ul className="space-y-2">
                    {selectedService.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-2 text-gray-300">
                        <span className="text-green-400">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => {
                    handleRequestService(selectedService.id);
                    setSelectedService(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Request This Service
                </Button>
                <Button
                  onClick={() => setSelectedService(null)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Back
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>
    </DashboardLayout>
  );
}
