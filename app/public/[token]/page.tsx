// app/public/[token]/page.tsx
'use client';

export default function PublicScoreboardPage({ params }: { params: { token: string } }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Public scoreboard disabled</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        Share links and Appwrite-backed public scoreboards were removed. Please use the new token-based endpoints instead.
      </p>
      <div className="mt-6 space-y-2 text-gray-700">
        <p>• Use admin/scorer/public tokens with the display view at /display/[eventId].</p>
        <p>• Recap/public sharing now uses generated tokens served by the backend, not Appwrite share links.</p>
        <p>• Token provided in the URL ({params.token}) is no longer resolved.</p>
      </div>
    </div>
  );
}
