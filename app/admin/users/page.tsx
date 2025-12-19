'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call:
      // - Appwrite Admin API to list all users
      // - Or a server-side function with admin permissions
      
      // For now, mock data
      const mockUsers: User[] = [
        {
          $id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          emailVerification: true,
          registration: new Date().toISOString(),
          labels: ['admin'],
        },
        {
          $id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          emailVerification: true,
          registration: new Date().toISOString(),
          labels: ['user'],
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      // In a real implementation:
      // - Call Appwrite Function to update user labels
      // - Or use Appwrite Admin SDK on server
      
      showToast(`User role updated to ${newRole}`, 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to update user role', 'error');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      showToast('Please enter an email address', 'warning');
      return;
    }

    try {
      setSending(true);
      
      const result = await sendEventInviteEmail(
        inviteEmail,
        'Game Count System',
        'Admin',
        `${window.location.origin}/register`
      );

      if (result.success) {
        showToast('Invitation sent successfully', 'success');
        setInviteEmail('');
        setShowInviteModal(false);
      } else {
        showToast(result.error || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      showToast('Failed to send invitation', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          ✉️ Invite User
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Verified</p>
              <p className="text-3xl font-bold text-green-600">
                {users.filter(u => u.emailVerification).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Admins</p>
              <p className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.labels?.includes('admin')).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Registered</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.$id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        user.labels?.includes('admin')
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }>
                        {user.labels?.includes('admin') ? '👑 Admin' : '👤 User'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={
                        user.emailVerification
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }>
                        {user.emailVerification ? '✓ Verified' : '⏳ Pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(user.registration)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleRole(
                          user.$id,
                          user.labels?.includes('admin') ? 'admin' : 'user'
                        )}
                      >
                        {user.labels?.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowInviteModal(false)}
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
