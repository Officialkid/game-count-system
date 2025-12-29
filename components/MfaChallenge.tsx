'use client';

import { useState } from 'react';
import { createMfaChallenge, completeMfaChallenge } from '@/lib/appwriteAuth';

interface MfaChallengeProps {
  factors: any[];
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

export default function MfaChallenge({ factors, onSuccess, onError }: MfaChallengeProps) {
  const [selectedFactor, setSelectedFactor] = useState(factors[0]?.id || '');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'verify'>('select');

  const handleCreateChallenge = async () => {
    if (!selectedFactor) return;
    
    setIsLoading(true);
    try {
      const result = await createMfaChallenge(selectedFactor);
      if (result.success) {
        setChallengeId(result.data.$id);
        setStep('verify');
      } else {
        onError(result.error);
      }
    } catch (error) {
      onError('Failed to create MFA challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !challengeId) return;

    setIsLoading(true);
    try {
      const result = await completeMfaChallenge(challengeId, otp);
      if (result.success) {
        onSuccess(result.data.user);
      } else {
        onError(result.error);
      }
    } catch (error) {
      onError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Multi-Factor Authentication</h3>
        <p className="text-sm text-gray-600">
          Please select your authentication method:
        </p>
        
        <div className="space-y-2">
          {factors.map((factor) => (
            <label key={factor.$id} className="flex items-center space-x-2">
              <input
                type="radio"
                value={factor.$id}
                checked={selectedFactor === factor.$id}
                onChange={(e) => setSelectedFactor(e.target.value)}
                className="text-primary-500"
              />
              <span className="capitalize">{factor.type} Authenticator</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleCreateChallenge}
          disabled={!selectedFactor || isLoading}
          className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Continue'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <h3 className="text-lg font-semibold">Enter Verification Code</h3>
      <p className="text-sm text-gray-600">
        Enter the 6-digit code from your authenticator app:
      </p>
      
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest"
        maxLength={6}
        autoComplete="one-time-code"
      />

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setStep('select')}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={otp.length !== 6 || isLoading}
          className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </form>
  );
}