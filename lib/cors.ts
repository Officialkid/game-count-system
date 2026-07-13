/**
 * CORS Middleware for API Routes
 *
 * Allows same-origin local development and explicit production frontend origins.
 *
 * Permitted:
 * - Custom token headers (X-ADMIN-TOKEN, X-SCORER-TOKEN, X-PUBLIC-TOKEN)
 * - JSON content type
 * - GET, POST, PUT, DELETE, PATCH methods
 */

const ALLOWED_ORIGINS = Array.from(
  new Set(
    [
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_URL,
      process.env.NEXT_PUBLIC_BASE_URL,
      'http://localhost:3002',
      'https://game-count-system.vercel.app',
    ].filter((value): value is string => Boolean(value))
  )
);

export function corsHeaders(origin?: string | null) {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const fallbackOrigin = ALLOWED_ORIGINS[0] || 'http://localhost:3002';
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : fallbackOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-ADMIN-TOKEN, X-SCORER-TOKEN, X-PUBLIC-TOKEN',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function handleCors(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers,
    });
  }
  
  return headers;
}
