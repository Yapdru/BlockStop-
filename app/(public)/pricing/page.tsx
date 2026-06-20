'use client';

import { useState } from 'react';
import Link from 'next/link';

const products = [
  {
    name: 'BlockStop Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for personal use',
    features: ['Email analysis', 'File scanning', '50 scans/month', 'Basic threat detection'],
    cta: 'Get Started',
    highlight: false
  },
  {
    name: 'BlockStop NEO',
    price: 99,
    period: '/month or ₹999/year',
    description: 'Team security with AI',
    features: ['All Free features', 'Team collaboration (6 users)', 'Unlimited scans', 'WiFi security', 'VPN integration', '2FA authentication'],
    cta: 'Start Free Trial',
    highlight: false
  },
  {
    name: 'BlockStop PRO',
    price: 299,
    period: '/month or ₹2,999/year',
    description: 'Enterprise security',
    features: ['All NEO features', 'Unlimited team members', 'Advanced threat hunting', 'AI-powered analysis', 'Compliance reports', 'API access'],
    cta: 'Contact Sales',
    highlight: false
  },
  {
    name: 'BlockStop OFFICE',
    price: 499,
    period: '/month or ₹4,999/year',
    description: 'Enterprise on-premises',
    features: ['All PRO features', 'On-premises deployment', 'Active Directory integration', 'File server scanning', 'Automated threat response', '24/7 managed services'],
    cta: 'Contact Sales',
    highlight: false
  },
  {
    name: 'BlockStop HEALTH',
    price: 599,
    period: '/month or ₹5,999/year',
    description: 'Healthcare compliance',
    features: ['All OFFICE features', 'HIPAA + HITECH compliance', 'Patient data protection', 'Epic/Cerner integration', 'Healthcare threat detection', 'Healthcare support'],
    cta: 'Contact Sales',
    highlight: false
  },
  {
    name: 'BlockStop MAX',
    price: 299,
    period: '/month or ₹2,999/year',
    description: 'Ultimate AI-powered security',
    features: ['All OFFICE features', 'BetterBot AI natural language queries', 'Custom threat intelligence', 'Automated recommendations', 'Smart feature auto-addition', 'Available worldwide (except China)'],
    cta: 'Start MAX Trial',
    highlight: true
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-400">Choose the plan that fits your needs</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded ${billingPeriod === 'monthly' ? 'bg-blue-600' : 'text-gray-400'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded ${billingPeriod === 'annual' ? 'bg-blue-600' : 'text-gray-400'}`}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <div
            key={product.name}
            className={`rounded-lg p-6 ${
              product.highlight
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-blue-400 transform scale-105'
                : 'bg-slate-800 border border-slate-700'
            }`}
          >
            {product.highlight && (
              <div className="text-sm font-bold text-blue-200 mb-2">MOST POPULAR</div>
            )}

            <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
            <p className="text-gray-300 text-sm mb-4">{product.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">₹{product.price}</span>
              <span className="text-gray-300 text-sm">{product.period}</span>
            </div>

            <Link
              href={`/auth/register?product=${product.name.toLowerCase().replace(' ', '_')}`}
              className={`block text-center py-2 rounded font-bold mb-6 transition ${
                product.highlight
                  ? 'bg-white text-blue-600 hover:bg-gray-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {product.cta}
            </Link>

            <ul className="space-y-3">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start text-sm">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
