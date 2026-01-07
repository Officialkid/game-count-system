// components/admin/AdminManagement.tsx
'use client';

interface AdminManagementProps {
  eventId: string;
  eventName: string;
}

export default function AdminManagement({ eventId, eventName }: AdminManagementProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Admin Management</h2>
      <p className="text-gray-700">
        Admin management was removed. The app now uses token-based access with admin_token, scorer_token, and public_token instead of user accounts.
      </p>
      <div className="mt-4 space-y-2 text-gray-600">
        <p>• Share tokens with team members to grant access.</p>
        <p>• Tokens are immutable and can be regenerated if needed.</p>
        <p>• All actions use token headers (X-ADMIN-TOKEN, X-SCORER-TOKEN, X-PUBLIC-TOKEN).</p>
      </div>
    </div>
  );
}
