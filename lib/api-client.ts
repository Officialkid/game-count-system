// Appwrite-first API client: thin wrappers around fetch and Appwrite Functions.
import { functions } from '@/lib/appwrite';

type ApiResponse<T = any> = { success: boolean; data?: T; error?: string };

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export const apiClient = {
  // Thin GET wrapper (expects Next.js API to return JSON)
  async get(endpoint: string, token?: string): Promise<Response> {
    return fetch(endpoint, { headers: buildHeaders(token) });
  },

  // Thin POST wrapper
  async post(endpoint: string, data?: any, token?: string): Promise<Response> {
    return fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(token),
      body: data instanceof FormData ? (data as any) : JSON.stringify(data ?? {}),
    });
  },

  // Thin DELETE wrapper
  async delete(endpoint: string, token?: string): Promise<Response> {
    return fetch(endpoint, { method: 'DELETE', headers: buildHeaders(token) });
  },

  // Thin PATCH wrapper
  async patch(endpoint: string, data?: any, token?: string): Promise<Response> {
    return fetch(endpoint, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(data ?? {}),
    });
  },

  // Optional helper: submit score via Appwrite Function when configured
  async addScore(
    _token: string | undefined,
    event_id: string,
    team_id: string,
    game_number: number,
    points: number
  ): Promise<ApiResponse<{ submitted: boolean; executionId?: string }>> {
    const fnId = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_SUBMIT_SCORE;
    if (!fnId) {
      return { success: false, error: 'Submit score function not configured' };
    }
    try {
      const clientScoreId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `score-${Date.now()}`;
      const payload = { event_id, team_id, game_number, points, clientScoreId };
      const exec = await functions.createExecution(fnId, JSON.stringify(payload), true);
      return { success: true, data: { submitted: true, executionId: exec.$id } };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to submit score' };
    }
  },
};

// Minimal auth shim retained for callers that read a token. Appwrite uses session cookies.
export const auth = {
  setToken(_token: string) {
    // No-op in Appwrite session mode
  },
  getToken(): string | null {
    return null; // No bearer token needed with Appwrite sessions
  },
  removeToken() {
    // No-op
  },
  isAuthenticated(): boolean {
    return true; // Components should rely on useAuth for real status
  },
};

export function clearAuth() {
  auth.removeToken();
}

