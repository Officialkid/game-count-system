/**
 * Clean API Client for REST endpoints
 * Token-based only (admin/scorer/public). No Appwrite dependencies.
 *
 * Supports separate frontend/backend deployment by setting NEXT_PUBLIC_API_BASE_URL
 * to the backend URL (e.g., Render). Defaults to same origin when unset.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type ApiResponse<T = any> = { success: boolean; data?: T; error?: string };

function buildHeaders(token?: string, tokenType?: 'admin' | 'scorer'): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token && tokenType === 'admin') headers['X-ADMIN-TOKEN'] = token;
  if (token && tokenType === 'scorer') headers['X-SCORER-TOKEN'] = token;

  return headers;
}

export const apiClient = {
  async get(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async post(endpoint: string, data?: any, token?: string, tokenType?: 'admin' | 'scorer'): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(token, tokenType),
      body: data instanceof FormData ? (data as any) : JSON.stringify(data ?? {}),
    });
  },

  async delete(endpoint: string, token?: string, tokenType?: 'admin' | 'scorer'): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: buildHeaders(token, tokenType),
    });
  },

  async patch(endpoint: string, data?: any, token?: string, tokenType?: 'admin' | 'scorer'): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(token, tokenType),
      body: JSON.stringify(data ?? {}),
    });
  },

  async createEvent(data: {
    name: string;
    mode: 'quick' | 'camp' | 'advanced';
    start_at: string;
    retention_policy: 'auto_expire' | 'manual' | 'archive';
    expires_at?: string;
  }): Promise<ApiResponse> {
    const response = await this.post('/api/events/create', data);
    return response.json();
  },

  async addTeam(eventId: string, adminToken: string, data: { name: string; color: string }): Promise<ApiResponse> {
    const response = await this.post(`/api/events/${eventId}/teams`, data, adminToken, 'admin');
    return response.json();
  },

  async addScore(
    eventId: string,
    scorerToken: string,
    data: { team_id: string; day_number: number; category: string; points: number }
  ): Promise<ApiResponse> {
    const response = await this.post(`/api/events/${eventId}/scores`, data, scorerToken, 'scorer');
    return response.json();
  },

  async lockDay(eventId: string, dayNumber: number, adminToken: string): Promise<ApiResponse> {
    const response = await this.post(`/api/events/${eventId}/days/${dayNumber}/lock`, {}, adminToken, 'admin');
    return response.json();
  },

  async getPublicScoreboard(publicToken: string): Promise<ApiResponse> {
    const response = await this.get(`/events/${publicToken}`);
    return response.json();
  },
};

// Minimal auth shim retained for callers that still import it; returns null token.
export const auth = {
  setToken(_token: string) {},
  getToken(): string | null {
    return null;
  },
  removeToken() {},
  isAuthenticated(): boolean {
    return true;
  },
};

export function clearAuth() {
  auth.removeToken();
}

