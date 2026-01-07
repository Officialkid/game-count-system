"use client";

export default function AuthDebugPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Auth Diagnostics Disabled</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        Authentication and user accounts were removed. The app now uses token-based access only (admin_token, scorer_token, public_token), so this debug page is no longer available.
      </p>
      <div className="rounded-lg border p-4 bg-gray-50 text-gray-700 space-y-2">
        <p>• Use admin links to manage events and teams.</p>
        <p>• Use scorer links to submit scores.</p>
        <p>• Use public/recap links to view results without authentication.</p>
      </div>
    </div>
  );
}
