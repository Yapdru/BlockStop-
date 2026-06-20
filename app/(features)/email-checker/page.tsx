'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@/components';
import { ResultCard } from '@/components/ResultCard';

export default function EmailChecker() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error checking email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back
          </Link>
          <h1 className="text-h3 font-bold text-neutral-900">📧 Email Checker</h1>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Input Section */}
        <Card padding="lg" className="mb-8 animate-slideUp">
          <h2 className="text-h4 font-bold text-neutral-900 mb-4">Analyze Email Security</h2>
          <p className="text-neutral-600 text-sm mb-6">
            Check emails for phishing, malicious links, and suspicious patterns using DRAR AI
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Email Address or Content
              </label>
              <textarea
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address or paste entire email content..."
                className="input w-full min-h-40 rounded-lg"
                required
              />
              <p className="text-xs text-neutral-600 mt-2">
                💡 Tip: Paste full email headers for better analysis
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full"
            >
              {loading ? 'Analyzing...' : '🔍 Check Email'}
            </Button>
          </form>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="animate-slideUp">
            <h2 className="text-h4 font-bold text-neutral-900 mb-4">Analysis Result</h2>
            <ResultCard
              title="Email Security Analysis"
              riskScore={result.riskScore}
              threats={result.threats || []}
              timestamp={result.timestamp}
              details={result.analysis}
            />

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setResult(null)}>
                ← Analyze Another Email
              </Button>
              <Link href="/file-scanner">
                <Button variant="secondary">Check File →</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && (
          <div className="text-center py-12">
            <p className="text-neutral-600">Enter an email above to get started</p>
          </div>
        )}
      </div>
    </main>
  );
}
