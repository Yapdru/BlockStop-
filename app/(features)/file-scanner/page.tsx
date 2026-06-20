'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components';
import { ResultCard } from '@/components/ResultCard';

export default function FileScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
    formData.append('file', file);

    try {
      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error scanning file:', error);
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
          <h1 className="text-h3 font-bold text-neutral-900">📁 File Scanner</h1>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Upload Section */}
        <Card padding="lg" className="mb-8 animate-slideUp">
          <h2 className="text-h4 font-bold text-neutral-900 mb-4">Scan Files for Threats</h2>
          <p className="text-neutral-600 text-sm mb-6">
            Check your files for malware, ransomware, and suspicious patterns using BetterBot PRO
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-100/50'
              }`}
            >
              <input
                type="file"
                onChange={e => e.target.files && setFile(e.target.files[0])}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="text-5xl mb-3">📤</div>
                <p className="text-lg font-semibold text-neutral-900 mb-1">
                  Drag your file here
                </p>
                <p className="text-sm text-neutral-600">or click to browse your device</p>
              </label>

              {file && (
                <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg animate-slideUp">
                  <p className="text-sm font-medium text-neutral-900">
                    ✓ Selected: {file.name}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={!file}
              className="w-full"
            >
              {loading ? 'Scanning file...' : '🔍 Scan File'}
            </Button>
          </form>
        </Card>

        {/* Results */}
        {result && (
          <div className="animate-slideUp">
            <h2 className="text-h4 font-bold text-neutral-900 mb-4">Scan Results</h2>
            <ResultCard
              title={`File Scan: ${result.fileName}`}
              threatLevel={result.threatLevel}
              threats={result.threats || []}
              timestamp={result.scanTimestamp}
              details={{
                'File Type': result.fileType,
                'File Size': result.fileSize,
                'Malware Signatures': result.analysis?.malwareSignatures,
                'Ransomware Risk': result.analysis?.ransomwareRisk,
              }}
            />

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setResult(null)}>
                ← Scan Another File
              </Button>
              <Link href="/email-checker">
                <Button variant="secondary">Check Email →</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !file && (
          <div className="text-center py-12">
            <p className="text-neutral-600">Upload a file above to get started</p>
          </div>
        )}
      </div>
    </main>
  );
}
