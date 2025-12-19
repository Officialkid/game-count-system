// components/NumberInput.tsx
'use client';

import { useId, useState } from 'react';

interface NumberInputProps {
  id?: string;
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  error?: string;
  onChange: (value: number) => void;
}

export function NumberInput({
  id,
  label,
  value,
  min = 0,
  max,
  step = 1,
  disabled = false,
  error,
  onChange,
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [focused, setFocused] = useState(false);

  const update = (next: number) => {
    if (Number.isNaN(next)) return;
    if (next < min) next = min;
    if (typeof max === 'number' && next > max) next = max;
    onChange(next);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => update(value - step)}
          disabled={disabled || value <= min}
          aria-disabled={disabled || value <= min}
          className="px-3 rounded-lg bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          –
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => update(parseInt(e.target.value, 10))}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full px-4 py-2 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            error ? 'border-red-500' : focused ? 'border-purple-500' : 'border-neutral-300'
          }`}
        />
        <button
          type="button"
          aria-label="Increase"
          onClick={() => update(value + step)}
          disabled={disabled}
          aria-disabled={disabled}
          className="px-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          +
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
