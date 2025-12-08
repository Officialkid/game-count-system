// components/AuthForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface AuthFormData {
  name?: string;
  email: string;
  password: string;
}

export function AuthForm({ type, onSubmit, loading = false, error }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});

  const validateName = (name?: string) => {
    if (type === 'login') return undefined;
    if (!name) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateEmail = (email?: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
    return undefined;
  };

  const validatePassword = (password?: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  const validateAll = () => {
    const nextErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    // Remove name check for login
    if (type === 'login') delete nextErrors.name;

    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) {
      setFieldErrors(nextErrors);
    } else {
      setFieldErrors({});
    }
    return !hasError;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (!validateAll()) return;

    await onSubmit(formData);
  };

  const isRegister = type === 'register';

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16">
      <Card>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎮</div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isRegister
              ? 'Sign up to start tracking scores'
              : 'Login to manage your events'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => {
                setTouched({ ...touched, name: true });
                setFieldErrors({ ...fieldErrors, name: validateName(formData.name) });
              }}
              required
              minLength={2}
              error={touched.name ? fieldErrors.name : undefined}
            />
          )}

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={() => {
              setTouched({ ...touched, email: true });
              setFieldErrors({ ...fieldErrors, email: validateEmail(formData.email) });
            }}
            required
            error={touched.email ? fieldErrors.email : undefined}
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => {
              setTouched({ ...touched, password: true });
              setFieldErrors({ ...fieldErrors, password: validatePassword(formData.password) });
            }}
            required
            minLength={8}
            helperText={
              !fieldErrors.password && isRegister ? 'Minimum 8 characters' : undefined
            }
            error={touched.password ? fieldErrors.password : undefined}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading
              ? isRegister
                ? 'Creating Account...'
                : 'Logging in...'
              : isRegister
              ? 'Create Account'
              : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:underline font-semibold">
                Login
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:underline font-semibold">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
