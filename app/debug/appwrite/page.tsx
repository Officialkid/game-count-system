'use client';

import { useEffect, useState } from 'react';
import { checkAppwriteHealth, type AppwriteHealthStatus } from '@/lib/appwriteHealth';

export default function AppwriteDebugPage() {
  const [status, setStatus] = useState<AppwriteHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await checkAppwriteHealth();
        if (mounted) setStatus(s);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Appwrite Connectivity</h1>

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm p-4">
          {loading ? (
            <p className="text-neutral-600">Checking Appwrite health…</p>
          ) : status ? (
            <div className="space-y-2">
              <Row label="Initialized" value={status.initialized ? 'Yes' : 'No'} ok={status.initialized} />
              <Row label="Connected" value={status.connected ? 'Yes' : 'No'} ok={status.connected} />
              <Row label="Authenticated" value={status.authenticated ? 'Yes' : 'No'} ok={status.authenticated} />
              {status.endpoint && <Row label="Endpoint" value={status.endpoint} />}
              {status.project && <Row label="Project" value={status.project} />}
              {status.error && (
                <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  <strong>Error:</strong> {status.error}
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-600">No status available.</p>
          )}
        </div>

        <p className="mt-4 text-sm text-neutral-600">
          Tip: A 401 (Not authenticated) still proves connectivity. Log in and refresh to verify authenticated state.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`text-sm font-medium ${ok === undefined ? 'text-neutral-900' : ok ? 'text-green-700' : 'text-red-700'}`}>{value}</span>
    </div>
  );
}
