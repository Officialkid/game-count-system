/**
 * Touch-Optimized Score Input Component
 * 
 * Large buttons for easy scoring on mobile devices
 * Minimum 44px touch targets
 * Haptic feedback on interactions
 * Portrait-optimized layout
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useIsTouch } from '@/hooks/useMobile';
import { vibrate } from '@/hooks/useMobile';

export interface TouchScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  presets?: number[];
  showHistory?: boolean;
  disabled?: boolean;
  label?: string;
}

export function TouchScoreInput({
  value,
  onChange,
  min = -100,
  max = 999,
  presets = [1, 5, 10],
  showHistory = true,
  disabled = false,
  label = 'Score',
}: TouchScoreInputProps) {
  const isTouch = useIsTouch();
  const [history, setHistory] = useState<number[]>([]);
  const [showUndo, setShowUndo] = useState(false);

  const handleChange = (newValue: number) => {
    if (disabled) return;

    const clamped = Math.max(min, Math.min(max, newValue));
    
    // Haptic feedback on touch devices
    if (isTouch && 'vibrate' in navigator) {
      vibrate(30);
    }

    // Track history for undo
    setHistory((prev) => [...prev, value]);
    setShowUndo(true);
    onChange(clamped);

    // Auto-hide undo button after 3 seconds
    setTimeout(() => setShowUndo(false), 3000);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousValue = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      onChange(previousValue);
      setShowUndo(false);
      
      if (isTouch) {
        vibrate([20, 50, 20]);
      }
    }
  };

  const handleReset = () => {
    if (value !== 0) {
      setHistory((prev) => [...prev, value]);
      onChange(0);
      setShowUndo(true);
      
      if (isTouch) {
        vibrate(50);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 text-center">
          {label}
        </label>
      )}

      {/* Current Value Display */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-gray-200">
        <div className="text-5xl font-bold text-gray-900 tabular-nums">
          {value}
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((preset) => (
          <React.Fragment key={preset}>
            {/* Subtract button */}
            <button
              type="button"
              onClick={() => handleChange(value - preset)}
              disabled={disabled || value - preset < min}
              className={`
                min-h-[60px] rounded-xl font-bold text-lg
                transition-all duration-200
                touch-manipulation active:scale-95
                ${
                  disabled || value - preset < min
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white shadow-md active:bg-red-600 active:shadow-lg'
                }
              `}
            >
              −{preset}
            </button>

            {/* Add button */}
            <button
              type="button"
              onClick={() => handleChange(value + preset)}
              disabled={disabled || value + preset > max}
              className={`
                min-h-[60px] rounded-xl font-bold text-lg
                transition-all duration-200
                touch-manipulation active:scale-95
                col-span-2
                ${
                  disabled || value + preset > max
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 text-white shadow-md active:bg-green-600 active:shadow-lg'
                }
              `}
            >
              +{preset}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled || value === 0}
          className={`
            flex-1 min-h-[48px] rounded-xl font-semibold
            transition-all duration-200
            touch-manipulation active:scale-95
            ${
              disabled || value === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 active:bg-gray-300'
            }
          `}
        >
          Reset
        </button>

        {/* Undo button */}
        {showHistory && (
          <button
            type="button"
            onClick={handleUndo}
            disabled={disabled || history.length === 0 || !showUndo}
            className={`
              flex-1 min-h-[48px] rounded-xl font-semibold
              transition-all duration-200
              touch-manipulation active:scale-95
              ${
                disabled || history.length === 0 || !showUndo
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white active:bg-purple-600'
              }
            `}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact Touch Score Input
 * Inline version with +/- buttons
 */
export interface CompactTouchScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CompactTouchScoreInput({
  value,
  onChange,
  min = -100,
  max = 999,
  step = 1,
  disabled = false,
  size = 'md',
}: CompactTouchScoreInputProps) {
  const isTouch = useIsTouch();

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
    if (isTouch) vibrate(20);
  };

  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
    if (isTouch) vibrate(20);
  };

  const sizeClasses = {
    sm: 'min-h-[36px] min-w-[36px] text-base',
    md: 'min-h-[44px] min-w-[44px] text-lg',
    lg: 'min-h-[56px] min-w-[56px] text-xl',
  };

  const buttonClass = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      {/* Decrement */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`
          ${buttonClass}
          rounded-lg font-bold
          transition-all duration-200
          touch-manipulation active:scale-95
          ${
            disabled || value <= min
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 text-white active:bg-red-600'
          }
        `}
        aria-label="Decrease value"
      >
        −
      </button>

      {/* Value Display */}
      <div
        className={`
          ${buttonClass}
          bg-gray-100 rounded-lg font-bold text-gray-900
          flex items-center justify-center
          min-w-[80px] tabular-nums
        `}
      >
        {value}
      </div>

      {/* Increment */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`
          ${buttonClass}
          rounded-lg font-bold
          transition-all duration-200
          touch-manipulation active:scale-95
          ${
            disabled || value >= max
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 text-white active:bg-green-600'
          }
        `}
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}

/**
 * Touch Number Pad
 * Full number pad for precise score entry
 */
export interface TouchNumberPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxDigits?: number;
  showDecimal?: boolean;
  disabled?: boolean;
}

