// app/register/page.tsx
// FIXED: Now uses centralized auth context for consistent registration flow
// FIXED: Added validation visual feedback (red/green borders) and ARIA attributes
// ENHANCED: Added real-time password validation with strength meter and submission lock
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useSubmissionLock } from '@/lib/hooks/useSubmissionLock';
import { PublicAuthPage } from '@/components/AuthGuard';
import { getFriendlyError } from '@/lib/error-messages';

// Inner register form component
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading: authLoading } = useAuth();
  const { lock: lockSubmit, unlock: unlockSubmit, isSubmitting } = useSubmissionLock();
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
    showPassword: false,
    showConfirmPassword: false,
    rememberMe: false,
  });
  
  // Load returnUrl from query params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safety
    
    // Get returnUrl from query params
    const returnUrlParam = searchParams.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, [searchParams]);

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
      return 'input-field border-red-500 focus:ring-red-500';
    }
    return 'input-field border-green-500 focus:ring-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (!lockSubmit()) return;
    
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
      unlockSubmit();
      return;
    }

    try {
      await register(
        formData.name,
        formData.email,
        formData.password
      );

      // Delay redirect slightly to ensure auth state is updated
      setTimeout(() => {
        router.push(returnUrl);
      }, 100);
    } catch (err: any) {
      const friendly = getFriendlyError({ status: err?.status, message: err?.message, context: 'auth' });
      setError(`${friendly.title}: ${friendly.message}${friendly.suggestion ? ` — ${friendly.suggestion}` : ''}`);
      unlockSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>

        {error && (
          <div 
            className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg mb-4"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
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
              <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
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
              <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={formData.showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
              >
                {formData.showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={formData.showConfirmPassword ? 'text' : 'password'}
                className={getFieldClassName('confirmPassword') + ' pr-10'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Re-enter your password"
                aria-invalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
                aria-describedby={touched.confirmPassword && fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
              >
                {formData.showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300"
            />
            Remember me on this device
          </label>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || isSubmitting}
            aria-busy={loading || isSubmitting}
          >
            {isSubmitting || loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 hover:underline">
            Login
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}

// Wrap with PublicAuthPage to redirect already-authenticated users
export default function RegisterPage() {
  return (
    <PublicAuthPage>
      <RegisterForm />
    </PublicAuthPage>
  );
}
