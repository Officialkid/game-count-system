import { NextRequest } from 'next/server';

/**
 * Resolves the canonical public base URL for generated share links.
 * Prefers the incoming request origin so links always match the host/port
 * the user is actually visiting (localhost:3000, LAN IP, or production domain).
 */
export function resolveAppBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  if (host) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isLocal =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  if (request.nextUrl?.origin && request.nextUrl.origin !== 'null') {
    return request.nextUrl.origin.replace(/\/$/, '');
  }

  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}
