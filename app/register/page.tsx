// app/register/page.tsx
// FIXED: Added validation visual feedback (red/green borders) and ARIA attributes (UI-DEBUG-REPORT Issue #6)
// ENHANCED: Added real-time password validation with strength meter
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, auth } from '@/lib/api-client';
import { PasswordInput } from '@/components';
import { Navbar } from '@/components/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnUrl, setReturnUrl] = useState('/dashboard');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ name: boolean; email: boolean; password: boolean; confirmPassword: boolean }>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Get returnUrl from query params on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrlParam = params.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, []);

  const validateName = (name: string): string | undefined => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== formData.password) return 'Passwords do not match';
    return undefined;
  };

  const handleBlur = (field: 'name' | 'email' | 'confirmPassword') => {
    setTouched({ ...touched, [field]: true });
    
    const errors: { name?: string; email?: string; password?: string; confirmPassword?: string } = { ...fieldErrors };
    if (field === 'name') {
      errors.name = validateName(formData.name);
    } else if (field === 'email') {
      errors.email = validateEmail(formData.email);
    } else if (field === 'confirmPassword') {
      errors.confirmPassword = validateConfirmPassword(formData.confirmPassword);
    }
    setFieldErrors(errors);
  };

  const getFieldClassName = (field: 'name' | 'email' | 'password' | 'confirmPassword') => {
    if (!touched[field]) return 'input-field';
    
    const hasError = fieldErrors[field];
    if (hasError) {
      return 'input-field border-red-500 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600';
    }
    return 'input-field border-green-500 dark:border-green-600 focus:ring-green-500 dark:focus:ring-green-600';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword);
    
    if (nameError || emailError || confirmPasswordError) {
      setFieldErrors({ name: nameError, email: emailError, confirmPassword: confirmPasswordError });
      setTouched({ name: true, email: true, password: true, confirmPassword: true });
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.register(
        formData.name,
        formData.email,
        formData.password
      );

      if (response.success && response.data?.token) {
        auth.setToken(response.data.token);
        // Delay redirect slightly to ensure localStorage is set
        setTimeout(() => {
          router.push(returnUrl);
        }, 100);
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <Navbar />

      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center dark:text-gray-100">Create Account</h1>

        {error && (
          <div 
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-lg mb-4"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 dark:text-gray-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              className={getFieldClassName('name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur('name')}
              aria-invalid={touched.name && !!fieldErrors.name}
              aria-describedby={touched.name && fieldErrors.name ? 'name-error' : undefined}
              required
            />
            {touched.name && fieldErrors.name && (
              <p id="name-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 dark:text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={getFieldClassName('email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onBlur={() => handleBlur('email')}
              aria-invalid={touched.email && !!fieldErrors.email}
              aria-describedby={touched.email && fieldErrors.email ? 'email-error' : undefined}
              required
            />
            {touched.email && fieldErrors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <PasswordInput
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              label="Password"
              placeholder="Create a strong password"
              showRequirements={true}
              showStrengthMeter={true}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 dark:text-gray-200">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={getFieldClassName('confirmPassword')}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Re-enter your password"
              aria-invalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
              aria-describedby={touched.confirmPassword && fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              required
            />
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
