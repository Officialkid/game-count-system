'use client';

export default function EventDetailPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Event management disabled</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The authenticated event management UI was removed. Use the token-based links generated when you create an event:
      </p>
      <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
        <li>Admin link → manage teams, settings, and scoring.</li>
        <li>Scorer link → submit scores.</li>
        <li>Public link → view live scoreboard.</li>
        <li>Recap link → view recap page (/recap/public_token).</li>
      </ul>
    </div>
  );
}
