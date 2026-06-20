'use client';

import { useState } from 'react';

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
            Get your plugin certified and increase revenue with BlockStop&apos;s marketplace
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Bronze</h3>
            <p className="text-sm text-slate-600 mb-4">60% Developer Revenue</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ Automated tests pass</li>
              <li>✓ Security scan passes</li>
              <li>✓ Performance acceptable</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Silver</h3>
            <p className="text-sm text-slate-600 mb-4">70% Developer Revenue</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ All Bronze requirements</li>
              <li>✓ Manual security audit</li>
              <li>✓ 4.0+ reputation score</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Gold & Platinum</h3>
            <p className="text-sm text-slate-600 mb-4">80-85% Developer Revenue</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ All Silver requirements</li>
              <li>✓ Performance optimization</li>
              <li>✓ Dedicated support</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit Your Plugin for Certification</h2>
          <p className="text-slate-600 mb-6">
            Complete this form to start the certification process
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Plugin Name
              </label>
              <input
                type="text"
                value={formData.pluginName}
                onChange={(e) => setFormData({ ...formData, pluginName: e.target.value })}
                placeholder="My Awesome Plugin"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Certification Level
                </label>
                <select
                  value={formData.targetLevel}
                  onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                placeholder="support@example.com"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Certification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
