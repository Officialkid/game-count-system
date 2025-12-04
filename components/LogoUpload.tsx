// components/LogoUpload.tsx
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (file: File | null, previewUrl: string | null) => void;
  label?: string;
  maxSizeMB?: number;
}

export function LogoUpload({
  currentLogoUrl,
  onLogoChange,
  label = 'Event Logo',
  maxSizeMB = 10,
}: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setError('');

    // Check file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setError('Only PNG and JPG images are allowed');
      return false;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB (current: ${sizeMB.toFixed(2)}MB)`);
      return false;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onLogoChange(file, previewUrl);
    };
    reader.readAsDataURL(file);

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onLogoChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        } ${error ? 'border-red-500 dark:border-red-400' : ''}`}
      >
        {preview ? (
          /* Preview Display */
          <div className="p-4">
            <div className="relative w-full max-w-xs mx-auto aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={preview}
                alt="Logo preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Change Logo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="btn-secondary text-sm px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Upload Prompt */
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-sm px-4 py-2 mb-2"
            >
              Choose File
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              or drag and drop your logo here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              PNG or JPG • Max {maxSizeMB}MB
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recommended: Square or wide logo with transparent background
        </p>
      )}
    </div>
  );
}
