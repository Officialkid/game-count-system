// components/admin/AdminManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../ui/Toast';
import { EventAdmin, AdminInvitation, AdminActivityLog, AdminRole } from '@/lib/types';

interface AdminManagementProps {
  eventId: string;
  eventName: string;
}

export default function AdminManagement({ eventId, eventName }: AdminManagementProps) {
  const [admins, setAdmins] = useState<EventAdmin[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [activityLog, setActivityLog] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('admin');
  const [submitting, setSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EventAdmin | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    loadAdmins();
  }, [eventId]);

  useEffect(() => {
    if (showActivityLog) {
      loadActivityLog(activityPage);
    }
  }, [showActivityLog, activityPage]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${eventId}/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data.admins);
        setInvitations(data.data.invitations);
      } else {
        showToast(data.error || 'Failed to load administrators', 'error');
      }
    } catch (error) {
      showToast('Network error loading administrators', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async (page: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/events/${eventId}/admins/activity?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setActivityLog(data.data.logs);
        setActivityTotal(data.data.pagination.total);
      }
    } catch (error) {
      showToast('Failed to load activity log', 'error');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${eventId}/admins/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Invitation sent successfully!', 'success');
        setInviteEmail('');
        setInviteRole('admin');
        setShowInviteForm(false);
        loadAdmins();
      } else {
        showToast(data.error || 'Failed to send invitation', 'error');
      }
    } catch (error) {
      showToast('Network error sending invitation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/events/${eventId}/admins?userId=${removeTarget.user_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast('Administrator removed successfully', 'success');
        setRemoveTarget(null);
        loadAdmins();
      } else {
        showToast(data.error || 'Failed to remove administrator', 'error');
      }
    } catch (error) {
      showToast('Network error removing administrator', 'error');
    }
  };

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'judge':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scorer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Administrators</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage who can access and modify "{eventName}"
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Invite Admin
        </button>
      </div>

      {/* Admins List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
                    {admin.user_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{admin.user_name}</h3>
                    <p className="text-sm text-gray-600">{admin.user_email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                    admin.role
                  )}`}
                >
                  {admin.role.toUpperCase()}
                </span>
                {admin.role !== 'owner' && (
                  <button
                    onClick={() => setRemoveTarget(admin)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Invitations</h3>
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{invitation.invitee_email}</p>
                  <p className="text-xs text-gray-600">
                    Invited {formatDate(invitation.created_at)} • Expires{' '}
                    {formatDate(invitation.expires_at)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                    invitation.role
                  )}`}
                >
                  {invitation.role.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log Button */}
      <button
        onClick={() => setShowActivityLog(true)}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        View Activity Log
      </button>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Invite Administrator</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="admin">Admin - Manage teams, scores, settings</option>
                  <option value="judge">Judge - Add and edit scores</option>
                  <option value="scorer">Scorer - Add scores only</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Administrator?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove <strong>{removeTarget.user_name}</strong> (
              {removeTarget.user_email}) as {removeTarget.role} from this event?
            </p>
            <p className="text-sm text-amber-600 mb-4">
              They will immediately lose access to manage this event.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
                <button
                  onClick={() => setShowActivityLog(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {activityLog.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {log.admin_name} • <span className="text-purple-600">{log.admin_role}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Action: <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                        </p>
                        {log.details && (
                          <pre className="text-xs text-gray-500 mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {activityTotal > 20 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                  disabled={activityPage === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {activityPage} of {Math.ceil(activityTotal / 20)}
                </span>
                <button
                  onClick={() => setActivityPage((p) => p + 1)}
                  disabled={activityPage >= Math.ceil(activityTotal / 20)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
