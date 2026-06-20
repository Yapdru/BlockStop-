'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';

const products = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Personal use',
    features: ['Email analysis', 'File scanning', '50 scans/month', 'Basic threats'],
    cta: 'Get Started',
    highlight: false,
    icon: '🆓'
  },
  {
    id: 'neo',
    name: 'NEO',
    price: 99,
    period: '/month',
    periodYear: '₹999/year',
    description: 'Team security',
    features: ['All Free', '6 team members', 'Unlimited scans', 'WiFi security', 'VPN (5)', '2FA auth'],
    cta: 'Start Free Trial',
    highlight: false,
    icon: '🚀'
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 299,
    period: '/month',
    periodYear: '₹2,999/year',
    description: 'Enterprise power',
    features: ['All NEO', 'Unlimited team', 'Threat hunting', 'AI analysis', 'Compliance', 'API'],
    cta: 'Contact Sales',
    highlight: false,
    icon: '⚡'
  },
  {
    id: 'office',
    name: 'OFFICE',
    price: 499,
    period: '/month',
    periodYear: '₹4,999/year',
    description: 'On-premises enterprise',
    features: ['All PRO', 'On-prem deployment', 'AD integration', 'BetterBot AI (basic)', 'Automation', '24/7 support'],
    cta: 'Contact Sales',
    highlight: false,
    icon: '🏢'
  },
  {
    id: 'health',
    name: 'HEALTH',
    price: 599,
    period: '/month',
    periodYear: '₹5,999/year',
    description: 'Healthcare compliance',
    features: ['All OFFICE', 'HIPAA certified', 'Patient data protection', 'Epic/Cerner', 'Compliance reports', 'Healthcare support'],
    cta: 'Contact Sales',
    highlight: false,
    icon: '❤️'
  },
  {
    id: 'max',
    name: 'MAX',
    price: 299,
    period: '/month',
    periodYear: '₹2,999/year',
    description: 'Ultimate AI intelligence',
    features: ['All OFFICE', 'BetterBot AI advanced', 'Smart auto-add (₹5)', 'Custom threat intelligence', 'AI policy generation', 'Global (except China)'],
    cta: 'Start MAX Trial',
    highlight: true,
    icon: '⭐'
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-50 to-neutral-0 border-b border-neutral-200 py-16">
        <div className="container-max text-center">
          <h1 className="text-h1 font-bold text-neutral-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Choose the perfect plan for your security needs. All tiers include core email & file security.
          </p>
        </div>
      </div>

      <div className="container-max py-12">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-neutral-300 p-1 bg-neutral-0">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded font-medium transition flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-accent-100 text-accent-700'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Annual
              <Badge variant="success" className="text-xs">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className={`relative animate-slideUp ${product.highlight ? 'lg:col-span-2 md:col-span-2' : ''}`}
            >
              {product.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge variant="primary" className="font-bold">⭐ MOST POPULAR</Badge>
                </div>
              )}

              <Card
                padding="lg"
                className={`h-full flex flex-col transition ${
                  product.highlight
                    ? 'border-2 border-accent-400 shadow-lg scale-105'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="text-4xl mb-2">{product.icon}</div>
                  <h3 className="text-xl font-bold text-neutral-900">{product.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{product.description}</p>
                </div>

                {/* Pricing */}
                <div className={`mb-6 pb-6 border-b ${product.highlight ? 'border-accent-200' : 'border-neutral-200'}`}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-neutral-900">₹{product.price}</span>
                    <span className="text-sm text-neutral-600">{billingPeriod === 'monthly' ? product.period : product.periodYear}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href={`/auth/register?product=${product.id}`} className="mb-6">
                  <Button
                    variant={product.highlight ? 'primary' : 'secondary'}
                    className="w-full"
                    size="md"
                  >
                    {product.cta}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="text-success font-bold mt-0.5">✓</span>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-h3 font-bold text-neutral-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card padding="md" className="border-primary-200 bg-primary-50">
              <p className="font-semibold text-neutral-900 mb-2">Can I upgrade or downgrade anytime?</p>
              <p className="text-sm text-neutral-700">Yes! Change your plan at any time. Upgrades take effect immediately, downgrades at the end of your billing period.</p>
            </Card>
            <Card padding="md" className="border-accent-200 bg-accent-50">
              <p className="font-semibold text-neutral-900 mb-2">What payment methods do you accept?</p>
              <p className="text-sm text-neutral-700">We accept UPI, BHIM, Credit Cards, Debit Cards, and PayTM for secure payments in India.</p>
            </Card>
            <Card padding="md" className="border-primary-200 bg-primary-50">
              <p className="font-semibold text-neutral-900 mb-2">Do you offer discounts for annual billing?</p>
              <p className="text-sm text-neutral-700">Yes! Annual plans save you 20% compared to monthly billing. Buy annual now and lock in the rate.</p>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
