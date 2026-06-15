"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function EmailChecker() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/email/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">📧 Email Checker</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Analyze Email Security
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address or Content
              </label>
              <textarea
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address or paste email content..."
                className="w-full h-32 px-4 py-3 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Check Email"}
            </button>
          </form>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Analysis Result</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-light-surface rounded-lg border border-light-border">
                <span className="font-semibold text-gray-700">Risk Score</span>
                <span className={`text-3xl font-bold ${
                  result.riskScore > 70 ? "text-red-600" :
                  result.riskScore > 40 ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  {result.riskScore}%
                </span>
              </div>

              <div className="p-4 bg-light-surface rounded-lg border border-light-border">
                <h4 className="font-semibold text-gray-900 mb-3">Threats Detected</h4>
                <ul className="space-y-2">
                  {result.threats?.map((threat: string, i: number) => (
                    <li key={i} className="text-gray-700">
                      • {threat}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition font-medium">
                📥 Export Result
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
