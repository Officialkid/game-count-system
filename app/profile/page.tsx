'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ProtectedPage } from '@/components/AuthGuard';
import { useToast } from '@/components/ui/Toast';
import { storageService } from '@/lib/services';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  contact?: string;
  avatar_url?: string;
}

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  'use client';

  export default function ProfilePage() {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Profile disabled</h1>
        <p className="text-gray-700 text-lg leading-relaxed">
          User profiles and authentication were removed. Access is now token-based (admin_token, scorer_token, public_token). There is no profile data to display or edit.
        </p>
        <div className="mt-6 space-y-2 text-gray-700">
          <p>• Use admin links to manage events and teams.</p>
          <p>• Use scorer links to submit scores.</p>
          <p>• Share public/recap links for read-only access.</p>
        </div>
      </div>
    );
  }
  );
}
