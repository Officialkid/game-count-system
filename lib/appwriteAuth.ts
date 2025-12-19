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
  // Prefer configured app URL; default to HTTPS dev port to match CORS/redirects
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
    // Create the user
    await account.create(ID.unique(), email, password, name);
    // Auto login after register - create session
    const session = await account.createEmailPasswordSession(email, password);
    
    // Small delay to ensure session is established
    await new Promise(r => setTimeout(r, 200));
    const u = await account.get();
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function login(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    
    // Small delay to ensure session is established
    await new Promise(r => setTimeout(r, 200));
    const u = await account.get();
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
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
    await account.createRecovery(email, redirectUrl);
    return { success: true } as const;
  } catch (err: any) {
    return { success: false, error: translateAppwriteError(err) } as const;
  }
}

export async function completePasswordRecovery(userId: string, secret: string, newPassword: string) {
  try {
    await account.updateRecovery(userId, secret, newPassword, newPassword);
    // Auto-login is handled by Appwrite after successful recovery
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
    // ✅ Session valid and user data retrieved
    return { success: true, data: { user: mapUser(u) } } as const;
  } catch (err: any) {
    const code = err?.code || err?.response?.code;
    
    // 401 Unauthorized - No active session
    if (code === 401) {
      console.debug('[AUTH] No active session (401 Unauthorized)');
      return { success: true, data: { user: null } } as const;
    }
    
    // Other errors - Still return success but with null user (deterministic)
    console.debug('[AUTH] Session check error (non-401):', { code, message: err?.message });
    return { success: true, data: { user: null } } as const;
  }
}

export function translateAppwriteError(err: any): string {
  const code = err?.code || err?.response?.code;
  const message = err?.message || err?.response?.message || '';

  // Common mappings aligned to existing error strings
  if (code === 401) return 'Invalid email or password';
  if (code === 409 && /already exists/i.test(message)) return 'Email already in use';
  if (code === 429) return 'Too many attempts, please try again later';
  if (code === 400) return 'Invalid request, please check your input';

  return 'Something went wrong. Please try again.';
}
