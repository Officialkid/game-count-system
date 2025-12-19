"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAuthDiagnostics } from '@/lib/hooks/useAuthDiagnostics';

export default function AuthDebugPage() {
  const { login, register, logout } = useAuth();
  const { isLoading, authReady, isAuthenticated, user, sessionActive, localTokenPresent, refresh } = useAuthDiagnostics();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await login(loginEmail, loginPassword);
      setMessage('Login ok');
      await refresh();
    } catch (err: any) {
      setMessage(err?.message || 'Login failed');
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await register(regName, regEmail, regPassword);
      setMessage('Register ok');
      await refresh();
    } catch (err: any) {
      setMessage(err?.message || 'Register failed');
    }
  };

  const doLogout = async () => {
    setMessage(null);
    await logout();
    await refresh();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Auth Diagnostics</h1>

      <section className="p-4 rounded-lg border">
        <h2 className="font-semibold mb-2">Status</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <span className="font-mono">authReady:</span> {String(authReady)}
          </li>
          <li>
            <span className="font-mono">isLoading:</span> {String(isLoading)}
          </li>
          <li>
            <span className="font-mono">isAuthenticated:</span> {String(isAuthenticated)}
          </li>
          <li>
            <span className="font-mono">sessionActive (Appwrite):</span> {sessionActive === null ? '...' : String(sessionActive)}
          </li>
          <li>
            <span className="font-mono">localStorage token present:</span> <span className={localTokenPresent ? 'text-red-600 font-semibold' : ''}>{String(localTokenPresent)}</span>
          </li>
        </ul>
        <div className="mt-2">
          <button className="px-3 py-1 text-sm border rounded" onClick={refresh}>Recheck</button>
        </div>
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-semibold mb-2">User</h2>
        {user ? (
          <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        ) : (
          <div className="text-sm text-gray-600">No user</div>
        )}
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-semibold mb-3">Register</h2>
        <form className="grid gap-2" onSubmit={doRegister}>
          <input className="border rounded px-3 py-2" placeholder="Name" value={regName} onChange={(e)=>setRegName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Email" value={regEmail} onChange={(e)=>setRegEmail(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Password" type="password" value={regPassword} onChange={(e)=>setRegPassword(e.target.value)} />
          <button className="mt-1 px-3 py-2 border rounded bg-gray-50" type="submit" disabled={isLoading}>Register</button>
        </form>
      </section>

      <section className="p-4 rounded-lg border">
        <h2 className="font-semibold mb-3">Login</h2>
        <form className="grid gap-2" onSubmit={doLogin}>
          <input className="border rounded px-3 py-2" placeholder="Email" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Password" type="password" value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} />
          <button className="mt-1 px-3 py-2 border rounded bg-gray-50" type="submit" disabled={isLoading}>Login</button>
        </form>
      </section>

      <section className="p-4 rounded-lg border flex items-center justify-between">
        <div className="space-y-1 text-sm">
          <div>Refresh the page after login to verify session persistence.</div>
          <div className={localTokenPresent ? 'text-red-600' : 'text-gray-600'}>
            Expect no `token` in localStorage at any time.
          </div>
        </div>
        <button className="px-3 py-2 border rounded" onClick={doLogout}>Logout</button>
      </section>

      {message && (
        <div className="p-3 text-sm rounded border bg-gray-50">{message}</div>
      )}
    </div>
  );
}
