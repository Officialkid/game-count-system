'use client';

export default function AdminUsersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Admin Users</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The legacy admin user management UI was removed. Access is now token-based (admin_token, scorer_token, public_token) with no user accounts.
      </p>
      <div className="mt-6 space-y-2 text-gray-700">
        <p>• Admin actions: use the admin links generated when you create an event.</p>
        <p>• Scoring: use the scorer links generated per event.</p>
        <p>• Public access: share the public_token or recap link.</p>
      </div>
    </div>
  );
}
