'use client';

import React, { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  hint,
  required,
  id,
  type = 'text',
  className,
  ...props
}: FormInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Top-aligned label */}
      <label
        htmlFor={inputId}
        className="text-sm font-semibold text-neutral-700 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-600" aria-label="required">*</span>}
      </label>

      {/* Input field */}
      <input
        id={inputId}
        type={type}
        className={`w-full px-4 py-2.5 rounded-lg border-2 text-base transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          error
            ? 'border-red-500 focus:border-red-500 bg-red-50'
            : 'border-neutral-300 focus:border-purple-500 hover:border-neutral-400'
        } ${className || ''}`}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        required={required}
        {...props}
      />

      {/* Error message */}
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600 font-medium flex items-center gap-1">
          ⚠ {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
}
