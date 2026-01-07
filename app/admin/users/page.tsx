'use client';

import React, { useState, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LoadingSkeleton,
  useToast,
} from '@/components/ui';
import { sendEventInviteEmail } from '@/lib/services/emailService';

interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  registration: string;
  labels?: string[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
'use client';

export default function AdminUsersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Admin Users</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The legacy admin user management UI has been disabled because the app now uses token-based access (admin_token, scorer_token, public_token) with no user accounts. Deployments to Vercel/Render will skip this feature to keep builds lean.
      </p>
      <div className="mt-6 space-y-2 text-gray-700">
        <p>• Admin actions: use the admin links generated when you create an event.</p>
        <p>• Scoring: use the scorer links generated per event.</p>
        <p>• Public access: share the public_token or recap link.</p>
      </div>
    </div>
  );
}
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendInvite}
                    disabled={sending}
                  >
                    {sending ? '📧 Sending...' : '✉️ Send Invite'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
