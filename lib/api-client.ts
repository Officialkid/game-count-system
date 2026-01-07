/**
 * Clean API Client for REST endpoints
 * NO Appwrite, NO authentication - Token-based only
 * 
 * Supports separate frontend/backend deployment:
 * - Set NEXT_PUBLIC_API_BASE_URL to point to backend (e.g., Render)
 * - Defaults to same origin for monolithic deployment
 */

// API Base URL - defaults to same origin for monolithic deployment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type ApiResponse<T = any> = { success: boolean; data?: T; error?: string };

function buildHeaders(token?: string, tokenType?: 'admin' | 'scorer'): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Use custom headers for token-based access
  if (token && tokenType === 'admin') {
    headers['X-ADMIN-TOKEN'] = token;
  } else if (token && tokenType === 'scorer') {
    headers['X-SCORER-TOKEN'] = token;
  }
  
  return headers;
}

export const apiClient = {
  /**
   * GET request
   */
  async get(endpoint: string): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  /**
   * POST request with optional token
   */
  async post(
    endpoint: string, 
    data?: any, 
    token?: string,
    tokenType?: 'admin' | 'scorer'
  ): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(token, tokenType),
      body: data instanceof FormData ? (data as any) : JSON.stringify(data ?? {}),
    });
  },

  /**
   * DELETE request with optional token
   */
  async delete(endpoint: string, token?: string, tokenType?: 'admin' | 'scorer'): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, { 
      method: 'DELETE', 
      headers: buildHeaders(token, tokenType) 
    });
  },

  /**
   * PATCH request with optional token
   */
  async patch(
    endpoint: string, 
    data?: any, 
    token?: string,
    tokenType?: 'admin' | 'scorer'
  ): Promise<Response> {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: buildHeaders(token, tokenType),
      body: JSON.stringify(data ?? {}),
    });
  },

  /**
   * Create a new event (public endpoint)
   */
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

  /**
   * Add a team (requires admin token)
   */
  async addTeam(
    eventId: string,
    adminToken: string,
    data: { name: string; color: string }
  ): Promise<ApiResponse> {
    const response = await this.post(
      `/api/events/${eventId}/teams`,
      data,
      adminToken,
      'admin'
    );
    return response.json();
  },

  /**
   * Submit a score (requires scorer token)
   */
  async addScore(
    eventId: string,
    scorerToken: string,
    data: {
      team_id: string;
      day_number: number;
      category: string;
      points: number;
    }
  ): Promise<ApiResponse> {
    const response = await this.post(
      `/api/events/${eventId}/scores`,
      data,
      scorerToken,
      'scorer'
    );
    return response.json();
  },

  /**
   * Lock a day (requires admin token)
   */
  async lockDay(
    eventId: string,
    dayNumber: number,
    adminToken: string
  ): Promise<ApiResponse> {
    const response = await this.post(
      `/api/events/${eventId}/days/${dayNumber}/lock`,
      {},
      adminToken,
      'admin'
    );
    return response.json();
  },

  /**
   * Get public scoreboard (no token required)
   */
  async getPublicScoreboard(publicToken: string): Promise<ApiResponse> {
    const response = await this.get(`/events/${publicToken}`);
    return response.json();
  },
};
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

