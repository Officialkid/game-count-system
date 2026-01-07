// app/event/[eventId]/history/page.tsx
'use client';
'use client';

export default function EventHistoryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">History view unavailable</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The dedicated history view was tied to the old auth stack. Please use the token-based event pages instead:
      </p>
      <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
        <li>Use your admin link to view and manage teams/scores.</li>
        <li>Use your scorer link to enter scores.</li>
        <li>Use the public or recap links to view results.</li>
      </ul>
    </div>
  );
}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href={`/event/${eventId}`} className="btn-secondary">
          Back to Event
        </Link>
      </div>
    </div>
  );
}