export function TouchNumberPad({
  value,
  onChange,
  onSubmit,
  maxDigits = 3,
  showDecimal = false,
  disabled = false,
}: TouchNumberPadProps) {
  const isTouch = useIsTouch();

  const handleDigit = (digit: string) => {
    if (disabled || value.length >= maxDigits) return;
    onChange(value + digit);
    if (isTouch) vibrate(20);
  };

  const handleBackspace = () => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
    if (isTouch) vibrate(30);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
    if (isTouch) vibrate(50);
  };

  const handleDecimal = () => {
    if (disabled || !showDecimal || value.includes('.')) return;
    onChange(value + '.');
    if (isTouch) vibrate(20);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="space-y-3">
      {/* Display */}
      <div className="bg-gray-50 rounded-2xl p-6 text-right border-2 border-gray-200 min-h-[80px] flex items-center justify-end">
        <div className="text-4xl font-bold text-gray-900 tabular-nums">
          {value || '0'}
        </div>
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2">
        {/* Digits 1-9 */}
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={disabled}
            className={`
              min-h-[64px] rounded-xl font-bold text-2xl
              transition-all duration-200
              touch-manipulation active:scale-95
              ${
                disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-300 text-gray-900 active:bg-gray-100 active:border-purple-500'
              }
            `}
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: decimal, 0, backspace */}
        {showDecimal ? (
          <button
            type="button"
            onClick={handleDecimal}
            disabled={disabled || value.includes('.')}
            className={`
              min-h-[64px] rounded-xl font-bold text-2xl
              transition-all duration-200
              touch-manipulation active:scale-95
              ${
                disabled || value.includes('.')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-300 text-gray-900 active:bg-gray-100'
              }
            `}
          >
            .
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={`
              min-h-[64px] rounded-xl font-semibold text-base
              transition-all duration-200
              touch-manipulation active:scale-95
              ${
                disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 border-2 border-red-300 active:bg-red-200'
              }
            `}
          >
            Clear
          </button>
        )}

        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={disabled}
          className={`
            min-h-[64px] rounded-xl font-bold text-2xl
            transition-all duration-200
            touch-manipulation active:scale-95
            ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-900 active:bg-gray-100 active:border-purple-500'
            }
          `}
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          className={`
            min-h-[64px] rounded-xl font-bold text-2xl
            transition-all duration-200
            touch-manipulation active:scale-95
            ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 active:bg-gray-300'
            }
          `}
        >
          ⌫
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || value === ''}
        className={`
          w-full min-h-[56px] rounded-xl font-bold text-lg
          transition-all duration-200
          touch-manipulation active:scale-95
          ${
            disabled || value === ''
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white active:bg-purple-700 shadow-lg'
          }
        `}
      >
        Submit Score
      </button>
    </div>
  );
}
