import { Account, ID, Models } from 'appwrite';
import { account } from './appwrite';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  created_at?: string;
};

function getAppUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3002';
}

function mapUser(u: Models.User<Models.Preferences> | null): AuthUser | null {
  if (!u) return null;
  return {
    id: u.$id,
    name: u.name || u.email,
    email: u.email,
    created_at: u.$createdAt,
  };
}

export async function register(name: string, email: string, password: string) {
  try {
    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);
    
    await new Promise(r => setTimeout(r, 1000));
    const u = await account.get();
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function login(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    console.debug('[AUTH] ✅ Session created:', session.$id);
    
    await new Promise(r => setTimeout(r, 1000));
    
    const u = await account.get();
    console.debug('[AUTH] ✅ User retrieved after login:', { id: u.$id, email: u.email });
    
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
    console.error('[AUTH] ❌ Login failed:', { code: err?.code, message: err?.message });
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function logout() {
  try {
    await account.deleteSessions();
    return { success: true } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function startPasswordRecovery(email: string) {
  try {
    const redirectUrl = `${getAppUrl()}/reset-password`;
    console.log('[AUTH] Starting password recovery for:', email, 'redirect:', redirectUrl);
    await account.createRecovery(email, redirectUrl);
    return { success: true } as const;
  } catch (err: any) {
    console.error('[AUTH] Password recovery error:', err);
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function completePasswordRecovery(userId: string, secret: string, newPassword: string) {
  try {
    await account.updateRecovery(userId, secret, newPassword, newPassword);
    return { success: true } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function loginWithGoogle() {
  try {
    const redirectUrl = `${getAppUrl()}/login`;
    await account.createOAuth2Session('google', redirectUrl, redirectUrl);
    return { success: true } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function getCurrentUser() {
  try {
    const u = await account.get();
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
    const code = err?.code || err?.response?.code;
    
    if (code === 401) {
      console.debug('[AUTH] No active session (401 Unauthorized)');
      return { success: true, data: { user: null } } as const;
    }
    
    console.debug('[AUTH] Session check error (non-401):', { code, message: err?.message });
    return { success: true, data: { user: null } } as const;
  }
}

export function translateAppwriteError(err: any): string {
  const code = err?.code || err?.response?.code;
  const message = err?.message || err?.response?.message || '';

  console.error('[AUTH ERROR]', { code, message, err });
  
  if (code === 401) return 'Invalid email or password';
  if (code === 409 && /already exists/i.test(message)) return 'Email already in use';
  if (code === 429) return 'Too many attempts, please try again later';
  if (code === 400) return 'Invalid request, please check your input';
  if (code === 404) return 'User not found';
  if (code === 500) return 'Server error, please try again later';
  if (/network/i.test(message)) return 'Network error, check your connection';
  if (/timeout/i.test(message)) return 'Request timeout, please try again';

  return message || 'Something went wrong. Please try again.';
}