"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FileScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error scanning file:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">📁 File Scanner</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Scan Files for Malware
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition ${
                dragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-light-border hover:border-primary-400"
              }`}
            >
              <input
                type="file"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-4">📤</div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop your file here
                </p>
                <p className="text-gray-600">or click to browse</p>
              </label>

              {file && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200"
                >
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Scanning..." : "Scan File"}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Scan Result</h3>

            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                result.threatLevel === "safe"
                  ? "bg-green-50 border-green-200"
                  : result.threatLevel === "warning"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <span className="font-semibold text-gray-700">Threat Level</span>
                <span className={`text-2xl font-bold uppercase ${
                  result.threatLevel === "safe"
                    ? "text-green-600"
                    : result.threatLevel === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                  {result.threatLevel}
                </span>
              </div>

              <div className="p-4 bg-light-surface rounded-lg border border-light-border">
                <h4 className="font-semibold text-gray-900 mb-3">File Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {result.fileName}</p>
                  <p><strong>Type:</strong> {result.fileType}</p>
                  <p><strong>Size:</strong> {result.fileSize}</p>
                </div>
              </div>

              {result.threats && result.threats.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-3">⚠️ Threats Detected</h4>
                  <ul className="space-y-2">
                    {result.threats.map((threat: string, i: number) => (
                      <li key={i} className="text-red-700 text-sm">
                        • {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
