// app/public/page.tsx
'use client';

export default function PublicEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Public events listing disabled</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The Appwrite-based public events directory was removed. Use the token-based links generated per event instead.
      </p>
      <div className="mt-6 space-y-2 text-gray-700">
        <p>• Public/live view: share the public link or recap link generated for each event.</p>
        <p>• Display view: use /display/[eventId] with the correct token headers from your backend.</p>
        <p>• Admin/Scorer actions: use the tokenized links returned when creating an event.</p>
      </div>
    </div>
  );
}
