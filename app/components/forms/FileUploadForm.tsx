'use client';

import React, { useState } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';

export const FileUploadForm: React.FC<{ onSubmit?: (file: File) => Promise<void> }> = ({ onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  const handleFile = async (selectedFile: File) => {
    setError('');

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 500MB');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(selectedFile);
        setSuccess(true);
        setFile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">File uploaded and scanning started!</p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Drag and drop your file here
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              or click to browse (max 500MB)
            </p>
          </div>
        </div>

        <input
          type="file"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Upload file"
        />
      </div>

      {/* File Preview */}
      {file && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {loading ? (
            <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
          ) : (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
