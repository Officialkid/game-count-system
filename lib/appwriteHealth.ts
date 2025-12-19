import { account, client } from '@/lib/appwrite';

export type AppwriteHealthStatus = {
  initialized: boolean;
  connected: boolean;
  authenticated: boolean;
  endpoint?: string;
  project?: string;
  error?: string;
};

/**
 * Performs a lightweight connectivity/auth check against Appwrite.
 * - Verifies SDK initialized
 * - Attempts account.get(); 401 means reachable but unauthenticated
 */
export async function checkAppwriteHealth(): Promise<AppwriteHealthStatus> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

    const initialized = Boolean(client) && Boolean(account) && Boolean(endpoint) && Boolean(project);
    if (!initialized) {
      return {
        initialized,
        connected: false,
        authenticated: false,
        endpoint,
        project,
        error: 'Appwrite not initialized or missing environment variables',
      };
    }

    try {
      const me = await account.get();
      // If this succeeds, we are connected and authenticated
      return {
        initialized: true,
        connected: true,
        authenticated: true,
        endpoint,
        project,
      };
    } catch (err: any) {
      const message = err?.message || String(err);
      const code = err?.code || err?.response?.status;
      // 401 indicates the SDK can reach Appwrite but no session exists
      if (code === 401 || /unauthorized/i.test(message)) {
        return {
          initialized: true,
          connected: true,
          authenticated: false,
          endpoint,
          project,
          error: 'Not authenticated (401) — connectivity OK',
        };
      }
      // Any other error means likely connectivity or project mismatch
      return {
        initialized: true,
        connected: false,
        authenticated: false,
        endpoint,
        project,
        error: message,
      };
    }
  } catch (e: any) {
    return {
      initialized: false,
      connected: false,
      authenticated: false,
      error: e?.message || String(e),
    };
  }
}
