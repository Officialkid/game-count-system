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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
              required
              minLength={2}
            />
          )}

          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={8}
            helperText={isRegister ? 'Minimum 8 characters' : undefined}
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
