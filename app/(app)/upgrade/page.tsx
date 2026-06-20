'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';

const products = [
  { id: 'neo', name: 'BlockStop NEO', price: 99, annualPrice: 999, icon: '🚀' },
  { id: 'pro', name: 'BlockStop PRO', price: 299, annualPrice: 2999, icon: '⚡' },
  { id: 'office', name: 'BlockStop OFFICE', price: 499, annualPrice: 4999, icon: '🏢' },
  { id: 'health', name: 'BlockStop HEALTH', price: 599, annualPrice: 5999, icon: '❤️' },
  { id: 'max', name: 'BlockStop MAX', price: 299, annualPrice: 2999, icon: '⭐', highlight: true }
];

const paymentMethods = [
  { id: 'upi', name: 'UPI', icon: '📱' },
  { id: 'bhim', name: 'BHIM', icon: '🏦' },
  { id: 'paytm', name: 'PayTM', icon: '💳' },
  { id: 'credit_card', name: 'Credit Card', icon: '💳' },
  { id: 'debit_card', name: 'Debit Card', icon: '🏧' },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
];

export default function UpgradePage() {
  const [selectedProduct, setSelectedProduct] = useState('max');
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const product = products.find(p => p.id === selectedProduct);
  const amount = frequency === 'monthly' ? product?.price : product?.annualPrice;
  const saving = frequency === 'annual' ? Math.round((product?.price || 0) * 12 * 0.2) : 0;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/billing/unified/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({
          method: selectedPayment,
          product: selectedProduct,
          frequency
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (selectedPayment === 'upi') {
          router.push(`/payment/upi/${data.transactionId}`);
        } else if (selectedPayment === 'bhim') {
          router.push(`/payment/bhim/${data.transactionId}`);
        } else if (selectedPayment === 'paytm') {
          router.push(`/payment/paytm/${data.transactionId}`);
        }
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">⭐ Upgrade Plan</h1>
          </div>
          <p className="text-sm text-neutral-600">Choose your perfect security tier</p>
        </div>
      </header>

      <div className="container-max py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selection Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Selection */}
            <Card padding="lg">
              <h2 className="text-h5 font-bold text-neutral-900 mb-6">1️⃣ Select Your Plan</h2>

              <div className="grid grid-cols-2 gap-4">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p.id)}
                    className={`relative p-4 rounded-lg border-2 text-left transition ${
                      selectedProduct === p.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    {p.highlight && (
                      <Badge variant="accent" className="absolute top-2 right-2">
                        Popular
                      </Badge>
                    )}
                    <p className="text-2xl mb-2">{p.icon}</p>
                    <p className="font-bold text-neutral-900">{p.name}</p>
                    <p className="text-sm text-neutral-600 mt-2">₹{p.price}/mo</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Billing Frequency */}
            <Card padding="lg">
              <h2 className="text-h5 font-bold text-neutral-900 mb-6">2️⃣ Billing Frequency</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFrequency('monthly')}
                  className={`p-4 rounded-lg border-2 font-medium transition ${
                    frequency === 'monthly'
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-neutral-200 text-neutral-900 hover:border-primary-300'
                  }`}
                >
                  📅 Monthly
                </button>

                <button
                  onClick={() => setFrequency('annual')}
                  className={`relative p-4 rounded-lg border-2 font-medium transition ${
                    frequency === 'annual'
                      ? 'border-accent-400 bg-accent-50 text-accent-900'
                      : 'border-neutral-200 text-neutral-900 hover:border-accent-300'
                  }`}
                >
                  <Badge variant="accent" className="absolute top-2 right-2 text-xs">
                    Save 20%
                  </Badge>
                  📆 Annual
                </button>
              </div>

              {frequency === 'annual' && saving > 0 && (
                <div className="mt-4 bg-accent-50 border border-accent-200 rounded-lg p-4">
                  <p className="text-sm text-neutral-700">
                    <strong>💰 You save:</strong> ₹{saving}/year
                  </p>
                </div>
              )}
            </Card>

            {/* Payment Method */}
            <Card padding="lg">
              <h2 className="text-h5 font-bold text-neutral-900 mb-6">3️⃣ Payment Method</h2>

              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                      selectedPayment === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className={`font-medium text-sm ${
                      selectedPayment === method.id ? 'text-primary-900' : 'text-neutral-900'
                    }`}>
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-neutral-700">
                  🔒 <strong>Secure Payment</strong> - All transactions are encrypted and secure
                </p>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-24">
              <h2 className="text-h5 font-bold text-neutral-900 mb-6">📋 Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Plan:</span>
                  <span className="font-medium text-neutral-900">{product?.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Frequency:</span>
                  <Badge variant={frequency === 'annual' ? 'success' : 'primary'}>
                    {frequency === 'annual' ? 'Annual' : 'Monthly'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Payment:</span>
                  <span className="font-medium text-neutral-900">
                    {paymentMethods.find(m => m.id === selectedPayment)?.name}
                  </span>
                </div>

                {frequency === 'annual' && saving > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Savings:</span>
                    <span className="font-medium text-success">-₹{saving}</span>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-sm text-neutral-600">Amount Due:</span>
                  <div>
                    <span className="text-h3 font-bold text-neutral-900">₹{amount}</span>
                    {frequency === 'annual' && (
                      <p className="text-xs text-neutral-600 mt-1">₹{Math.round((amount || 0) / 12)}/mo</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full mb-3"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? '⏳ Processing...' : '💳 Proceed to Payment'}
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.history.back()}
              >
                ← Cancel
              </Button>

              <p className="text-xs text-neutral-600 text-center mt-4">
                ✅ Cancel anytime. No hidden fees.
              </p>
            </Card>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-900 mb-3">✨ What&apos;s Included</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-neutral-900">🤖 BetterBot AI</p>
              <p className="text-xs text-neutral-600">Advanced threat analysis</p>
            </div>
            <div>
              <p className="font-medium text-neutral-900">🌐 VPN (100+)</p>
              <p className="text-xs text-neutral-600">Global servers</p>
            </div>
            <div>
              <p className="font-medium text-neutral-900">📡 WiFi Checker</p>
              <p className="text-xs text-neutral-600">Network security</p>
            </div>
            <div>
              <p className="font-medium text-neutral-900">👥 Team Access</p>
              <p className="text-xs text-neutral-600">Up to 6 users</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
