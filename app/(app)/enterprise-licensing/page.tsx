/**
 * Enterprise Licensing Management
 * Manage licenses, activations, and compliance
 */

"use client";

import { useState, useEffect } from "react";
import { LicenseKey } from "@/lib/licensing/license-generator";
import { ActiveLicense } from "@/lib/licensing/license-manager";
import { ValidationResult } from "@/lib/licensing/license-validator";

export default function EnterpriseLicensingPage() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([]);
  const [activeLicenses, setActiveLicenses] = useState<ActiveLicense[]>([]);
  const [selectedTab, setSelectedTab] = useState<"manage" | "generate" | "validate">(
    "manage"
  );
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    organizationId: "",
    organizationName: "",
    licenseType: "annual" as "perpetual" | "annual" | "per-user",
    maxUsers: 100,
  });

  const [validateForm, setValidateForm] = useState({
    licenseKey: "",
    organizationId: "",
  });

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Load licenses
  useEffect(() => {
    const loadLicenses = async () => {
      setLoading(true);
      try {
        // In production: fetch from API
        setLicenses([]);
      } finally {
        setLoading(false);
      }
    };

    loadLicenses();
  }, []);

  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production: call API endpoint
      console.log("Generating license:", formData);

      // Mock response
      const newLicense: LicenseKey = {
        licenseId: `LIC-${Date.now()}`,
        key: "XXXX-XXXX-XXXX-XXXX-XXXX",
        type: formData.licenseType,
        tier: "pro",
        organizationId: formData.organizationId,
        organizationName: formData.organizationName,
        issuedAt: new Date(),
        expiresAt:
          formData.licenseType === "perpetual" ? undefined : new Date(),
        maxUsers: formData.maxUsers,
        features: ["api_access", "webhook_support", "audit_logs"],
        status: "active",
        checksum: "abc123",
      };

      setLicenses([...licenses, newLicense]);
      setFormData({
        organizationId: "",
        organizationName: "",
        licenseType: "annual",
        maxUsers: 100,
      });

      alert("License generated successfully");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In production: call API endpoint
      console.log("Validating license:", validateForm);

      const result: ValidationResult = {
        valid: true,
        licenseId: "LIC-123",
        organizationId: validateForm.organizationId,
        organizationName: "Example Corp",
        licenseType: "annual",
        tier: "enterprise",
        status: "active",
        features: ["advanced_analytics", "api_access", "sso"],
        message: "License is valid and active",
        validatedAt: new Date(),
      };

      setValidationResult(result);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLicense = async (licenseId: string) => {
    if (confirm("Are you sure you want to revoke this license?")) {
      // In production: call API endpoint
      console.log("Revoking license:", licenseId);
      alert("License revoked successfully");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Enterprise Licensing
          </h1>
          <p className="text-slate-400">
            Manage, generate, and validate enterprise licenses
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: "manage", label: "Manage Licenses" },
            { id: "generate", label: "Generate License" },
            { id: "validate", label: "Validate License" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl p-8 shadow-2xl">
          {selectedTab === "manage" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Active Licenses
              </h2>

              {licenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">No licenses found</p>
                  <button
                    onClick={() => setSelectedTab("generate")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Generate First License
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {licenses.map((license) => (
                    <div
                      key={license.licenseId}
                      className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {license.organizationName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {license.licenseId}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            license.status === "active"
                              ? "bg-green-900 text-green-200"
                              : license.status === "expired"
                                ? "bg-red-900 text-red-200"
                                : "bg-yellow-900 text-yellow-200"
                          }`}
                        >
                          {license.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Type</p>
                          <p className="text-white font-medium">
                            {license.type}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Tier</p>
                          <p className="text-white font-medium">
                            {license.tier}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            Max Users
                          </p>
                          <p className="text-white font-medium">
                            {license.maxUsers || "Unlimited"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            Features
                          </p>
                          <p className="text-white font-medium">
                            {license.features.length} included
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            handleRevokeLicense(license.licenseId)
                          }
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "generate" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Generate New License
              </h2>

              <form onSubmit={handleGenerateLicense} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      value={formData.organizationId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationId: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                      placeholder="org-123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                      placeholder="Acme Corp"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      License Type
                    </label>
                    <select
                      value={formData.licenseType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          licenseType: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="perpetual">Perpetual</option>
                      <option value="annual">Annual</option>
                      <option value="per-user">Per-User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Max Users
                    </label>
                    <input
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxUsers: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                      min="1"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Generating..." : "Generate License"}
                </button>
              </form>
            </div>
          )}

          {selectedTab === "validate" && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Validate License
              </h2>

              <form onSubmit={handleValidateLicense} className="space-y-6 mb-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      License Key
                    </label>
                    <input
                      type="text"
                      value={validateForm.licenseKey}
                      onChange={(e) =>
                        setValidateForm({
                          ...validateForm,
                          licenseKey: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 font-mono"
                      placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      value={validateForm.organizationId}
                      onChange={(e) =>
                        setValidateForm({
                          ...validateForm,
                          organizationId: e.target.value,
                        })
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400"
                      placeholder="org-123"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Validating..." : "Validate License"}
                </button>
              </form>

              {validationResult && (
                <div
                  className={`rounded-lg p-6 ${
                    validationResult.valid
                      ? "bg-green-900 border border-green-700"
                      : "bg-red-900 border border-red-700"
                  }`}
                >
                  <h3
                    className={`text-lg font-bold mb-4 ${
                      validationResult.valid
                        ? "text-green-200"
                        : "text-red-200"
                    }`}
                  >
                    {validationResult.valid
                      ? "✓ License Valid"
                      : "✗ License Invalid"}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p className="text-gray-200">
                      <span className="font-medium">Organization:</span>{" "}
                      {validationResult.organizationName}
                    </p>
                    <p className="text-gray-200">
                      <span className="font-medium">Type:</span>{" "}
                      {validationResult.licenseType}
                    </p>
                    <p className="text-gray-200">
                      <span className="font-medium">Tier:</span>{" "}
                      {validationResult.tier}
                    </p>
                    {validationResult.expiresAt && (
                      <p className="text-gray-200">
                        <span className="font-medium">Expires:</span>{" "}
                        {validationResult.expiresAt.toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-gray-200">
                      <span className="font-medium">Status:</span>{" "}
                      {validationResult.status}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
