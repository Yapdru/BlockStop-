'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';

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
      <a
        href="#pricing-cards"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded"
        onClick={(e) => {
          e.preventDefault();
          const cards = document.querySelector('#pricing-cards');
          if (cards instanceof HTMLElement) {
            cards.focus();
          }
        }}
      >
        Skip to pricing plans
      </a>
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
          <fieldset className="inline-flex rounded-lg border border-neutral-300 p-1 bg-neutral-0">
            <legend className="sr-only">Billing period</legend>
            <button
              onClick={() => setBillingPeriod('monthly')}
              role="radio"
              aria-checked={billingPeriod === 'monthly'}
              aria-label="Monthly billing"
              className={`px-6 py-2 rounded font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                billingPeriod === 'monthly'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              role="radio"
              aria-checked={billingPeriod === 'annual'}
              aria-label="Annual billing - save 20 percent"
              className={`px-6 py-2 rounded font-medium transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-500 ${
                billingPeriod === 'annual'
                  ? 'bg-accent-100 text-accent-700'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Annual
              <Badge variant="success" className="text-xs" aria-hidden="true">Save 20%</Badge>
            </button>
          </fieldset>
        </div>

        {/* Pricing Cards Grid */}
        <div
          id="pricing-cards"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5"
          role="region"
          aria-label="Pricing plans"
          tabIndex={-1}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className={`relative ${product.highlight ? 'lg:col-span-2 md:col-span-2' : ''}`}
            >
              {product.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge
                    variant="primary"
                    className="font-bold"
                    role="status"
                    aria-label="Most popular plan"
                  >
                    ⭐ MOST POPULAR
                  </Badge>
                </div>
              )}

              <Card
                padding="lg"
                className={`h-full flex flex-col transition ${
                  product.highlight
                    ? 'border-2 border-accent-400 shadow-lg scale-105 focus-within:ring-2 focus-within:ring-accent-500'
                    : 'border-neutral-200 hover:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500'
                }`}
                role="article"
                aria-label={`${product.name} plan`}
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="text-4xl mb-2" aria-hidden="true">{product.icon}</div>
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
                    aria-label={`${product.cta} for ${product.name} plan at ₹${product.price}`}
                  >
                    {product.cta}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="space-y-3 flex-1" role="list">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="text-success font-bold mt-0.5" aria-hidden="true">✓</span>
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-16 max-w-3xl mx-auto" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-h3 font-bold text-neutral-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4" role="list">
            <Card
              padding="md"
              className="border-primary-200 bg-primary-50 focus-within:ring-2 focus-within:ring-primary-500"
              role="listitem"
            >
              <h3 className="font-semibold text-neutral-900 mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-sm text-neutral-700">
                Yes! Change your plan at any time. Upgrades take effect immediately, downgrades at the end of your
                billing period.
              </p>
            </Card>
            <Card
              padding="md"
              className="border-accent-200 bg-accent-50 focus-within:ring-2 focus-within:ring-accent-500"
              role="listitem"
            >
              <h3 className="font-semibold text-neutral-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-neutral-700">
                We accept UPI, BHIM, Credit Cards, Debit Cards, and PayTM for secure payments in India.
              </p>
            </Card>
            <Card
              padding="md"
              className="border-primary-200 bg-primary-50 focus-within:ring-2 focus-within:ring-primary-500"
              role="listitem"
            >
              <h3 className="font-semibold text-neutral-900 mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-sm text-neutral-700">
                Yes! Annual plans save you 20% compared to monthly billing. Buy annual now and lock in the rate.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
