// app/login/page.tsx
// FIXED: Now uses centralized auth context for consistent login flow
// FIXED: Added validation visual feedback (red/green borders) and ARIA attributes
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { getFriendlyError } from '@/lib/error-messages';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/dashboard');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Load saved credentials and returnUrl on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedRemember = localStorage.getItem('remember_me');
    if (savedEmail && savedRemember === 'true') {
      setFormData({ ...formData, email: savedEmail });
      setRememberMe(true);
    }
    
    // Get returnUrl from query params
    const params = new URLSearchParams(window.location.search);
    const returnUrlParam = params.get('returnUrl');
    if (returnUrlParam) {
      setReturnUrl(returnUrlParam);
    }
  }, []);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    
    const errors: { email?: string; password?: string } = { ...fieldErrors };
    if (field === 'email') {
      errors.email = validateEmail(formData.email);
    } else if (field === 'password') {
      errors.password = validatePassword(formData.password);
    }
    setFieldErrors(errors);
  };

  const getFieldClassName = (field: 'email' | 'password') => {
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
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);

      // Store or clear credentials based on Remember Me
      if (rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }
      
      // Delay redirect slightly to ensure auth state is updated
      setTimeout(() => {
        router.push(returnUrl);
      }, 100);
    } catch (err: any) {
      const friendly = getFriendlyError({ status: err?.status, message: err?.message, context: 'auth' });
      setError(`${friendly.title}: ${friendly.message}${friendly.suggestion ? ` — ${friendly.suggestion}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <Navbar />

      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center dark:text-gray-100">Login</h1>

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
            <label htmlFor="password" className="block text-sm font-medium mb-2 dark:text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={getFieldClassName('password')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onBlur={() => handleBlur('password')}
              aria-invalid={touched.password && !!fieldErrors.password}
              aria-describedby={touched.password && fieldErrors.password ? 'password-error' : undefined}
              required
            />
            {touched.password && fieldErrors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400 mt-1" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              aria-label="Remember me on this device"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              Remember me on this device
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 dark:text-primary-400 hover:underline">
            Register
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
