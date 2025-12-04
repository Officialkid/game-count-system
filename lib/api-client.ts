// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error, attempt) => {
    // Retry on network errors or 5xx status codes
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      return true;
    }
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    // Don't retry on 4xx errors (client errors)
    return false;
  },
};

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...defaultRetryOptions, ...retryOptions };
  let lastError: any;

  for (let attempt = 0; attempt <= (opts.maxRetries || 0); attempt++) {
    try {
      const response = await fetch(url, { credentials: 'include', ...options });
      
      // If successful or non-retryable error, return immediately
      if (response.ok || !opts.shouldRetry?.(response, attempt)) {
        return response;
      }

      // Store error for potential retry
      lastError = { status: response.status, statusText: response.statusText };
      
      // If this was the last attempt, return the failed response
      if (attempt === opts.maxRetries) {
        return response;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        (opts.initialDelay || 1000) * Math.pow(2, attempt),
        opts.maxDelay || 10000
      );
      
      console.warn(`Request failed (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error: any) {
      lastError = error;
      
      // If this was the last attempt or shouldn't retry, throw the error
      if (attempt === opts.maxRetries || !opts.shouldRetry?.(error, attempt)) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(
        (opts.initialDelay || 1000) * Math.pow(2, attempt),
        opts.maxDelay || 10000
      );
      
      console.warn(`Network error (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export const apiClient = {
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async createEvent(token: string, event_name: string) {
    const res = await fetch(`${API_BASE_URL}/api/events/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event_name }),
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async listEvents(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/events/list`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async addTeam(token: string, event_id: string, team_name: string, avatar_url?: string) {
    const res = await fetch(`${API_BASE_URL}/api/teams/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id, team_name, avatar_url }),
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async listTeams(token: string, event_id: string) {
    const res = await fetch(`${API_BASE_URL}/api/teams/list?event_id=${event_id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async addScore(token: string, event_id: string, team_id: string, game_number: number, points: number) {
    const res = await fetch(`${API_BASE_URL}/api/scores/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id, team_id, game_number, points }),
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async getScoresByEvent(token: string, event_id: string) {
    const res = await fetch(`${API_BASE_URL}/api/scores/by-event?event_id=${event_id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
    });
    return res.json() as Promise<ApiResponse>;
  },

  async getPublicScoreboard(token: string) {
    const res = await fetch(`${API_BASE_URL}/api/public/${token}`);
    return res.json() as Promise<ApiResponse>;
  },

  // Generic POST method - automatically includes auth token from localStorage with retry logic
  async post(endpoint: string, data: any, token?: string, retryOptions?: RetryOptions) {
    // Use provided token or get from localStorage
    const authToken = token || auth.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }, retryOptions);
    
    return res;
  },

  // Generic GET method with retry logic
  async get(endpoint: string, token?: string, retryOptions?: RetryOptions) {
    const headers: HeadersInit = {};
    // Use provided token or get from localStorage
    const authToken = token || auth.getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      headers,
    }, retryOptions);
    
    return res;
  },

  // Generic DELETE method with retry logic
  async delete(endpoint: string, token?: string, retryOptions?: RetryOptions) {
    const headers: HeadersInit = {};
    // Use provided token or get from localStorage
    const authToken = token || auth.getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    }, retryOptions);
    
    return res;
  },

  // Generic PATCH method with retry logic
  async patch(endpoint: string, data: any, token?: string, retryOptions?: RetryOptions) {
    const authToken = token || auth.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const res = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }, retryOptions);
    
    return res;
  },
};

// Auth utilities
export const auth = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// Export clearAuth function for logout functionality
export function clearAuth() {
  auth.removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
