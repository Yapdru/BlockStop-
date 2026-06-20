/**
 * Plugin Certification Application Page
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CertificationPage() {
  const [formData, setFormData] = useState({
    pluginName: '',
    version: '',
    description: '',
    targetLevel: 'bronze',
    supportEmail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/marketplace/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId: formData.pluginName.toLowerCase().replace(/\s+/g, '-'),
          pluginName: formData.pluginName,
          version: formData.version,
          description: formData.description,
          targetLevel: formData.targetLevel,
          supportContactEmail: formData.supportEmail,
          developerId: 'current-user', // Would be actual developer ID
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Plugin submitted for certification!' });
        setFormData({ pluginName: '', version: '', description: '', targetLevel: 'bronze', supportEmail: '' });
      } else {
        setMessage({ type: 'error', text: 'Failed to submit plugin for certification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while submitting' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Plugin Certification Program</h1>
          <p className="text-lg text-slate-600">
            Get your plugin certified and increase revenue with BlockStop's marketplace
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bronze</CardTitle>
              <CardDescription>60% Developer Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ Automated tests pass</li>
                <li>✓ Security scan passes</li>
                <li>✓ Performance acceptable</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Silver</CardTitle>
              <CardDescription>70% Developer Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ All Bronze requirements</li>
                <li>✓ Manual security audit</li>
                <li>✓ 4.0+ reputation score</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gold & Platinum</CardTitle>
              <CardDescription>80-85% Developer Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>✓ All Silver requirements</li>
                <li>✓ Performance optimization</li>
                <li>✓ Dedicated support</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Your Plugin for Certification</CardTitle>
            <CardDescription>
              Complete this form to start the certification process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plugin Name
                </label>
                <Input
                  value={formData.pluginName}
                  onChange={(e) => setFormData({ ...formData, pluginName: e.target.value })}
                  placeholder="My Awesome Plugin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Version
                  </label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.0.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Certification Level
                  </label>
                  <Select value={formData.targetLevel} onValueChange={(value) => setFormData({ ...formData, targetLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what your plugin does"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Support Email
                </label>
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  placeholder="support@example.com"
                  required
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Certification'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
