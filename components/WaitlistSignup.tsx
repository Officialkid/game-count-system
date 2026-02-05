'use client';

import React, { useState } from 'react';
import { Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';

interface WaitlistSignupProps {
  source?: 'expired-event' | 'landing-page' | 'premium-page' | 'other';
  onSuccess?: () => void;
  className?: string;
  title?: string;
  description?: string;
}

export function WaitlistSignup({
  source = 'expired-event',
  onSuccess,
  className = '',
  title = 'Join the Waitlist',
  description = 'Get notified about premium features, event restoration, and advanced analytics.',
}: WaitlistSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp_opt_in: false,
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          whatsapp_opt_in: formData.whatsapp_opt_in,
          consent: formData.consent,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || `Error: ${response.status}`
        );
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp_opt_in: false,
        consent: false,
      });

      // Call onSuccess callback after 2 seconds
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-900 mb-2">
              Welcome to the Waitlist! 🎉
            </h3>
            <p className="text-green-700 mb-3">
              We'll notify you when premium features and advanced analytics are available.
            </p>
            {formData.email && (
              <p className="text-sm text-green-600">
                Confirmation sent to <span className="font-semibold">{formData.email}</span>
              </p>
            )}
            {formData.whatsapp_opt_in && formData.phone && (
              <p className="text-sm text-green-600 mt-2">
                💬 We'll also reach out via WhatsApp
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl border-2 border-purple-200 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-6">{description}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors disabled:bg-gray-100"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* WhatsApp Opt-In */}
        <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            name="whatsapp_opt_in"
            checked={formData.whatsapp_opt_in}
            onChange={handleChange}
            disabled={loading}
            className="w-5 h-5 border-2 border-gray-300 rounded text-purple-600 focus:ring-2 focus:ring-purple-200 mt-0.5 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            <span className="font-medium">💬 Get updates via WhatsApp</span>
            <br />
            <span className="text-gray-600">Faster notifications when premium features launch</span>
          </span>
        </label>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            required
            checked={formData.consent}
            onChange={handleChange}
            disabled={loading}
            className="w-5 h-5 border-2 border-purple-300 rounded text-purple-600 focus:ring-2 focus:ring-purple-200 mt-0.5 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            I consent to receive emails about premium features, event restoration, and product updates. *
          </span>
        </label>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !formData.consent}
          className="w-full"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Joining Waitlist...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>

        <p className="text-xs text-gray-700 text-center">
          We respect your privacy. No spam, ever.
        </p>
      </form>
    </div>
  );
}
