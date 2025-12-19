"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PublicAuthPage } from '@/components/AuthGuard';
import { getFriendlyError } from '@/lib/error-messages';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completePasswordRecovery, isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    setUserId(searchParams.get('userId'));
    setSecret(searchParams.get('secret'));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !secret) {
      setError('Missing recovery token. Please use the link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await completePasswordRecovery(userId, secret, password);
      setSuccess(true);
      // After a short delay, go back to login
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      const friendly = getFriendlyError({ status: err?.status, message: err?.message, context: 'auth' });
      setError(`${friendly.title}: ${friendly.message}${friendly.suggestion ? ` — ${friendly.suggestion}` : ''}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6 text-center">Set a new password</h1>

          {success ? (
            <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg" role="status">
              Password updated! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg" role="alert">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium mb-2">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  className="input-field"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}

          <p className="text-center mt-6 text-gray-600">
            <Link href="/login" className="text-primary-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicAuthPage>
      <ResetPasswordForm />
    </PublicAuthPage>
  );
}
