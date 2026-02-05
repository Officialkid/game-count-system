'use client';

import { useState, useEffect } from 'react';
import { passwordRequirements, validatePassword, getPasswordStrengthColor, getPasswordStrengthBgColor, type PasswordValidationResult } from '@/lib/password-validator';
import { Input } from './Input';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showRequirements?: boolean;
  showStrengthMeter?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  label = 'Password',
  placeholder = 'Enter your password',
  showRequirements = true,
  showStrengthMeter = true,
  required = true,
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value) {
      const result = validatePassword(value);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [value]);

  const handleBlur = () => {
    setTouched(true);
  };

  const strengthPercentage = validation
    ? (validation.requirements.filter(r => r.met).length / validation.requirements.length) * 100
    : 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="pr-12"
            aria-label={label}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-700 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Password Strength Meter */}
      {showStrengthMeter && value && validation && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Password Strength:</span>
            <span className={`font-medium capitalize ${getPasswordStrengthColor(validation.strength)}`}>
              {validation.strength}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getPasswordStrengthBgColor(validation.strength)}`}
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Password Requirements */}
      {showRequirements && touched && value && validation && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">Password must have:</p>
          <ul className="space-y-1">
            {validation.requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                {req.met ? (
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={req.met ? 'text-gray-700' : 'text-gray-700'}>
                  {req.message}
                </span>
              </li>
            ))}
          </ul>
          {validation.errors.length > 0 && (
            <div className="pt-2 border-t border-gray-300 text-sm text-red-600">
              {validation.errors.filter(err => !passwordRequirements.some(req => req.message === err)).join('. ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
