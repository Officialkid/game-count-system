"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PublicAuthPage } from '@/components/AuthGuard';
import { getFriendlyError } from '@/lib/error-messages';

function ForgotPasswordForm() {
  const { startPasswordRecovery, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await startPasswordRecovery(email);
      setSubmitted(true);
    } catch (err: any) {
      const friendly = getFriendlyError({ status: err?.status, message: err?.message, context: 'auth' });
      setError(`${friendly.title}: ${friendly.message}${friendly.suggestion ? ` — ${friendly.suggestion}` : ''}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6 text-center">Reset your password</h1>

          {submitted ? (
            <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg" role="status">
              Check your email for a recovery link. Follow the link to set a new password.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg" role="alert">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={isLoading} aria-busy={isLoading}>
                {isLoading ? 'Sending link...' : 'Send recovery link'}
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

export default function ForgotPasswordPage() {
  return (
    <PublicAuthPage>
      <ForgotPasswordForm />
    </PublicAuthPage>
  );
}
