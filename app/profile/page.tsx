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
