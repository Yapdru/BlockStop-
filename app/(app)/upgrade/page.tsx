'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const products = [
  { id: 'neo', name: 'BlockStop NEO', price: 99, annualPrice: 999 },
  { id: 'pro', name: 'BlockStop PRO', price: 299, annualPrice: 2999 },
  { id: 'office', name: 'BlockStop OFFICE', price: 499, annualPrice: 4999 },
  { id: 'health', name: 'BlockStop HEALTH', price: 599, annualPrice: 5999 },
  { id: 'max', name: 'BlockStop MAX', price: 299, annualPrice: 2999 }
];

const paymentMethods = [
  { id: 'upi', name: 'UPI (QR Code)', icon: '₹' },
  { id: 'bhim', name: 'BHIM', icon: '💳' },
  { id: 'paytm', name: 'PayTM', icon: '📱' },
  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
  { id: 'credit_card', name: 'Credit Card', icon: '💳' },
  { id: 'debit_card', name: 'Debit Card', icon: '🏦' }
];

export default function UpgradePage() {
  const [selectedProduct, setSelectedProduct] = useState('neo');
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const product = products.find(p => p.id === selectedProduct);
  const amount = frequency === 'monthly' ? product?.price : product?.annualPrice;

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
        // Redirect to payment
        if (selectedPayment === 'upi') {
          router.push(`/payment/upi/${data.transactionId}`);
        } else if (selectedPayment === 'bhim') {
          router.push(`/payment/bhim/${data.transactionId}`);
        } else if (selectedPayment === 'paytm') {
          router.push(`/payment/paytm/${data.transactionId}`);
        } else if (selectedPayment === 'apple_pay') {
          router.push(`/payment/apple/${data.transactionId}`);
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Upgrade Your Plan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">1. Select Product</h2>
            <div className="grid grid-cols-2 gap-4">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p.id)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedProduct === p.id
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-gray-400 mt-1">₹{p.price}/mo</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">2. Select Frequency</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setFrequency('monthly')}
                className={`flex-1 p-4 rounded-lg border-2 transition font-medium ${
                  frequency === 'monthly'
                    ? 'border-blue-600 bg-blue-600/10 text-blue-400'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFrequency('annual')}
                className={`flex-1 p-4 rounded-lg border-2 transition font-medium ${
                  frequency === 'annual'
                    ? 'border-blue-600 bg-blue-600/10 text-blue-400'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">3. Select Payment Method</h2>
            <div className="grid grid-cols-2 gap-4">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-4 rounded-lg border-2 flex items-center gap-2 transition ${
                    selectedPayment === method.id
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-sm">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
            <div className="flex justify-between">
              <span className="text-gray-400">Product:</span>
              <span className="font-medium">{product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Frequency:</span>
              <span className="font-medium capitalize">{frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Method:</span>
              <span className="font-medium">
                {paymentMethods.find(m => m.id === selectedPayment)?.name}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-400">₹{amount}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold transition"
          >
            {processing ? 'Processing...' : 'Proceed to Payment'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your payment is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
