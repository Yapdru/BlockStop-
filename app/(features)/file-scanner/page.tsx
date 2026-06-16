"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ResultCard } from "@/components/ResultCard";

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
          <ResultCard
            title={`File Scan: ${result.fileName}`}
            threatLevel={result.threatLevel}
            threats={result.threats || []}
            timestamp={result.scanTimestamp}
            details={{
              "File Type": result.fileType,
              "File Size": result.fileSize,
              "Malware Signatures": result.analysis?.malwareSignatures,
              "Ransomware Risk": result.analysis?.ransomwareRisk,
            }}
          />
        )}
      </div>
    </main>
  );
}
